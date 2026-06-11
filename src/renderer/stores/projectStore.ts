/**
 * 项目状态管理 Store
 * P1 优化：使用 Zustand 进行全局状态管理，减少 props drilling
 */

import { create } from 'zustand'
import type { ProjectConfig } from '../../shared/types'
import { LOG_LIMITS } from '../utils/constants'

/**
 * 项目状态接口
 */
interface ProjectState {
  /** 所有项目列表 */
  projects: ProjectConfig[]
  /** 当前选中的项目 ID */
  selectedProjectId: string | null
  /** 搜索查询 */
  searchQuery: string
  /** 选中的分组 */
  selectedGroup: string | null
  /** 日志数据 */
  logs: Record<string, string>

  // Actions
  setProjects: (projects: ProjectConfig[]) => void
  addProject: (project: ProjectConfig) => void
  updateProject: (id: string, updates: Partial<ProjectConfig>) => void
  removeProject: (id: string) => void
  setSelectedProjectId: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setSelectedGroup: (group: string | null) => void
  appendLog: (projectId: string, profileId: string | undefined, data: string) => void
  clearLogs: (projectId: string) => void
  clearAllLogs: () => void
  loadProjects: () => Promise<void>
}

/**
 * 项目状态管理 Store
 */
export const useProjectStore = create<ProjectState>((set) => ({
  // 初始状态
  projects: [],
  selectedProjectId: null,
  searchQuery: '',
  selectedGroup: null,
  logs: {},

  // 设置所有项目
  setProjects: (projects) => set({ projects }),

  // 添加单个项目
  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, project],
    })),

  // 更新项目
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  // 删除项目
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
    })),

  // 设置选中项目
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),

  // 设置搜索查询
  setSearchQuery: (query) => set({ searchQuery: query }),

  // 设置选中分组
  setSelectedGroup: (group) => set({ selectedGroup: group }),

  // 追加日志（带大小限制）
  appendLog: (projectId, profileId, data) =>
    set((state) => {
      const logKey = profileId ? `${projectId}-${profileId}` : projectId
      const currentLog = state.logs[logKey] || ''
      const combined = currentLog + data

      // 限制日志大小（为警告消息预留空间）
      const warningMessage = '\n[日志已截断]'
      const limitedLog =
        combined.length > LOG_LIMITS.MAX_LOG_LENGTH
          ? combined.slice(combined.length - (LOG_LIMITS.MAX_LOG_LENGTH - warningMessage.length)) +
            warningMessage
          : combined

      return {
        logs: {
          ...state.logs,
          [logKey]: limitedLog,
        },
      }
    }),

  // 清除指定项目的日志
  clearLogs: (projectId) =>
    set((state) => {
      const newLogs: Record<string, string> = {}
      for (const [key, value] of Object.entries(state.logs)) {
        if (!key.startsWith(projectId)) {
          newLogs[key] = value
        }
      }
      return { logs: newLogs }
    }),

  // 清除所有日志
  clearAllLogs: () => set({ logs: {} }),

  // 从主进程加载项目
  loadProjects: async () => {
    try {
      const data = await window.electronAPI.getProjects()
      set({ projects: data })
    } catch (error) {
      console.error('加载项目失败:', error)
      throw error
    }
  },
}))

/**
 * 选择器：获取过滤后的项目列表
 */
export const useFilteredProjects = () => {
  const projects = useProjectStore((state) => state.projects)
  const searchQuery = useProjectStore((state) => state.searchQuery)
  const selectedGroup = useProjectStore((state) => state.selectedGroup)

  return projects.filter((project) => {
    // 分组过滤
    if (selectedGroup && project.group !== selectedGroup) {
      return false
    }

    // 搜索过滤
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      project.name.toLowerCase().includes(query) ||
      project.path.toLowerCase().includes(query) ||
      project.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
      project.description?.toLowerCase().includes(query)
    )
  })
}

/**
 * 选择器：获取当前选中的项目
 */
export const useSelectedProject = () => {
  const projects = useProjectStore((state) => state.projects)
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId)

  return projects.find((p) => p.id === selectedProjectId) || null
}

/**
 * 选择器：获取所有唯一的标签
 */
export const useAllTags = () => {
  const projects = useProjectStore((state) => state.projects)
  return Array.from(new Set(projects.flatMap((p) => p.tags || []))).sort()
}

/**
 * 选择器：获取所有唯一的分组
 */
export const useAllGroups = () => {
  const projects = useProjectStore((state) => state.projects)
  const groups = new Set<string>()
  projects.forEach((p) => {
    if (p.group) groups.add(p.group)
  })
  return Array.from(groups).sort()
}
