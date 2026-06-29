import { app, BrowserWindow, shell, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { CommandService } from './services/CommandService.js'
import { ProjectService } from './services/ProjectService.js'
import { ProjectDetectionService } from './services/ProjectDetectionService.js'
import { DirectoryScanService } from './services/DirectoryScanService.js'
import { DialogService } from './services/DialogService.js'
import { BatchImportService } from './services/BatchImportService.js'
import { ProjectConfig } from '../shared/types'

// 在 Windows 上配置控制台模式
if (process.platform === 'win32') {
  // 禁用 ConPTY，使用 legacy winpty 以避免 "AttachConsole failed" 错误
  // 这是在应用退出清理 node-pty 进程时的已知问题
  process.env.NODE_PTY_DISABLE_CONPTY = '1'

  // 设置控制台代码页为 UTF-8
  process.env.CHCP = '65001'
}

// 保持对窗口对象的全局引用，避免被 JavaScript 垃圾回收器回收
let mainWindow: Electron.BrowserWindow | null = null

/**
 * 创建主窗口
 */
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  })

  // 检测是否为开发环境
  const isDev = process.env.NODE_ENV === 'development' || (!app.isPackaged && process.env.ELECTRON_IS_DEV !== 'false')

  // 根据环境加载开发服务器或打包后的 HTML
  if (isDev) {
    // 尝试多个端口，因为 Vite 可能会使用不同的端口
    const devPorts = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
      'http://localhost:5178',
      'http://localhost:5179',
      'http://localhost:5180',
    ]
    let loaded = false

    for (const portUrl of devPorts) {
      try {
        await mainWindow.loadURL(portUrl)
        loaded = true
        break
      } catch {
        // 尝试下一个端口
        continue
      }
    }

    if (!loaded) {
      console.error('无法连接到 Vite 开发服务器')
      app.quit()
      return
    }

    // 打开开发者工具
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    // 使用 loadURL 加载打包后的 HTML
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // 处理链接在默认浏览器中打开 (Electron >= 10)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 窗口关闭事件处理
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

/**
 * 应用初始化
 */
app.on('ready', () => {
  // 重置所有运行中的项目状态为停止
  // 因为应用重启后，之前的进程已经不存在了
  resetRunningProjectsStatus()

  // 初始化项目服务
  ProjectService.getAll()

  // 初始化命令服务 IPC
  CommandService.initIpc()

  // 注册 IPC 处理器
  registerIpcHandlers()

  createWindow()
})

/**
 * 重置所有运行中的项目状态为停止
 * 应用重启后，之前的进程已经不存在，需要同步状态
 */
function resetRunningProjectsStatus() {
  try {
    const projects = ProjectService.getAll()
    let hasRunningProjects = false

    for (const project of projects) {
      if (project.status === 'running') {
        ProjectService.update(project.id, {
          status: 'stopped',
          activeProfileId: undefined,
        })
        hasRunningProjects = true
      }
    }

    if (hasRunningProjects) {
      console.log('已重置所有运行中的项目状态为停止')
    }
  } catch (error) {
    console.error('重置项目状态时出错:', error)
  }
}

/**
 * 注册 IPC 通信处理器
 */
function registerIpcHandlers() {
  // 获取所有项目
  ipcMain.handle('get-projects', () => {
    return ProjectService.getAll()
  })

  // 添加项目
  ipcMain.handle('add-project', (_, project) => {
    return ProjectService.add(project)
  })

  // 更新项目
  ipcMain.handle('update-project', (_, id: string, updates: Partial<ProjectConfig>) => {
    ProjectService.update(id, updates)
    return { success: true }
  })

  // 删除项目
  ipcMain.handle('delete-project', (_, id: string) => {
    ProjectService.delete(id)
    return { success: true }
  })

  // 选择目录
  ipcMain.handle('select-directory', async () => {
    return DialogService.selectDirectory()
  })

  // 检测项目信息
  ipcMain.handle('detect-project', async (_, projectPath: string) => {
    return ProjectDetectionService.detect(projectPath)
  })

  // 提取项目名称
  ipcMain.handle('extract-project-name', async (_, projectPath: string) => {
    return ProjectDetectionService.extractProjectName(projectPath)
  })

  // 读取 README 文件
  ipcMain.handle('read-readme', async (_, projectPath: string) => {
    const readmeNames = [
      'README.md',
      'readme.md',
      'Readme.md',
      'README.MD',
      'README.txt',
      'readme.txt',
    ]

    for (const readmeName of readmeNames) {
      const readmePath = path.join(projectPath, readmeName)
      try {
        if (fs.existsSync(readmePath)) {
          const content = fs.readFileSync(readmePath, 'utf-8')
          return {
            success: true,
            content,
            fileName: readmeName,
          }
        }
      } catch {
        // 继续尝试下一个文件名
        continue
      }
    }

    return { success: false, content: '' }
  })

  // 导出项目配置
  ipcMain.handle('export-projects', async () => {
    try {
      const dialogResult = await DialogService.showExportDialog()

      if (dialogResult.canceled) {
        return { success: false, canceled: true }
      }

      const exportResult = ProjectService.exportTo(dialogResult.filePath!)
      return {
        success: exportResult.success,
        canceled: false,
        path: dialogResult.filePath,
        error: exportResult.error,
      }
    } catch (error: unknown) {
      console.error('导出处理失败:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, canceled: false, error: errorMessage }
    }
  })

  // 导入项目配置
  ipcMain.handle('import-projects', async () => {
    const dialogResult = await DialogService.showImportDialog()

    if (dialogResult.canceled) {
      return { success: false, canceled: true }
    }

    const modeResult = await DialogService.showImportModeDialog()

    if (modeResult.canceled) {
      return { success: false, canceled: true }
    }

    const importResult = ProjectService.importFrom(dialogResult.filePath!, modeResult.merge!)
    return importResult
  })

  // 选择扫描目录
  ipcMain.handle('select-scan-directory', async () => {
    return DialogService.selectScanDirectory()
  })

  // 扫描目录查找项目
  ipcMain.handle('scan-directory', async (_, dirPath: string, maxDepth: number = 5) => {
    return DirectoryScanService.scan(dirPath, maxDepth)
  })

  // 批量添加扫描到的项目
  ipcMain.handle(
    'batch-add-projects',
    async (_, projects: Array<{ name: string; path: string; type: string }>) => {
      return BatchImportService.batchAddProjects(projects)
    }
  )

  // 打开 IDE
  ipcMain.on('open-ide', (_, project: ProjectConfig) => {
    CommandService.openIde(project)
  })

  // 打开终端
  ipcMain.on('open-terminal', (_, project: ProjectConfig) => {
    CommandService.openTerminal(project)
  })

  // 打开文件夹
  ipcMain.on('open-folder', (_, project: ProjectConfig) => {
    CommandService.openFolder(project)
  })

  // 启动项目 (兼容原有的 startProject API - 自定义命令)
  ipcMain.on(
    'run-command',
    (event, projectIdOrProject: string | ProjectConfig, command?: string) => {
      let project: ProjectConfig | undefined

      // 兼容两种调用方式
      if (typeof projectIdOrProject === 'string') {
        // 如果传入的是 ID，从 ProjectService 获取完整配置
        const projects = ProjectService.getAll()
        project = projects.find((p) => p.id === projectIdOrProject)
        command = project?.startCommand
      } else {
        // 如果传入的是完整的项目配置
        project = projectIdOrProject
      }

      if (project && command) {
        // 创建临时配置用于执行自定义命令
        const tempProfile = {
          id: 'custom-' + Date.now(), // 使用唯一 ID 以便日志正确显示
          name: '自定义命令',
          type: 'frontend' as const,
          command: command,
        }
        CommandService.runCommand(project, tempProfile, (data) => {
          event.sender.send('command-output', { projectId: project!.id, profileId: tempProfile.id, data })
        })
      }
    }
  )
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

/**
 * 应用退出前清理资源
 * 这是 P0 级别的安全改进，防止内存泄漏和进程残留
 */
app.on('before-quit', () => {
  console.log('应用正在退出，清理资源...')
  try {
    CommandService.cleanupAll()
  } catch (error) {
    console.error('清理资源时出错:', error)
  }
})

/**
 * 处理所有窗口关闭事件（macOS 可能不触发 before-quit）
 */
app.on('will-quit', () => {
  console.log('应用即将退出，执行最终清理...')
  try {
    CommandService.cleanupAll()
  } catch (error) {
    console.error('最终清理时出错:', error)
  }
})
