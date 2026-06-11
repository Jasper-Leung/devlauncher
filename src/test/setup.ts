import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// 模拟 electron API
global.window.electronAPI = {
  getProjects: vi.fn(),
  addProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  selectDirectory: vi.fn(),
  detectProject: vi.fn(),
  extractProjectName: vi.fn(),
  exportProjects: vi.fn(),
  importProjects: vi.fn(),
  selectScanDirectory: vi.fn(),
  scanDirectory: vi.fn(),
  batchAddProjects: vi.fn(),
  startProfile: vi.fn(),
  stopProject: vi.fn(),
  openIde: vi.fn(),
  openTerminal: vi.fn(),
  runCustomCommand: vi.fn(),
  onCommandOutput: vi.fn(),
  onProjectStatusUpdated: vi.fn(),
} as any

// 每个测试后清理
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
