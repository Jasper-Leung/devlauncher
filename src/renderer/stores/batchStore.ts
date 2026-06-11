/**
 * 批量操作状态管理 Store
 * P1 优化：使用 Zustand 管理批量选择状态
 */

import { create } from 'zustand'

/**
 * 批量操作状态接口
 */
interface BatchState {
  /** 是否处于批量模式 */
  isBatchMode: boolean
  /** 选中的项目 ID 集合 */
  selectedIds: Set<string>

  // Actions
  toggleBatchMode: () => void
  setBatchMode: (enabled: boolean) => void
  toggleSelection: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  isSelected: (id: string) => boolean
  selectedCount: () => number
}

/**
 * 批量操作状态管理 Store
 */
export const useBatchStore = create<BatchState>((set, get) => ({
  // 初始状态
  isBatchMode: false,
  selectedIds: new Set<string>(),

  // 切换批量模式
  toggleBatchMode: () =>
    set((state) => {
      if (state.isBatchMode) {
        // 退出批量模式时清空选择
        return { isBatchMode: false, selectedIds: new Set() }
      } else {
        return { isBatchMode: true }
      }
    }),

  // 设置批量模式
  setBatchMode: (enabled) =>
    set({
      isBatchMode: enabled,
      selectedIds: enabled ? get().selectedIds : new Set(),
    }),

  // 切换单个项目选择状态
  toggleSelection: (id) =>
    set((state) => {
      const newSelectedIds = new Set(state.selectedIds)
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id)
      } else {
        newSelectedIds.add(id)
      }
      return { selectedIds: newSelectedIds }
    }),

  // 全选
  selectAll: (ids) =>
    set({
      selectedIds: new Set(ids),
    }),

  // 清空选择
  clearSelection: () =>
    set({
      selectedIds: new Set(),
    }),

  // 检查是否选中
  isSelected: (id) => get().selectedIds.has(id),

  // 获取选中数量
  selectedCount: () => get().selectedIds.size,
}))

/**
 * 选择器：检查是否全选
 */
export const useIsAllSelected = (totalIds: string[]) => {
  const selectedIds = useBatchStore((state) => state.selectedIds)
  return totalIds.length > 0 && selectedIds.size === totalIds.length
}

/**
 * 选择器：获取选中项目的 ID 数组
 */
export const useSelectedIdsArray = () => {
  const selectedIds = useBatchStore((state) => state.selectedIds)
  return Array.from(selectedIds)
}
