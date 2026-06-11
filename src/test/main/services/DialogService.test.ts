/**
 * DialogService 单元測試
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { dialog } from 'electron'
import { DialogService } from '../../../main/services/DialogService'

// 模擬 Electron 的 dialog 模塊
vi.mock('electron', () => ({
  dialog: {
    showOpenDialog: vi.fn(),
    showSaveDialog: vi.fn(),
    showMessageBox: vi.fn(),
  },
}))

describe('DialogService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('selectDirectory', () => {
    it('應該返回選擇的目錄路徑', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: ['/selected/directory'],
      })

      const result = await DialogService.selectDirectory()

      expect(result).toBe('/selected/directory')
      expect(dialog.showOpenDialog).toHaveBeenCalledWith({
        properties: ['openDirectory'],
        title: '選擇項目文件夾',
      })
    })

    it('應該返回 null 當用戶取消選擇時', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: true,
        filePaths: [],
      })

      const result = await DialogService.selectDirectory()

      expect(result).toBeNull()
    })

    it('應該返回 null 當沒有選擇任何路徑時', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: [],
      })

      const result = await DialogService.selectDirectory()

      expect(result).toBeNull()
    })
  })

  describe('selectScanDirectory', () => {
    it('應該返回選擇的掃描目錄路徑', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: ['/scan/directory'],
      })

      const result = await DialogService.selectScanDirectory()

      expect(result).toEqual({ canceled: false, path: '/scan/directory' })
    })

    it('應該返回取消狀態當用戶取消選擇時', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: true,
        filePaths: [],
      })

      const result = await DialogService.selectScanDirectory()

      expect(result).toEqual({ canceled: true })
    })
  })

  describe('showExportDialog', () => {
    it('應該返回選擇的導出路徑', async () => {
      vi.mocked(dialog.showSaveDialog).mockResolvedValue({
        canceled: false,
        filePath: '/export/path/projects.json',
      })

      const result = await DialogService.showExportDialog()

      expect(result).toEqual({ canceled: false, filePath: '/export/path/projects.json' })
      expect(dialog.showSaveDialog).toHaveBeenCalledWith({
        title: '導出項目配置',
        defaultPath: expect.stringContaining('devlauncher-projects'),
        filters: [
          { name: 'JSON 文件', extensions: ['json'] },
          { name: '所有文件', extensions: ['*'] },
        ],
      })
    })

    it('應該返回取消狀態當用戶取消導出時', async () => {
      vi.mocked(dialog.showSaveDialog).mockResolvedValue({
        canceled: true,
        filePath: undefined,
      })

      const result = await DialogService.showExportDialog()

      expect(result).toEqual({ canceled: true })
    })
  })

  describe('showImportDialog', () => {
    it('應該返回選擇的導入文件路徑', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: ['/import/path/projects.json'],
      } as any)

      const result = await DialogService.showImportDialog()

      expect(result).toEqual({ canceled: false, filePath: '/import/path/projects.json' })
      expect(dialog.showOpenDialog).toHaveBeenCalledWith({
        title: '導入項目配置',
        filters: [
          { name: 'JSON 文件', extensions: ['json'] },
          { name: '所有文件', extensions: ['*'] },
        ],
        properties: ['openFile'],
      })
    })

    it('應該返回取消狀態當用戶取消導入時', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: true,
        filePaths: [],
      })

      const result = await DialogService.showImportDialog()

      expect(result).toEqual({ canceled: true })
    })
  })

  describe('showImportModeDialog', () => {
    it('應該返回合併模式當用戶選擇合併時', async () => {
      vi.mocked(dialog.showMessageBox).mockResolvedValue({
        response: 0,
        checkboxChecked: false,
      } as any)

      const result = await DialogService.showImportModeDialog()

      expect(result).toEqual({ canceled: false, merge: true })
      expect(dialog.showMessageBox).toHaveBeenCalledWith({
        type: 'question',
        buttons: ['合併', '替換', '取消'],
        defaultId: 0,
        title: '導入模式',
        message: '選擇導入模式',
        detail: '合併：將導入的項目添加到現有項目中\n替換：完全替換現有項目',
      })
    })

    it('應該返回替換模式當用戶選擇替換時', async () => {
      vi.mocked(dialog.showMessageBox).mockResolvedValue({
        response: 1,
        checkboxChecked: false,
      } as any)

      const result = await DialogService.showImportModeDialog()

      expect(result).toEqual({ canceled: false, merge: false })
    })

    it('應該返回取消狀態當用戶點擊取消時', async () => {
      vi.mocked(dialog.showMessageBox).mockResolvedValue({
        response: 2,
        checkboxChecked: false,
      } as any)

      const result = await DialogService.showImportModeDialog()

      expect(result).toEqual({ canceled: true })
    })
  })
})
