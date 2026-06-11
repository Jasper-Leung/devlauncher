/**
 * 项目侧边栏组件
 * P2 优化：从 App.tsx 拆分出来，负责显示项目列表、搜索、分组过滤等
 */

import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProjectConfig } from '../../shared/types'
import type { Language } from '../i18n/config'
import { filterProjects } from '../utils/projectFilters'
import { ProjectList } from './ProjectList'
import VirtualProjectList from './VirtualProjectList'
import { BatchActions } from './BatchActions'
import LanguageSwitcher from './LanguageSwitcher'
import { Resizer } from './Resizer'
import './ProjectSidebar.css'

interface ProjectSidebarProps {
  projects: ProjectConfig[]
  selectedId: string | null
  searchQuery: string
  selectedGroup: string | null
  isBatchMode: boolean
  selectedIds: Set<string>
  viewMode: 'grid' | 'list'
  sidebarWidth: number
  allTags: string[]
  allGroups: string[]
  theme: 'light' | 'dark'
  excludedTags: string[]
  isBatchProcessing?: boolean
  processingProgress?: {
    current: number
    total: number
    success: number
    failed: number
    currentItem?: string
  } | null
  language?: Language
  setLanguage?: (lang: Language) => void
  onSearchChange: (query: string) => void
  onProjectSelect: (id: string) => void
  onProjectToggle: (id: string) => void
  onProjectEdit: (project: ProjectConfig) => void
  onProjectDelete: (id: string) => void
  onToggleTheme: () => void
  onExportProjects: () => void
  onImportProjects: () => void
  onOpenAddModal: () => void
  onOpenBatchImport: () => void
  onToggleViewMode: () => void
  onSidebarWidthChange: (width: number) => void
  onBatchToggleMode: () => void
  onBatchToggleSelectAll: () => void
  onBatchStart: () => void
  onBatchStop: () => void
  onBatchDelete: () => void
  onOpenManageGroups: () => void
  onGroupSelect: (group: string | null) => void
  onTagSelect: (tag: string) => void
  onToggleExcludedTag: (tag: string) => void
}

/**
 * 项目侧边栏组件
 * P2 优化：使用 React.memo 防止不必要的重渲染
 */
const ProjectSidebarComponent: React.FC<ProjectSidebarProps> = React.memo<ProjectSidebarProps>(({
  projects,
  selectedId,
  searchQuery,
  selectedGroup,
  isBatchMode,
  selectedIds,
  viewMode,
  sidebarWidth,
  allTags,
  allGroups,
  theme,
  excludedTags,
  isBatchProcessing = false,
  processingProgress = null,
  language,
  setLanguage,
  onSearchChange,
  onProjectSelect,
  onProjectToggle,
  onProjectEdit,
  onProjectDelete,
  onToggleTheme,
  onExportProjects,
  onImportProjects,
  onOpenAddModal,
  onOpenBatchImport,
  onToggleViewMode,
  onSidebarWidthChange,
  onBatchToggleMode,
  onBatchToggleSelectAll,
  onBatchStart,
  onBatchStop,
  onBatchDelete,
  onOpenManageGroups,
  onGroupSelect,
  onTagSelect,
  onToggleExcludedTag,
}) => {
  const { t } = useTranslation()

  // 计算过滤后的项目数量（使用 useMemo 避免重复计算）
  const filteredProjects = useMemo(
    () => filterProjects(projects, { searchQuery, selectedGroup, excludedTags }),
    [projects, searchQuery, selectedGroup, excludedTags]
  )

  // 计算是否全选
  const isAllSelected = useMemo(
    () => filteredProjects.length > 0 && selectedIds.size === filteredProjects.length,
    [filteredProjects.length, selectedIds.size]
  )

  return (
    <div className="sidebar" style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}>
      {/* 宽度调节手柄 */}
      <Resizer width={sidebarWidth} onWidthChange={onSidebarWidthChange} />
      {/* 侧边栏头部 */}
      <div className="sidebar-header">
        <h2>{t('app.title')}</h2>
        <div className="header-actions">
          {language && setLanguage && <LanguageSwitcher />}
          <button
            className="icon-btn"
            onClick={onToggleTheme}
            title={t(theme === 'dark' ? 'theme.light' : 'theme.dark')}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="icon-btn" onClick={onExportProjects} title={t('sidebar.exportConfig')}>
            📤
          </button>
          <button className="icon-btn" onClick={onImportProjects} title={t('sidebar.importConfig')}>
            📥
          </button>
        </div>
      </div>

      {/* 顶部操作按钮 */}
      <div className="sidebar-top-actions">
        <button className="add-project-btn" onClick={onOpenAddModal}>
          <span>+</span> {t('sidebar.addProject')}
        </button>

        <button className="batch-import-btn" onClick={onOpenBatchImport}>
          <span>🔍</span> {t('sidebar.batchImport')}
        </button>

        <button
          className="view-toggle-btn"
          onClick={onToggleViewMode}
          title={t(viewMode === 'grid' ? 'sidebar.toggleListView' : 'sidebar.toggleGridView')}
        >
          {viewMode === 'grid' ? '☰' : '▦'}
        </button>

        <BatchActions
          isBatchMode={isBatchMode}
          selectedCount={selectedIds.size}
          filteredCount={filteredProjects.length}
          isAllSelected={isAllSelected}
          isProcessing={isBatchProcessing}
          processingProgress={processingProgress}
          onToggleBatchMode={onBatchToggleMode}
          onToggleSelectAll={onBatchToggleSelectAll}
          onBatchStart={onBatchStart}
          onBatchStop={onBatchStop}
          onBatchDelete={onBatchDelete}
        />
      </div>

      {/* 搜索框 */}
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder={t('sidebar.searchProjects')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* 分组过滤器 */}
      {allGroups.length > 0 && (
        <div className="group-filters">
          <div className="group-filters-header">
            <span>{t('sidebar.groups')}</span>
            <button
              className="icon-btn"
              onClick={onOpenManageGroups}
              title={t('sidebar.manageGroups')}
            >
              ⚙️️
            </button>
          </div>
          <div className="group-filters-list">
            <button
              className={`group-filter-btn ${!selectedGroup ? 'active' : ''}`}
              onClick={() => onGroupSelect(null)}
            >
              📁 {t('sidebar.allGroups')}
            </button>
            {allGroups.map((group) => (
              <button
                key={group}
                className={`group-filter-btn ${selectedGroup === group ? 'active' : ''}`}
                onClick={() => onGroupSelect(group)}
              >
                📂 {group}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 快速标签过滤 */}
      {allTags.length > 0 && (
        <div className="tag-filters">
          <div className="tag-filters-header">{t('sidebar.quickFilter')}</div>
          <div className="tag-filters-list">
            <button
              className={`tag-filter-btn ${!searchQuery ? 'active' : ''}`}
              onClick={() => onTagSelect('')}
            >
              {t('common.all')}
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`tag-filter-btn ${searchQuery === tag ? 'active' : ''}`}
                onClick={() => onTagSelect(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 排除标签过滤器 */}
      {allTags.length > 0 && (
        <div className="tag-filters tag-exclude-filters">
          <div className="tag-filters-header">
            <span>{t('sidebar.excludeTags')}</span>
            <span className="tag-count">
              {excludedTags.length > 0
                ? t('sidebar.excludeTagsCount', { count: excludedTags.length })
                : ''}
            </span>
          </div>
          <div className="tag-filters-list">
            {allTags.map((tag) => (
              <button
                key={`exclude-${tag}`}
                className={`tag-filter-btn excluded ${excludedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => onToggleExcludedTag(tag)}
                title={t(
                  excludedTags.includes(tag) ? 'sidebar.clickToInclude' : 'sidebar.clickToExclude'
                )}
              >
                {excludedTags.includes(tag) ? '✕ ' : '○ '}
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 项目列表 */}
      {filteredProjects.length > 20 ? (
        <VirtualProjectList
          projects={projects}
          selectedId={selectedId}
          searchQuery={searchQuery}
          selectedGroup={selectedGroup}
          isBatchMode={isBatchMode}
          selectedIds={selectedIds}
          viewMode={viewMode}
          excludedTags={excludedTags}
          onProjectSelect={onProjectSelect}
          onProjectToggle={onProjectToggle}
          onProjectEdit={onProjectEdit}
          onProjectDelete={onProjectDelete}
        />
      ) : (
        <ProjectList
          projects={projects}
          selectedId={selectedId}
          searchQuery={searchQuery}
          selectedGroup={selectedGroup}
          isBatchMode={isBatchMode}
          selectedIds={selectedIds}
          viewMode={viewMode}
          excludedTags={excludedTags}
          onProjectSelect={onProjectSelect}
          onProjectToggle={onProjectToggle}
          onProjectEdit={onProjectEdit}
          onProjectDelete={onProjectDelete}
        />
      )}
    </div>
  )
})

ProjectSidebarComponent.displayName = 'ProjectSidebar'

export const ProjectSidebar = ProjectSidebarComponent

export default ProjectSidebar
