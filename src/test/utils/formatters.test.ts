import { describe, it, expect } from 'vitest'
import {
  formatLastLaunched,
  getProfileIcon,
  getProfileTypeClass,
} from '../../renderer/utils/formatters'

describe('formatters', () => {
  describe('formatLastLaunched', () => {
    it('should return "从未启动" when timestamp is undefined', () => {
      expect(formatLastLaunched(undefined)).toBe('从未启动')
    })

    it('should return "刚刚" for recent timestamps', () => {
      const now = Date.now()
      expect(formatLastLaunched(now - 30000)).toBe('刚刚')
    })

    it('should return minutes ago', () => {
      const now = Date.now()
      expect(formatLastLaunched(now - 5 * 60 * 1000)).toBe('5 分钟前')
    })

    it('should return hours ago', () => {
      const now = Date.now()
      expect(formatLastLaunched(now - 3 * 60 * 60 * 1000)).toBe('3 小时前')
    })

    it('should return days ago', () => {
      const now = Date.now()
      expect(formatLastLaunched(now - 2 * 24 * 60 * 60 * 1000)).toBe('2 天前')
    })

    it('should return formatted date for old timestamps', () => {
      const oldDate = new Date('2024-01-01').getTime()
      const result = formatLastLaunched(oldDate)
      expect(result).toMatch(/\d{1,2}\/\d{1,2}/)
    })
  })

  describe('getProfileIcon', () => {
    it('should return correct icons for each type', () => {
      expect(getProfileIcon('frontend')).toBe('⚡')
      expect(getProfileIcon('backend')).toBe('🔧')
      expect(getProfileIcon('docker')).toBe('🐳')
    })

    it('should return default icon for unknown type', () => {
      expect(getProfileIcon('unknown')).toBe('📦')
    })
  })

  describe('getProfileTypeClass', () => {
    it('should return class name with type suffix', () => {
      expect(getProfileTypeClass('frontend')).toBe('profile-type-frontend')
      expect(getProfileTypeClass('backend')).toBe('profile-type-backend')
      expect(getProfileTypeClass('docker')).toBe('profile-type-docker')
    })
  })
})
