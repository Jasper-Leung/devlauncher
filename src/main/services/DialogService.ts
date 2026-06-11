import { dialog } from 'electron'

export class DialogService {
  /**
   * 选择项目目录
   */
  static async selectDirectory(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择项目文件夹',
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  }

  /**
   * 选择要扫描的目录
   */
  static async selectScanDirectory(): Promise<{ canceled: boolean; path?: string }> {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择要扫描的目录',
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true }
    }
    return { canceled: false, path: result.filePaths[0] }
  }

  /**
   * 显示导出对话框
   */
  static async showExportDialog(): Promise<{ canceled: boolean; filePath?: string }> {
    const result = await dialog.showSaveDialog({
      title: '导出项目配置',
      defaultPath: `devlauncher-projects-${Date.now()}.json`,
      filters: [
        { name: 'JSON 文件', extensions: ['json'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    })
    if (result.canceled || !result.filePath) {
      return { canceled: true }
    }
    return { canceled: false, filePath: result.filePath }
  }

  /**
   * 显示导入对话框
   */
  static async showImportDialog(): Promise<{ canceled: boolean; filePath?: string }> {
    const result = await dialog.showOpenDialog({
      title: '导入项目配置',
      filters: [
        { name: 'JSON 文件', extensions: ['json'] },
        { name: '所有文件', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true }
    }
    return { canceled: false, filePath: result.filePaths[0] }
  }

  /**
   * 显示导入模式对话框
   */
  static async showImportModeDialog(): Promise<{ canceled: boolean; merge?: boolean }> {
    const result = await dialog.showMessageBox({
      type: 'question',
      buttons: ['合并', '替换', '取消'],
      defaultId: 0,
      title: '导入模式',
      message: '选择导入模式',
      detail: '合并：将导入的项目添加到现有项目中\n替换：完全替换现有项目',
    })

    if (result.response === 2) return { canceled: true }
    return { canceled: false, merge: result.response === 0 }
  }
}
