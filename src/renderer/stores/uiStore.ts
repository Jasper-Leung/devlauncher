/**
 * UI 状态管理 Store
 * P1 优化：使用 Zustand 管理 UI 相关状态
 */

import { create } from 'zustand'
import type { ProjectConfig } from '../../shared/types'
import type { Language } from '../i18n/config'

/**
 * 视图模式
 */
export type ViewMode = 'grid' | 'list'

/**
 * UI 状态接口
 */
interface UIState {
  /** 主题 */
  theme: 'light' | 'dark'
  /** 视图模式 */
  viewMode: ViewMode
  /** 侧边栏宽度 */
  sidebarWidth: number
  /** 添加项目模态框是否打开 */
  isAddModalOpen: boolean
  /** 批量导入模态框是否打开 */
  isBatchImportOpen: boolean
  /** 分组管理模态框是否打开 */
  isManageGroupsOpen: boolean
  /** 新分组名称 */
  newGroupName: string
  /** 编辑中的项目 */
  editingProject: ProjectConfig | undefined
  /** 语言 */
  language: Language

  // Actions
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setViewMode: (mode: ViewMode) => void
  toggleViewMode: () => void
  setSidebarWidth: (width: number) => void
  openAddModal: (project?: ProjectConfig) => void
  closeAddModal: () => void
  openBatchImportModal: () => void
  closeBatchImportModal: () => void
  openManageGroups: () => void
  closeManageGroups: () => void
  setNewGroupName: (name: string) => void
  resetNewGroupName: () => void
  setLanguage: (lang: Language) => void
}

/**
 * 从 localStorage 加载主题
 */
function loadTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    return saved || 'dark'
  } catch {
    return 'dark'
  }
}

/**
 * 保存主题到 localStorage
 */
function saveTheme(theme: 'light' | 'dark') {
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // 忽略存储错误
  }
}

/**
 * 从 localStorage 加载语言
 */
function loadLanguage(): Language {
  try {
    const saved = localStorage.getItem('language') as Language | null
    return saved || 'zh'
  } catch {
    return 'zh'
  }
}

/**
 * 保存语言到 localStorage
 */
function saveLanguage(language: Language) {
  try {
    localStorage.setItem('language', language)
  } catch {
    // 忽略存储错误
  }
}

/**
 * 从 localStorage 加载侧边栏宽度
 */
function loadSidebarWidth(): number {
  try {
    const saved = localStorage.getItem('sidebarWidth')
    return saved ? Math.max(300, Math.min(1200, parseInt(saved, 10))) : 700
  } catch {
    return 700
  }
}

/**
 * 保存侧边栏宽度到 localStorage
 */
function saveSidebarWidth(width: number) {
  try {
    localStorage.setItem('sidebarWidth', width.toString())
  } catch {
    // 忽略存储错误
  }
}

/**
 * UI 状态管理 Store
 */
export const useUIStore = create<UIState>((set) => ({
  // 初始状态
  theme: loadTheme(),
  viewMode: 'grid',
  sidebarWidth: loadSidebarWidth(),
  isAddModalOpen: false,
  isBatchImportOpen: false,
  isManageGroupsOpen: false,
  newGroupName: '',
  editingProject: undefined,
  language: loadLanguage(),

  // 设置主题
  setTheme: (theme) => {
    saveTheme(theme)
    set({ theme })
    // 更新 DOM 属性
    document.documentElement.setAttribute('data-theme', theme)
  },

  // 切换主题
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark'
      saveTheme(newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
      return { theme: newTheme }
    }),

  // 设置视图模式
  setViewMode: (mode) => set({ viewMode: mode }),

  // 切换视图模式
  toggleViewMode: () =>
    set((state) => ({
      viewMode: state.viewMode === 'grid' ? 'list' : 'grid',
    })),

  // 设置侧边栏宽度
  setSidebarWidth: (width) => {
    const clampedWidth = Math.max(300, Math.min(1200, width))
    saveSidebarWidth(clampedWidth)
    set({ sidebarWidth: clampedWidth })
  },

  // 打开添加项目模态框
  openAddModal: (project) =>
    set({
      isAddModalOpen: true,
      editingProject: project,
    }),

  // 关闭添加项目模态框
  closeAddModal: () =>
    set({
      isAddModalOpen: false,
      editingProject: undefined,
    }),

  // 打开批量导入模态框
  openBatchImportModal: () => set({ isBatchImportOpen: true }),

  // 关闭批量导入模态框
  closeBatchImportModal: () => set({ isBatchImportOpen: false }),

  // 打开分组管理
  openManageGroups: () => set({ isManageGroupsOpen: true }),

  // 关闭分组管理
  closeManageGroups: () => set({ isManageGroupsOpen: false }),

  // 设置新分组名称
  setNewGroupName: (name) => set({ newGroupName: name }),

  // 重置新分组名称
  resetNewGroupName: () => set({ newGroupName: '' }),

  // 设置语言
  setLanguage: (lang) => {
    saveLanguage(lang)
    set({ language: lang })
  },
}))
