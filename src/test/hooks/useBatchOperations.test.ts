import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBatchOperations } from '../../renderer/hooks/useBatchOperations'

interface TestItem {
  id: string
  name: string
}

describe('useBatchOperations', () => {
  const testItems: TestItem[] = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
  ]

  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => useBatchOperations(testItems, (item) => item.id))

    expect(result.current.selectedIds.size).toBe(0)
    expect(result.current.isBatchMode).toBe(false)
    expect(result.current.isAllSelected).toBe(false)
    expect(result.current.isSomeSelected).toBe(false)
  })

  it('should toggle batch mode', () => {
    const { result } = renderHook(() => useBatchOperations(testItems, (item) => item.id))

    act(() => {
      result.current.toggleBatchMode()
    })

    expect(result.current.isBatchMode).toBe(true)

    act(() => {
      result.current.toggleBatchMode()
    })

    expect(result.current.isBatchMode).toBe(false)
  })

  it('should toggle item selection', () => {
    const { result } = renderHook(() => useBatchOperations(testItems, (item) => item.id))

    act(() => {
      result.current.toggleSelection('1')
    })

    expect(result.current.selectedIds.has('1')).toBe(true)
    expect(result.current.isSomeSelected).toBe(true)

    act(() => {
      result.current.toggleSelection('1')
    })

    expect(result.current.selectedIds.has('1')).toBe(false)
  })

  it('should select all items', () => {
    const { result } = renderHook(() => useBatchOperations(testItems, (item) => item.id))

    act(() => {
      result.current.toggleSelectAll()
    })

    expect(result.current.selectedIds.size).toBe(3)
    expect(result.current.isAllSelected).toBe(true)

    act(() => {
      result.current.toggleSelectAll()
    })

    expect(result.current.selectedIds.size).toBe(0)
    expect(result.current.isAllSelected).toBe(false)
  })

  it('should clear selection', () => {
    const { result } = renderHook(() => useBatchOperations(testItems, (item) => item.id))

    act(() => {
      result.current.toggleSelection('1')
      result.current.toggleSelection('2')
    })

    expect(result.current.selectedIds.size).toBe(2)

    act(() => {
      result.current.clearSelection()
    })

    expect(result.current.selectedIds.size).toBe(0)
  })

  it('should clear selection when exiting batch mode', () => {
    const { result } = renderHook(() => useBatchOperations(testItems, (item) => item.id))

    act(() => {
      result.current.toggleBatchMode()
      result.current.toggleSelection('1')
      result.current.toggleSelection('2')
    })

    expect(result.current.selectedIds.size).toBe(2)

    act(() => {
      result.current.toggleBatchMode()
    })

    expect(result.current.isBatchMode).toBe(false)
    expect(result.current.selectedIds.size).toBe(0)
  })
})
