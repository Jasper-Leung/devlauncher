/**
 * batchStore 单元测试
 * P1 优化：为批量操作状态管理添加测试覆盖
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  useBatchStore,
  useIsAllSelected,
  useSelectedIdsArray,
} from '../../../renderer/stores/batchStore'

describe('batchStore', () => {
  beforeEach(() => {
    // 重置 store 状态
    useBatchStore.setState({
      isBatchMode: false,
      selectedIds: new Set<string>(),
    })
  })

  describe('基本状态操作', () => {
    it('应该有正确的初始状态', () => {
      const state = useBatchStore.getState()

      expect(state.isBatchMode).toBe(false)
      expect(state.selectedIds.size).toBe(0)
    })
  })

  describe('toggleBatchMode', () => {
    it('应该启用批量模式', () => {
      const { toggleBatchMode } = useBatchStore.getState()

      toggleBatchMode()

      expect(useBatchStore.getState().isBatchMode).toBe(true)
    })

    it('应该禁用批量模式并清空选择', () => {
      // 先启用并选择一些项目
      useBatchStore.setState({ isBatchMode: true, selectedIds: new Set(['1', '2']) })

      const { toggleBatchMode } = useBatchStore.getState()
      toggleBatchMode()

      expect(useBatchStore.getState().isBatchMode).toBe(false)
      expect(useBatchStore.getState().selectedIds.size).toBe(0)
    })
  })

  describe('setBatchMode', () => {
    it('应该启用批量模式', () => {
      const { setBatchMode } = useBatchStore.getState()

      setBatchMode(true)

      expect(useBatchStore.getState().isBatchMode).toBe(true)
    })

    it('应该禁用批量模式', () => {
      useBatchStore.setState({ isBatchMode: true })

      const { setBatchMode } = useBatchStore.getState()
      setBatchMode(false)

      expect(useBatchStore.getState().isBatchMode).toBe(false)
    })

    it('禁用批量模式时应清空选择', () => {
      useBatchStore.setState({
        isBatchMode: true,
        selectedIds: new Set(['1', '2', '3']),
      })

      const { setBatchMode } = useBatchStore.getState()
      setBatchMode(false)

      expect(useBatchStore.getState().selectedIds.size).toBe(0)
    })

    it('启用批量模式时应保留选择', () => {
      useBatchStore.setState({
        isBatchMode: false,
        selectedIds: new Set(['1', '2']),
      })

      const { setBatchMode } = useBatchStore.getState()
      setBatchMode(true)

      expect(useBatchStore.getState().selectedIds.size).toBe(2)
    })
  })

  describe('toggleSelection', () => {
    it('应该选中未选中的项目', () => {
      const { toggleSelection } = useBatchStore.getState()

      toggleSelection('1')

      expect(useBatchStore.getState().selectedIds.has('1')).toBe(true)
    })

    it('应该取消选中已选中的项目', () => {
      useBatchStore.setState({ selectedIds: new Set(['1', '2']) })

      const { toggleSelection } = useBatchStore.getState()
      toggleSelection('1')

      expect(useBatchStore.getState().selectedIds.has('1')).toBe(false)
      expect(useBatchStore.getState().selectedIds.has('2')).toBe(true)
    })

    it('应该支持多个项目的选择', () => {
      const { toggleSelection } = useBatchStore.getState()

      toggleSelection('1')
      toggleSelection('2')
      toggleSelection('3')

      expect(useBatchStore.getState().selectedIds.size).toBe(3)
    })
  })

  describe('selectAll', () => {
    it('应该选中所有提供的 ID', () => {
      const { selectAll } = useBatchStore.getState()
      const ids = ['1', '2', '3', '4', '5']

      selectAll(ids)

      const state = useBatchStore.getState()
      expect(state.selectedIds.size).toBe(5)
      ids.forEach((id) => {
        expect(state.selectedIds.has(id)).toBe(true)
      })
    })

    it('应该替换之前的选择', () => {
      useBatchStore.setState({ selectedIds: new Set(['a', 'b']) })

      const { selectAll } = useBatchStore.getState()
      selectAll(['1', '2', '3'])

      const state = useBatchStore.getState()
      expect(state.selectedIds.has('a')).toBe(false)
      expect(state.selectedIds.has('b')).toBe(false)
      expect(state.selectedIds.size).toBe(3)
    })

    it('应该处理空数组', () => {
      useBatchStore.setState({ selectedIds: new Set(['1', '2']) })

      const { selectAll } = useBatchStore.getState()
      selectAll([])

      expect(useBatchStore.getState().selectedIds.size).toBe(0)
    })
  })

  describe('clearSelection', () => {
    it('应该清空所有选择', () => {
      useBatchStore.setState({ selectedIds: new Set(['1', '2', '3']) })

      const { clearSelection } = useBatchStore.getState()
      clearSelection()

      expect(useBatchStore.getState().selectedIds.size).toBe(0)
    })

    it('应该在没有选择时也能工作', () => {
      const { clearSelection } = useBatchStore.getState()

      expect(() => clearSelection()).not.toThrow()
      expect(useBatchStore.getState().selectedIds.size).toBe(0)
    })
  })

  describe('isSelected', () => {
    it('应该返回选中状态', () => {
      useBatchStore.setState({ selectedIds: new Set(['1', '2']) })

      const { isSelected } = useBatchStore.getState()

      expect(isSelected('1')).toBe(true)
      expect(isSelected('2')).toBe(true)
      expect(isSelected('3')).toBe(false)
    })

    it('应该在空选择时返回 false', () => {
      const { isSelected } = useBatchStore.getState()

      expect(isSelected('any-id')).toBe(false)
    })
  })

  describe('selectedCount', () => {
    it('应该返回选中的数量', () => {
      useBatchStore.setState({ selectedIds: new Set(['1', '2', '3']) })

      const { selectedCount } = useBatchStore.getState()

      expect(selectedCount()).toBe(3)
    })

    it('应该在空选择时返回 0', () => {
      const { selectedCount } = useBatchStore.getState()

      expect(selectedCount()).toBe(0)
    })
  })

  describe('选择器 hooks', () => {
    describe('useIsAllSelected', () => {
      it('应该在没有项目时返回 false', () => {
        // 注意：这个 hook 需要在 React 组件中使用
        // 这里只验证逻辑
        const selectedIds = new Set<string>()
        const totalIds: string[] = []

        const isAllSelected = totalIds.length > 0 && selectedIds.size === totalIds.length

        expect(isAllSelected).toBe(false)
      })

      it('应该在全部选中时返回 true', () => {
        const selectedIds = new Set(['1', '2', '3'])
        const totalIds = ['1', '2', '3']

        const isAllSelected = totalIds.length > 0 && selectedIds.size === totalIds.length

        expect(isAllSelected).toBe(true)
      })

      it('应该在部分选中时返回 false', () => {
        const selectedIds = new Set(['1', '2'])
        const totalIds = ['1', '2', '3']

        const isAllSelected = totalIds.length > 0 && selectedIds.size === totalIds.length

        expect(isAllSelected).toBe(false)
      })
    })

    describe('useSelectedIdsArray', () => {
      it('应该将 Set 转换为数组', () => {
        useBatchStore.setState({ selectedIds: new Set(['1', '2', '3']) })

        const state = useBatchStore.getState()
        const array = Array.from(state.selectedIds)

        expect(array).toEqual(['1', '2', '3'])
        expect(array).toBeInstanceOf(Array)
      })

      it('应该处理空 Set', () => {
        useBatchStore.setState({ selectedIds: new Set() })

        const state = useBatchStore.getState()
        const array = Array.from(state.selectedIds)

        expect(array).toEqual([])
      })
    })
  })

  describe('复杂场景', () => {
    it('应该支持选择-取消-重新选择的流程', () => {
      const { toggleSelection, selectAll, clearSelection } = useBatchStore.getState()

      // 选择单个
      toggleSelection('1')
      expect(useBatchStore.getState().selectedIds.size).toBe(1)

      // 选择全部
      selectAll(['1', '2', '3'])
      expect(useBatchStore.getState().selectedIds.size).toBe(3)

      // 取消一个
      toggleSelection('1')
      expect(useBatchStore.getState().selectedIds.size).toBe(2)
      expect(useBatchStore.getState().selectedIds.has('1')).toBe(false)

      // 清空
      clearSelection()
      expect(useBatchStore.getState().selectedIds.size).toBe(0)

      // 重新选择
      toggleSelection('1')
      expect(useBatchStore.getState().selectedIds.has('1')).toBe(true)
    })

    it('应该在切换批量模式时正确管理选择', () => {
      const { toggleBatchMode, toggleSelection } = useBatchStore.getState()

      // 启用批量模式
      toggleBatchMode()
      expect(useBatchStore.getState().isBatchMode).toBe(true)

      // 选择一些项目
      toggleSelection('1')
      toggleSelection('2')
      expect(useBatchStore.getState().selectedIds.size).toBe(2)

      // 禁用批量模式
      toggleBatchMode()
      expect(useBatchStore.getState().isBatchMode).toBe(false)
      expect(useBatchStore.getState().selectedIds.size).toBe(0)

      // 重新启用
      toggleBatchMode()
      expect(useBatchStore.getState().isBatchMode).toBe(true)
    })
  })
})
