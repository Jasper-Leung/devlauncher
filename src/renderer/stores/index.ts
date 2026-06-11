/**
 * 状态管理 Store 统一导出
 * P1 优化：集中导出所有 Zustand stores 和相关 hooks
 */

// Project Store
export {
  useProjectStore,
  useFilteredProjects,
  useSelectedProject,
  useAllTags,
  useAllGroups,
} from './projectStore'

// UI Store
export { useUIStore, type ViewMode } from './uiStore'

// Batch Store
export { useBatchStore, useIsAllSelected, useSelectedIdsArray } from './batchStore'
