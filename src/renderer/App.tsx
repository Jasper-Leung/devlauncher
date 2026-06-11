import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProjectConfig } from '../shared/types'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Toast } from './components/Toast'
import ProjectSidebar from './components/ProjectSidebar'
import MainContent from './components/MainContent'
import GroupManagerModal from './components/GroupManagerModal'
import { useToast } from './hooks/useToast'
import { useBatchOperations } from './hooks/useBatchOperations'
import { getGroupsFromProjects } from './utils/projectHelpers.js'
import { LOG_LIMITS } from './utils/constants'
import { getErrorMessage } from '../shared/errorTypes'
import { initPreload } from './utils/preloader'
import { createLogger } from './utils/logger'
import { useUIStore } from './stores/uiStore'
import i18n from './i18n'

const logger = createLogger('App')

// P3 优化：使用懒加载延迟加载大型组件
// AddProjectModal (706行) 和 BatchImportModal 都是大型组件
const AddProjectModal = lazy(() =>
  import('./components/AddProjectModal').then((m) => ({ default: m.AddProjectModal }))
)
const BatchImportModal = lazy(() =>
  import('./components/BatchImportModal').then((m) => ({ default: m.BatchImportModal }))
)

/**
 * 主应用组件
 * P3 优化：使用懒加载进行代码分割，减少初始加载体积
 */
const AppContent: React.FC = () => {
  const { t } = useTranslation()
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    isAddModalOpen,
    closeAddModal,
    openAddModal,
    isBatchImportOpen,
    closeBatchImportModal,
    openBatchImportModal,
    isManageGroupsOpen,
    closeManageGroups,
    openManageGroups,
    viewMode,
    toggleViewMode,
    sidebarWidth,
    setSidebarWidth,
    editingProject,
  } = useUIStore()
  const [projects, setProjects] = useState<ProjectConfig[]>([])
  const [logs, setLogs] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [excludedTags, setExcludedTags] = useState<string[]>([])

  // P2 优化：添加批量操作进度状态
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{
    current: number
    total: number
    success: number
    failed: number
    currentItem?: string
  } | null>(null)

  const { toast, showToast, clearToast } = useToast()

  const batchOps = useBatchOperations(projects, (p) => p.id)

  // 初始化 i18n 语言
  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language)
    }
  }, [language])

  // 应用主题到文档
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleExcludedTag = (tag: string) => {
    setExcludedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const loadProjects = useCallback(async () => {
    const data = await window.electronAPI.getProjects()
    setProjects(data)
  }, [])

  const handleAddProject = async (project: Omit<ProjectConfig, 'id' | 'status'>) => {
    try {
      await window.electronAPI.addProject(project)
      await loadProjects()
      showToast('success', t('project.added'))
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      logger.error('添加项目失败', error)
      showToast('error', t('project.addFailed', { error: errorMsg }))
    }
  }

  const handleEditProject = async (id: string, updates: Partial<ProjectConfig>) => {
    try {
      logger.debug('更新项目', { id, updates })
      const result = await window.electronAPI.updateProject(id, updates)
      logger.debug('更新项目结果', result)
      await loadProjects()
      showToast('success', t('project.updated'))
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      logger.error('更新项目失败', error)
      showToast('error', t('project.updateFailed', { error: errorMsg }))
    }
  }

  const handleDeleteProject = useCallback(
    async (id: string) => {
      if (window.confirm(t('project.deleteConfirm'))) {
        try {
          await window.electronAPI.deleteProject(id)
          await loadProjects()
          if (selectedProjectId === id) {
            setSelectedProjectId(null)
          }
          showToast('success', t('project.deleted'))
        } catch (error) {
          const errorMsg = getErrorMessage(error)
          logger.error('删除项目失败', error)
          showToast('error', t('project.deleteFailed', { error: errorMsg }))
        }
      }
    },
    [selectedProjectId, showToast, loadProjects, t]
  )

  const handleOpenEditModal = useCallback(
    (project: ProjectConfig) => {
      openAddModal(project)
    },
    [openAddModal]
  )

  const handleExportProjects = useCallback(async () => {
    try {
      const result = await window.electronAPI.exportProjects()
      if (result.success) {
        showToast('success', t('toast.exportSuccess', { path: result.path }))
      } else if (!result.canceled) {
        const errorMsg = result.error || t('toast.exportFailed')
        showToast('error', errorMsg)
      }
    } catch (error) {
      logger.error('导出项目配置失败', error)
      showToast('error', t('toast.exportFailed'))
    }
  }, [showToast, t])

  const handleImportProjects = useCallback(async () => {
    try {
      const result = await window.electronAPI.importProjects()
      if (result.success) {
        await loadProjects()
        showToast('success', t('toast.importSuccess', { count: result.imported }))
      } else if (!result.canceled) {
        const errorMsg = result.errors || t('toast.importFailed')
        showToast('error', errorMsg)
      }
    } catch (error) {
      logger.error('导入项目配置失败', error)
      showToast('error', t('toast.importFailed'))
    }
  }, [showToast, loadProjects, t])

  const startProfile = useCallback((project: ProjectConfig, profileId: string) => {
    window.electronAPI.startProfile(project, profileId)
  }, [])

  const stopProject = useCallback((project: ProjectConfig) => {
    window.electronAPI.stopProject(project.id)
  }, [])

  const openIde = useCallback(
    (project: ProjectConfig) => {
      window.electronAPI.openIde(project)
      showToast('success', t('toast.openingIde'))
    },
    [showToast, t]
  )

  const openFolder = useCallback(
    (project: ProjectConfig) => {
      window.electronAPI.openFolder(project)
      showToast('success', t('toast.openingFolder'))
    },
    [showToast, t]
  )

  const openTerminal = (project: ProjectConfig) => {
    window.electronAPI.openTerminal(project)
    showToast('success', t('toast.openingTerminal'))
  }

  const runCustomCommand = (project: ProjectConfig, commandName: string) => {
    window.electronAPI.runCustomCommand(project, commandName)
  }

  // 批量操作（P2 优化：添加进度显示）
  const batchStartProjects = async () => {
    if (batchOps.selectedIds.size === 0) {
      showToast('warning', t('batchActions.selectProjects'))
      return
    }

    setIsBatchProcessing(true)
    const selectedIdsArray = Array.from(batchOps.selectedIds)
    let startedCount = 0
    let failedCount = 0

    for (let i = 0; i < selectedIdsArray.length; i++) {
      const id = selectedIdsArray[i]
      const project = projects.find((p) => p.id === id)

      setBatchProgress({
        current: i + 1,
        total: selectedIdsArray.length,
        success: startedCount,
        failed: failedCount,
        currentItem: project?.name,
      })

      if (
        project &&
        project.status !== 'running' &&
        project.startupProfiles &&
        project.startupProfiles.length > 0
      ) {
        try {
          const defaultProfile =
            project.startupProfiles.find((p) => p.isDefault) || project.startupProfiles[0]
          if (defaultProfile) {
            startProfile(project, defaultProfile.id)
            startedCount++
          }
        } catch {
          failedCount++
        }
      }

      // 添加小延迟以便用户看到进度
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    setBatchProgress(null)
    setIsBatchProcessing(false)
    const failedText =
      failedCount > 0 ? t('batchActions.partialFailed', { failed: failedCount }) : ''
    showToast('success', t('batchActions.started', { count: startedCount }) + failedText)
  }

  const batchStopProjects = async () => {
    if (batchOps.selectedIds.size === 0) {
      showToast('warning', t('batchActions.stopSelectProjects'))
      return
    }

    setIsBatchProcessing(true)
    const selectedIdsArray = Array.from(batchOps.selectedIds)
    let stoppedCount = 0
    let failedCount = 0

    for (let i = 0; i < selectedIdsArray.length; i++) {
      const id = selectedIdsArray[i]
      const project = projects.find((p) => p.id === id)

      setBatchProgress({
        current: i + 1,
        total: selectedIdsArray.length,
        success: stoppedCount,
        failed: failedCount,
        currentItem: project?.name,
      })

      if (project && project.status === 'running') {
        try {
          stopProject(project)
          stoppedCount++
        } catch {
          failedCount++
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    setBatchProgress(null)
    setIsBatchProcessing(false)
    const failedText =
      failedCount > 0 ? t('batchActions.partialFailed', { failed: failedCount }) : ''
    showToast('success', t('batchActions.stopped', { count: stoppedCount }) + failedText)
  }

  const batchDeleteProjects = async () => {
    if (batchOps.selectedIds.size === 0) {
      showToast('warning', t('batchActions.deleteSelectProjects'))
      return
    }

    if (window.confirm(t('project.deleteBatchConfirm', { count: batchOps.selectedIds.size }))) {
      setIsBatchProcessing(true)
      const selectedIdsArray = Array.from(batchOps.selectedIds)
      let deletedCount = 0
      let failedCount = 0

      for (let i = 0; i < selectedIdsArray.length; i++) {
        const id = selectedIdsArray[i]
        const project = projects.find((p) => p.id === id)

        setBatchProgress({
          current: i + 1,
          total: selectedIdsArray.length,
          success: deletedCount,
          failed: failedCount,
          currentItem: project?.name,
        })

        try {
          await window.electronAPI.deleteProject(id)
          deletedCount++
        } catch (error) {
          failedCount++
          logger.error(`删除项目 ${id} 失败`, error)
        }

        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      setBatchProgress(null)
      setIsBatchProcessing(false)
      await loadProjects()
      batchOps.clearSelection()
      if (failedCount > 0) {
        showToast(
          'warning',
          t('toast.batchPartialDeleted', { deleted: deletedCount, failed: failedCount })
        )
      } else {
        showToast('success', t('toast.batchDeleted', { count: deletedCount }))
      }
    }
  }

  // 分组管理
  const createGroup = async (groupName: string) => {
    if (!groupName.trim()) {
      showToast('warning', t('groupManager.enterName'))
      return
    }

    const trimmedName = groupName.trim()
    const existingGroups = getGroupsFromProjects(projects)

    if (existingGroups.includes(trimmedName)) {
      showToast('warning', t('groupManager.exists'))
      return
    }

    showToast('success', t('groupManager.createSuccess', { name: trimmedName }))
  }

  const deleteGroup = async (groupName: string) => {
    if (!window.confirm(t('groupManager.deleteConfirm', { name: groupName }))) {
      return
    }

    const updates = projects
      .filter((p) => p.group === groupName)
      .map((p) => window.electronAPI.updateProject(p.id, { group: undefined }))

    await Promise.all(updates)
    await loadProjects()

    if (selectedGroup === groupName) {
      setSelectedGroup(null)
    }

    showToast('success', t('groupManager.deleteSuccess', { name: groupName }))
  }

  // 提取所有唯一的标签用于快速过滤（使用 useMemo 优化性能）
  const allTags = useMemo(() => {
    return Array.from(new Set(projects.flatMap((p) => p.tags || []))).sort()
  }, [projects])
  const allGroups = useMemo(() => {
    return getGroupsFromProjects(projects)
  }, [projects])

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null

  // 初始化项目列表
  useEffect(() => {
    let mounted = true
    const init = async () => {
      const data = await window.electronAPI.getProjects()
      if (mounted) {
        setProjects(data)
      }
    }
    init()
    return () => {
      mounted = false
    }
  }, [])

  // P3 优化：初始化预加载，在空闲时预加载常用组件
  useEffect(() => {
    // 延迟初始化预加载，避免影响应用启动
    const timer = setTimeout(() => {
      initPreload()
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // 注册全局快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        openAddModal()
        return
      }

      if (e.ctrlKey && e.key === 'o' && selectedProjectId) {
        e.preventDefault()
        const project = projects.find((p) => p.id === selectedProjectId)
        if (project) {
          openIde(project)
        }
        return
      }

      if (e.ctrlKey && e.code === 'Space' && selectedProjectId) {
        e.preventDefault()
        const project = projects.find((p) => p.id === selectedProjectId)
        if (project) {
          if (project.status === 'running') {
            stopProject(project)
            showToast('success', t('toast.projectStopped'))
          } else if (project.startupProfiles && project.startupProfiles.length > 0) {
            const defaultProfile =
              project.startupProfiles.find((p) => p.isDefault) || project.startupProfiles[0]
            if (defaultProfile) {
              startProfile(project, defaultProfile.id)
            }
          }
        }
        return
      }

      if (e.key === 'Delete' && selectedProjectId && !batchOps.isBatchMode) {
        e.preventDefault()
        handleDeleteProject(selectedProjectId)
        return
      }

      if (e.ctrlKey && e.key === 'e' && selectedProjectId) {
        e.preventDefault()
        const project = projects.find((p) => p.id === selectedProjectId)
        if (project) {
          handleOpenEditModal(project)
        }
        return
      }

      if (e.key === 'Escape') {
        if (isAddModalOpen) {
          closeAddModal()
        } else if (selectedProjectId) {
          setSelectedProjectId(null)
        }
        return
      }

      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault()
        handleExportProjects()
        return
      }

      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault()
        handleImportProjects()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    selectedProjectId,
    projects,
    isAddModalOpen,
    closeAddModal,
    openAddModal,
    openIde,
    stopProject,
    startProfile,
    showToast,
    handleDeleteProject,
    handleOpenEditModal,
    handleExportProjects,
    handleImportProjects,
    batchOps.isBatchMode,
    t,
  ])

  // 处理命令输出（添加日志大小限制防止内存泄漏）
  useEffect(() => {
    const unsubscribe = window.electronAPI.onCommandOutput(
      (data: { projectId: string; profileId?: string; data: string }) => {
        const logKey = data.profileId ? `${data.projectId}-${data.profileId}` : data.projectId
        setLogs((prev) => {
          const currentLog = prev[logKey] || ''
          const combined = currentLog + data.data

          // 限制日志大小（P0 改进：防止内存泄漏）
          if (combined.length > LOG_LIMITS.MAX_LOG_LENGTH) {
            const excess = combined.length - LOG_LIMITS.MAX_LOG_LENGTH
            const truncated = combined.slice(excess)
            return {
              ...prev,
              [logKey]: truncated + `\n[日志已截断，丢弃了 ${excess} 个字符]\n`,
            }
          }

          return {
            ...prev,
            [logKey]: combined,
          }
        })
      }
    )

    return () => unsubscribe?.()
  }, [])

  // 处理项目状态更新
  useEffect(() => {
    const unsubscribe = window.electronAPI.onProjectStatusUpdated(
      (projectId: string, status: 'running' | 'stopped', profileId?: string) => {
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id === projectId) {
              const updated = { ...p, status }
              if (profileId) {
                updated.activeProfileId = profileId
              } else {
                updated.activeProfileId = undefined
              }
              return updated
            }
            return p
          })
        )
      }
    )

    return () => unsubscribe?.()
  }, [])

  const clearProjectLogs = (projectId: string) => {
    const newLogs: Record<string, string> = {}
    Object.entries(logs).forEach(([key, value]) => {
      if (!key.startsWith(projectId)) {
        newLogs[key] = value
      }
    })
    setLogs(newLogs)
  }

  return (
    <div className="app-container">
      {/* P2 优化：使用拆分的侧边栏组件 */}
      <ProjectSidebar
        projects={projects}
        selectedId={selectedProjectId}
        searchQuery={searchQuery}
        selectedGroup={selectedGroup}
        isBatchMode={batchOps.isBatchMode}
        selectedIds={batchOps.selectedIds}
        viewMode={viewMode}
        sidebarWidth={sidebarWidth}
        allTags={allTags}
        allGroups={allGroups}
        theme={theme}
        excludedTags={excludedTags}
        isBatchProcessing={isBatchProcessing}
        processingProgress={batchProgress}
        onSearchChange={setSearchQuery}
        onProjectSelect={setSelectedProjectId}
        onProjectToggle={batchOps.toggleSelection}
        onProjectEdit={handleOpenEditModal}
        onProjectDelete={handleDeleteProject}
        onToggleTheme={toggleTheme}
        onExportProjects={handleExportProjects}
        onImportProjects={handleImportProjects}
        onOpenAddModal={() => {
          openAddModal()
        }}
        onOpenBatchImport={() => openBatchImportModal()}
        onToggleViewMode={() => toggleViewMode()}
        onSidebarWidthChange={setSidebarWidth}
        onBatchToggleMode={batchOps.toggleBatchMode}
        onBatchToggleSelectAll={batchOps.toggleSelectAll}
        onBatchStart={batchStartProjects}
        onBatchStop={batchStopProjects}
        onBatchDelete={batchDeleteProjects}
        onOpenManageGroups={() => openManageGroups()}
        onGroupSelect={setSelectedGroup}
        onTagSelect={setSearchQuery}
        onToggleExcludedTag={toggleExcludedTag}
        language={language}
        setLanguage={setLanguage}
      />

      {/* P2 优化：使用拆分的主内容区域组件 */}
      <MainContent
        selectedProject={selectedProject}
        logs={logs}
        onStartProfile={startProfile}
        onStopProject={stopProject}
        onOpenIde={openIde}
        onOpenFolder={openFolder}
        onOpenTerminal={openTerminal}
        onEditProject={handleOpenEditModal}
        onRunCustomCommand={runCustomCommand}
        onClearLogs={clearProjectLogs}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* 添加/编辑项目对话框 - P3 优化：懒加载 */}
      <Suspense fallback={null}>
        <AddProjectModal
          isOpen={isAddModalOpen}
          onClose={() => {
            closeAddModal()
          }}
          onAdd={handleAddProject}
          editProject={editingProject}
          onEdit={handleEditProject}
        />
      </Suspense>

      {/* Toast 通知 */}
      {toast && <Toast message={toast} onClose={clearToast} />}

      {/* P2 优化：使用拆分的分组管理模态框组件 */}
      <GroupManagerModal
        isOpen={isManageGroupsOpen}
        projects={projects}
        selectedGroup={selectedGroup}
        onClose={() => closeManageGroups()}
        onCreateGroup={createGroup}
        onDeleteGroup={deleteGroup}
        onGroupSelect={setSelectedGroup}
      />

      {/* 批量导入对话框 - P3 优化：懒加载 */}
      <Suspense fallback={null}>
        <BatchImportModal
          isOpen={isBatchImportOpen}
          onClose={() => closeBatchImportModal()}
          onImportComplete={async (added, skipped) => {
            await loadProjects()
            showToast('success', t('toast.importComplete', { added, skipped }))
          }}
        />
      </Suspense>
    </div>
  )
}

/**
 * 主应用组件（带错误边界）
 * P0 改进：使用 ErrorBoundary 包装整个应用，防止应用崩溃
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logger.error('全局错误捕获:', error)
        logger.error('组件堆栈:', errorInfo.componentStack)
      }}
    >
      <AppContent />
    </ErrorBoundary>
  )
}

export default App
