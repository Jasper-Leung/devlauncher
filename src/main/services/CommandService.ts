import { ipcMain } from 'electron'
import * as pty from 'node-pty'
import { exec } from 'child_process'
import { ProjectConfig, StartupProfile } from '../../shared/types'
import { ProjectService } from './ProjectService'
import { SecurityValidator, PtyOptions, SECURITY_CONSTANTS } from '../utils/SecurityValidator'
import { CommandExecutionError, SecurityError, isAppError } from '../../shared/errorTypes'

/**
 * 进程信息
 */
interface ProcessInfo {
  pty: pty.IPty
  profileId: string
  createdAt: number
}

/**
 * 清理定时器管理器
 */
class CleanupTimerManager {
  private static timers: Set<NodeJS.Timeout> = new Set()
  private static intervals: Set<NodeJS.Timeout> = new Set()

  static setTimeout(callback: () => void, ms: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      callback()
      this.timers.delete(timer)
    }, ms)
    this.timers.add(timer)
    return timer
  }

  static setInterval(callback: () => void, ms: number): NodeJS.Timeout {
    const interval = setInterval(callback, ms)
    this.intervals.add(interval)
    return interval
  }

  static clearTimer(timer: NodeJS.Timeout): void {
    clearTimeout(timer)
    this.timers.delete(timer)
  }

  static clearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval)
    this.intervals.delete(interval)
  }

  static cleanupAll(): void {
    this.timers.forEach((timer) => clearTimeout(timer))
    this.intervals.forEach((interval) => clearInterval(interval))
    this.timers.clear()
    this.intervals.clear()
  }

  static get size(): number {
    return this.timers.size + this.intervals.size
  }
}

/**
 * 命令执行服务
 * 负责执行项目命令并管理进程生命周期
 */
export class CommandService {
  // 存储活动进程的映射表 { projectId: { pty, profileId, createdAt } }
  private static activeProcesses = new Map<string, ProcessInfo>()

  // 存储日志引用，用于清理
  private static logBuffers = new Map<string, { data: string[]; maxSize: number }>()

  /**
   * 清理所有资源
   * 应用退出时调用
   */
  static cleanupAll(): void {
    // 杀死所有活动进程
    for (const [projectId, processInfo] of this.activeProcesses.entries()) {
      try {
        processInfo.pty.kill()
      } catch (error) {
        console.error(`清理进程 ${projectId} 失败:`, error)
      }
    }
    this.activeProcesses.clear()

    // 清理所有定时器
    CleanupTimerManager.cleanupAll()

    // 清理日志缓冲区
    this.logBuffers.clear()

    console.log('CommandService: 所有资源已清理')
  }

  /**
   * 清理僵尸进程（超过1小时未活动）
   */
  static cleanupZombieProcesses(): void {
    const now = Date.now()
    const ZOMBIE_TIMEOUT = 60 * 60 * 1000 // 1小时

    for (const [projectId, processInfo] of this.activeProcesses.entries()) {
      if (now - processInfo.createdAt > ZOMBIE_TIMEOUT) {
        console.warn(`发现僵尸进程，正在清理: ${projectId}`)
        try {
          processInfo.pty.kill()
          this.activeProcesses.delete(projectId)
        } catch (error) {
          console.error(`清理僵尸进程 ${projectId} 失败:`, error)
        }
      }
    }
  }

  /**
   * 执行项目命令
   * @param project 项目配置
   * @param profile 启动配置
   * @param callback 日志回调函数
   */
  static runCommand(
    project: ProjectConfig,
    profile: StartupProfile,
    callback: (data: string) => void
  ): void {
    try {
      // 验证项目路径
      SecurityValidator.validatePath(project.path)

      // 终止已有进程
      this.killProcess(project.id)

      // 计算并验证工作目录
      const workingDir = profile.cwd
        ? SecurityValidator.validatePath(profile.cwd, project.path)
        : SecurityValidator.validatePath(project.path)

      // 根据配置类型执行不同的启动方式
      if (profile.type === 'docker') {
        this.runDockerCommand(project, profile, workingDir, callback)
      } else if (profile.type === 'external') {
        // 在系统终端中运行，支持完全交互
        this.runExternalCommand(project, profile, workingDir, callback)
      } else {
        // 在应用内的伪终端中运行（默认）
        this.runShellCommand(project, profile, workingDir, callback)
      }

      // 只有在进程成功创建后才更新项目状态为运行中
      ProjectService.update(project.id, {
        status: 'running',
        lastLaunched: Date.now(),
        activeProfileId: profile.id,
      })
      ipcMain.emit('project-status-updated', project.id, 'running', profile.id)
    } catch (error) {
      const errorMsg = isAppError(error) ? error.message : `启动失败: ${String(error)}`

      // 清理可能残留的进程记录
      const processInfo = this.activeProcesses.get(project.id)
      if (processInfo) {
        try {
          processInfo.pty.kill()
        } catch {
          // 忽略清理错误
        }
        this.activeProcesses.delete(project.id)
      }
      this.logBuffers.delete(project.id)

      callback(`\n[错误] ${errorMsg}\n`)

      // 恢复项目状态为停止
      ProjectService.update(project.id, {
        status: 'stopped',
        activeProfileId: undefined,
      })
      ipcMain.emit('project-status-updated', project.id, 'stopped')
    }
  }

  /**
   * 预处理命令，确保多命令能正确执行
   * 支持的分隔符：; && & || |
   * 在 Windows 上将 ; 转换为 &&
   * 移除会导致新窗口的 start 命令
   */
  private static preprocessCommand(command: string): string {
    let processed = command.trim()

    // Windows 上移除 start 命令，因为它会打开新窗口导致无法停止
    if (process.platform === 'win32') {
      // 移除开头的 start /b 或 start
      processed = processed.replace(/^start\s*(?:\/b)?\s*/i, '')
      // 移除 cmd /c start（保留cmd /c，移除后面的start）
      processed = processed.replace(/^cmd\s*\/c\s+"?\s*start\s*/i, 'cmd /c ')
      // 移除中间位置的 start 命令（如：npm run dev && start xxx）
      // 注意：这里只移除独立的 start 命令，不影响包含 start 的其他命令
      processed = processed.replace(/\s&&\s*start\s+/gi, ' && ')
      processed = processed.replace(/\s;\s*start\s+/gi, '; ')
    }

    // 检测命令中是否包含多个命令
    const multiCommandPatterns = [
      /;\s*\S/, // ; command
      /&&\s*\S/, // && command
      /\|\|\s*\S/, // || command
      /\|\s*\S/, // | command (pipe)
      /&\s*\S/, // & command (background, 但在 Windows 中也是命令分隔)
    ]

    const hasMultipleCommands = multiCommandPatterns.some((pattern) => pattern.test(processed))

    if (!hasMultipleCommands) {
      return processed
    }

    // Windows 系统：将 ; 转换为 && (更可靠)
    if (process.platform === 'win32') {
      // 将非 URL 中的 ; 替换为 &&
      // 注意：不要替换路径中的 : (如 C:\)
      processed = processed.replace(/;(?!\s*$)/g, '&&')
    }

    return processed
  }

  /**
   * 执行 Shell 命令
   */
  private static runShellCommand(
    project: ProjectConfig,
    profile: StartupProfile,
    workingDir: string,
    callback: (data: string) => void
  ): void {
    // 验证命令安全性
    const validatedCommand = SecurityValidator.validateCommand(profile.command)
    const processedCommand = this.preprocessCommand(validatedCommand)

    // 验证并创建环境变量
    const validatedEnv = profile.env
      ? SecurityValidator.validateEnvironmentVariables(profile.env)
      : {}

    // Windows 上确保禁用 ConPTY 以避免 AttachConsole 错误
    if (process.platform === 'win32') {
      validatedEnv['NODE_PTY_DISABLE_CONPTY'] = '1'
    }

    // 配置终端选项（使用安全的 PtyOptions）
    const ptyOptions: PtyOptions = SecurityValidator.createPtyOptions(workingDir, validatedEnv)

    let ptyProcess: pty.IPty | null = null
    try {
      const shell = process.platform === 'win32' ? 'cmd.exe' : 'bash'
      ptyProcess = pty.spawn(shell, [], ptyOptions)
    } catch (spawnError) {
      // PTY 进程创建失败，确保状态被重置
      throw new Error(`无法创建终端进程: ${String(spawnError)}`)
    }

    // 存储进程引用（包含创建时间）
    this.activeProcesses.set(project.id, {
      pty: ptyProcess,
      profileId: profile.id,
      createdAt: Date.now(),
    })

    // 创建安全的日志回调（限制日志大小）
    const safeCallback = (data: string) => {
      const logKey = project.id
      const buffer = this.logBuffers.get(logKey) || {
        data: [],
        maxSize: SECURITY_CONSTANTS.MAX_LOG_LENGTH,
      }
      this.logBuffers.set(logKey, buffer)

      // 限制日志大小
      const limitedData = SecurityValidator.limitLogSize(buffer.data.join(''), data)
      callback(limitedData)
    }

    // 处理标准输出
    ptyProcess.onData((data: string) => {
      safeCallback(data)
    })

    // 处理进程退出
    ptyProcess.onExit(({ exitCode, signal }) => {
      this.activeProcesses.delete(project.id)
      this.logBuffers.delete(project.id)
      safeCallback(`\n[${profile.name}] 进程已退出 [${exitCode || signal}]\n`)
      ProjectService.update(project.id, { status: 'stopped', activeProfileId: undefined })
      ipcMain.emit('project-status-updated', project.id, 'stopped', profile.id)
    })

    // Windows 上使用 cmd /c 确保命令在当前进程中执行
    if (process.platform === 'win32') {
      // 检查命令是否已经以 cmd /c 开头
      if (!processedCommand.toLowerCase().startsWith('cmd /c')) {
        // 对于包含特殊字符或空格的命令，使用引号包裹
        const safeCommand =
          processedCommand.includes('&') || processedCommand.includes('|')
            ? `"${processedCommand}"`
            : processedCommand
        ptyProcess.write(`cmd /c ${safeCommand}\r`)
      } else {
        ptyProcess.write(`${processedCommand}\r`)
      }
    } else {
      ptyProcess.write(`${processedCommand}\r`)
    }
    safeCallback(`\n[${profile.name}] 启动中...\n`)
  }

  /**
   * 执行 Docker 命令
   */
  private static runDockerCommand(
    project: ProjectConfig,
    profile: StartupProfile,
    workingDir: string,
    callback: (data: string) => void
  ): void {
    // 验证并创建环境变量
    const validatedEnv = profile.env
      ? SecurityValidator.validateEnvironmentVariables(profile.env)
      : {}

    // Windows 上确保禁用 ConPTY 以避免 AttachConsole 错误
    if (process.platform === 'win32') {
      validatedEnv['NODE_PTY_DISABLE_CONPTY'] = '1'
    }

    // 配置终端选项（使用安全的 PtyOptions）
    const ptyOptions: PtyOptions = SecurityValidator.createPtyOptions(workingDir, validatedEnv)

    let ptyProcess: pty.IPty | null = null
    try {
      const shell = process.platform === 'win32' ? 'cmd.exe' : 'bash'
      ptyProcess = pty.spawn(shell, [], ptyOptions)
    } catch (spawnError) {
      // PTY 进程创建失败，确保状态被重置
      throw new Error(`无法创建终端进程: ${String(spawnError)}`)
    }

    // 存储进程引用（包含创建时间）
    this.activeProcesses.set(project.id, {
      pty: ptyProcess,
      profileId: profile.id,
      createdAt: Date.now(),
    })

    // 创建安全的日志回调（限制日志大小）
    const safeCallback = (data: string) => {
      const logKey = project.id
      const buffer = this.logBuffers.get(logKey) || {
        data: [],
        maxSize: SECURITY_CONSTANTS.MAX_LOG_LENGTH,
      }
      this.logBuffers.set(logKey, buffer)

      // 限制日志大小
      const limitedData = SecurityValidator.limitLogSize(buffer.data.join(''), data)
      callback(limitedData)
    }

    ptyProcess.onData((data: string) => {
      safeCallback(data)
    })

    ptyProcess.onExit(({ exitCode, signal }) => {
      this.activeProcesses.delete(project.id)
      this.logBuffers.delete(project.id)
      safeCallback(`\n[${profile.name}] Docker 容器已停止 [${exitCode || signal}]\n`)
      ProjectService.update(project.id, { status: 'stopped', activeProfileId: undefined })
      ipcMain.emit('project-status-updated', project.id, 'stopped', profile.id)
    })

    // 构建并执行 Docker 命令
    let dockerCommand = ''
    if (profile.dockerContainer) {
      // 验证容器名称（只允许字母、数字、下划线和连字符）
      const containerName = profile.dockerContainer.trim()
      if (!/^[a-zA-Z0-9_-]+$/.test(containerName)) {
        throw new SecurityError('无效的 Docker 容器名称')
      }
      // 启动指定容器
      dockerCommand = `docker start ${containerName} && docker logs -f ${containerName}`
    } else {
      // 使用 docker-compose 或直接运行命令（预处理多命令）
      const validatedCommand = SecurityValidator.validateCommand(profile.command)
      dockerCommand = this.preprocessCommand(validatedCommand)
    }

    ptyProcess.write(`${dockerCommand}\r`)
    safeCallback(`\n[${profile.name}] Docker 启动中...\n`)
  }

  /**
   * 在系统终端中执行命令（支持完全交互）
   */
  private static runExternalCommand(
    project: ProjectConfig,
    profile: StartupProfile,
    workingDir: string,
    callback: (data: string) => void
  ): void {
    try {
      // 验证命令安全性
      const validatedCommand = SecurityValidator.validateCommand(profile.command)

      // 转义路径中的特殊字符
      const escapedPath = workingDir.replace(/"/g, '\\"')
      const escapedCommand = validatedCommand.replace(/"/g, '\\"')

      // 构建完整的命令字符串
      const fullCommand = `cd /d "${escapedPath}" && ${escapedCommand}`

      switch (process.platform) {
        case 'win32':
          // Windows: 使用 cmd /K 保持窗口打开
          exec(`start cmd /K "${fullCommand}"`)
          break
        case 'darwin':
          // macOS: 使用 Terminal
          exec(`osascript -e 'tell application "Terminal" to do script "${fullCommand.replace(/"/g, '\\"')}"'`)
          break
        case 'linux':
          // Linux: 使用 gnome-terminal 或 xterm
          exec(`gnome-terminal -- bash -c "${fullCommand.replace(/"/g, '\\"')}; exec bash" || xterm -e "${fullCommand.replace(/"/g, '\\"')}"`)
          break
        default:
          throw new CommandExecutionError('不支持的操作系统')
      }

      // 发送启动消息
      callback(`\n[${profile.name}] 已在系统终端中启动\n`)

      // 标记为运行中（注意：我们无法跟踪系统终端中的进程状态）
      ProjectService.update(project.id, {
        status: 'running',
        lastLaunched: Date.now(),
        activeProfileId: profile.id,
      })
      ipcMain.emit('project-status-updated', project.id, 'running', profile.id)

      // 提示用户需要手动停止
      callback(`[提示] 在系统终端中运行的进程需要手动关闭终端窗口来停止\n`)
    } catch (error) {
      const errorMsg = isAppError(error) ? error.message : `启动失败: ${String(error)}`
      callback(`\n[错误] ${errorMsg}\n`)
      ProjectService.update(project.id, { status: 'stopped', activeProfileId: undefined })
      ipcMain.emit('project-status-updated', project.id, 'stopped')
    }
  }

  /**
   * 终止指定项目的进程
   * @param projectId 项目ID
   */
  static killProcess(projectId: string): void {
    const processInfo = this.activeProcesses.get(projectId)
    if (processInfo) {
      try {
        // 尝试正常终止进程
        processInfo.pty.kill()
      } catch (error) {
        console.error(`终止进程 ${projectId} 时出错:`, error)
      }
      // 无论终止是否成功，都从活动进程列表中移除
      this.activeProcesses.delete(projectId)
    }

    // 清理日志缓冲区
    this.logBuffers.delete(projectId)

    // 无论进程是否存在，都更新项目状态为停止
    // 这可以修复命令不存在导致的状态不一致问题
    try {
      ProjectService.update(projectId, { status: 'stopped', activeProfileId: undefined })
      ipcMain.emit('project-status-updated', projectId, 'stopped')
    } catch (error) {
      console.error(`更新项目 ${projectId} 状态时出错:`, error)
    }
  }

  /**
   * 向运行中的进程发送输入
   * @param projectId 项目ID
   * @param input 输入内容
   */
  static sendInput(projectId: string, input: string): boolean {
    const processInfo = this.activeProcesses.get(projectId)
    if (!processInfo) {
      console.warn(`项目 ${projectId} 没有运行中的进程`)
      return false
    }

    try {
      const trimmed = input.trim()

      // 验证输入不为空
      if (trimmed.length === 0) {
        return false
      }

      // 限制输入长度
      if (trimmed.length > SECURITY_CONSTANTS.MAX_COMMAND_LENGTH) {
        console.error(`输入过长: ${trimmed.length} 字符`)
        return false
      }

      // 检查危险模式（防止命令注入）
      for (const pattern of SECURITY_CONSTANTS.DANGEROUS_PATTERNS) {
        if (pattern.test(trimmed)) {
          console.error(`输入包含危险字符: ${projectId}`)
          return false
        }
      }

      // 添加回车符发送输入
      processInfo.pty.write(`${trimmed}\r`)
      return true
    } catch (error) {
      console.error(`向进程 ${projectId} 发送输入时出错:`, error)
      return false
    }
  }

  /**
   * 向运行中的进程发送 Ctrl+C 信号
   * @param projectId 项目ID
   */
  static sendSignal(projectId: string, signal: 'SIGINT' | 'SIGTERM' | 'SIGKILL'): boolean {
    const processInfo = this.activeProcesses.get(projectId)
    if (!processInfo) {
      console.warn(`项目 ${projectId} 没有运行中的进程`)
      return false
    }

    try {
      switch (signal) {
        case 'SIGINT':
          // 发送 Ctrl+C (ASCII 0x03)
          processInfo.pty.write('\x03')
          break
        case 'SIGTERM':
        case 'SIGKILL':
          // 强制杀死进程
          processInfo.pty.kill()
          this.activeProcesses.delete(projectId)
          // 清理日志缓冲区
          this.logBuffers.delete(projectId)
          break
      }
      return true
    } catch (error) {
      console.error(`向进程 ${projectId} 发送信号 ${signal} 时出错:`, error)
      return false
    }
  }

  /**
   * 初始化IPC通信
   */
  static initIpc(): void {
    ipcMain.on('kill-process', (_, projectId: string) => {
      this.killProcess(projectId)
    })

    // 启动指定的配置
    ipcMain.on('start-profile', (event, project: ProjectConfig, profileId: string) => {
      const profile = project.startupProfiles?.find((p) => p.id === profileId)
      if (profile) {
        this.runCommand(project, profile, (data) => {
          event.sender.send('command-output', { projectId: project.id, profileId, data })
        })
      }
    })

    // 向进程发送输入
    ipcMain.on('send-command-input', (_, projectId: string, input: string) => {
      this.sendInput(projectId, input)
    })

    // 向进程发送信号 (Ctrl+C 等)
    ipcMain.on('send-signal', (_, projectId: string, signal: 'SIGINT' | 'SIGTERM' | 'SIGKILL') => {
      this.sendSignal(projectId, signal)
    })
  }

  /**
   * 打开 IDE
   * @param project 项目配置
   */
  static openIde(project: ProjectConfig): void {
    try {
      // 验证项目路径
      SecurityValidator.validatePath(project.path)

      const ideCommand = project.ideCommand || 'code .'
      const validatedCommand = SecurityValidator.validateIdeCommand(ideCommand)

      // 验证并创建环境变量
      const validatedEnv = SecurityValidator.validateEnvironmentVariables({})

      const ptyOptions: PtyOptions = SecurityValidator.createPtyOptions(project.path, validatedEnv)

      const shell = process.platform === 'win32' ? 'cmd.exe' : 'bash'
      const ptyProcess = pty.spawn(shell, [], ptyOptions)

      // 执行 IDE 命令后立即退出
      ptyProcess.write(`${validatedCommand} && exit\r`)

      // 设置超时清理（5秒后清理）
      CleanupTimerManager.setTimeout(() => {
        try {
          ptyProcess.kill()
        } catch {
          // 忽略清理错误
        }
      }, 5000)
    } catch (error) {
      console.error('打开 IDE 失败:', error)
      throw new CommandExecutionError(
        `打开 IDE 失败: ${isAppError(error) ? error.message : String(error)}`
      )
    }
  }

  /**
   * 打开系统终端
   * @param project 项目配置
   */
  static openTerminal(project: ProjectConfig): void {
    try {
      // 验证项目路径
      const validatedPath = SecurityValidator.validatePath(project.path)

      // 转义路径中的特殊字符
      const escapedPath = validatedPath.replace(/"/g, '\\"')

      switch (process.platform) {
        case 'win32':
          // Windows: 使用 Windows Terminal 或 cmd
          exec(`start cmd /K "cd /d "${escapedPath}""`)
          break
        case 'darwin':
          // macOS: 使用 Terminal 或 iTerm
          exec(`osascript -e 'tell application "Terminal" to do script "cd \\"${escapedPath}\\""'`)
          break
        case 'linux':
          // Linux: 使用 gnome-terminal 或 xterm
          exec(
            `gnome-terminal --working-directory="${escapedPath}" || xterm -e "cd '${escapedPath}' && bash"`
          )
          break
        default:
          throw new CommandExecutionError('不支持的操作系统')
      }
    } catch (error) {
      console.error('打开终端失败:', error)
      throw new CommandExecutionError(
        `打开终端失败: ${isAppError(error) ? error.message : String(error)}`
      )
    }
  }

  /**
   * 打开项目文件夹
   * @param project 项目配置
   */
  static openFolder(project: ProjectConfig): void {
    try {
      // 验证项目路径
      const validatedPath = SecurityValidator.validatePath(project.path)

      const { shell } = require('electron')
      shell.openPath(validatedPath)
    } catch (error) {
      console.error('打开文件夹失败:', error)
      throw new CommandExecutionError(
        `打开文件夹失败: ${isAppError(error) ? error.message : String(error)}`
      )
    }
  }
}
