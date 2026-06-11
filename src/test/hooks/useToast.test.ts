import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from '../../renderer/hooks/useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should show toast message', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showToast('success', '操作成功')
    })

    expect(result.current.toast).toEqual({
      type: 'success',
      message: '操作成功',
    })
  })

  it('should clear toast after duration', async () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showToast('error', '操作失败')
    })

    expect(result.current.toast).not.toBeNull()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.toast).toBeNull()
  })

  it('should manually clear toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showToast('warning', '警告')
    })

    expect(result.current.toast).not.toBeNull()

    act(() => {
      result.current.clearToast()
    })

    expect(result.current.toast).toBeNull()
  })

  it('should support all toast types', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showToast('info', '信息')
    })

    expect(result.current.toast?.type).toBe('info')
  })
})
