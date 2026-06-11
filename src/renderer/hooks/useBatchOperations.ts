import { useState, useCallback } from 'react'

export function useBatchOperations<T>(items: T[], getKey: (item: T) => string) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBatchMode, setIsBatchMode] = useState(false)

  const toggleBatchMode = useCallback(() => {
    setIsBatchMode((prev) => {
      const newVal = !prev
      if (!newVal) setSelectedIds(new Set())
      return newVal
    })
  }, [])

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    const allIds = new Set(items.map(getKey))
    if (selectedIds.size === allIds.size) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(allIds)
    }
  }, [items, getKey, selectedIds.size])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isAllSelected = items.length > 0 && selectedIds.size === items.length
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected

  return {
    selectedIds,
    isBatchMode,
    toggleBatchMode,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    isAllSelected,
    isSomeSelected,
  }
}
