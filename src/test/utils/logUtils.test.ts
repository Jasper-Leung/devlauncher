import { describe, it, expect, beforeEach, vi } from 'vitest'
import { copyLogsToClipboard } from '../../renderer/utils/logUtils'

describe('logUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('copyLogsToClipboard', () => {
    it('should copy logs to clipboard', async () => {
      const logs = {
        project1: 'Log line 1\nLog line 2',
        project2: 'Another log',
      }

      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      global.navigator.clipboard = {
        writeText: mockWriteText,
      } as any

      const result = await copyLogsToClipboard(logs)

      expect(result).toBe(true)
      expect(mockWriteText).toHaveBeenCalledWith(
        '=== Project project1 ===\nLog line 1\nLog line 2\n\n=== Project project2 ===\nAnother log'
      )
    })

    it('should handle clipboard errors', async () => {
      const logs = { project1: 'Log' }

      global.navigator.clipboard = {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard error')),
      } as any

      const result = await copyLogsToClipboard(logs)

      expect(result).toBe(false)
    })

    it('should handle empty logs', async () => {
      const logs = {}

      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      global.navigator.clipboard = {
        writeText: mockWriteText,
      } as any

      const result = await copyLogsToClipboard(logs)

      expect(result).toBe(true)
    })
  })
})
