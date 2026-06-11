/**
 * 安全验证工具
 * 用于验证用户输入和命令，防止命令注入和路径遍历攻击
 */

import * as path from 'path'
import * as fs from 'fs'
import { SecurityError, PathValidationError } from '../../shared/errorTypes'

/**
 * PtyOptions 接口定义
 */
export interface PtyOptions {
  name: string
  cwd: string
  env: Record<string, string>
  encoding?: string
}

/**
 * 安全常量（导出以供其他模块使用）
 */
export const SECURITY_CONSTANTS = {
  /** 最大命令长度（防止过长的命令） */
  MAX_COMMAND_LENGTH: 10000,
  /** 最大路径长度 */
  MAX_PATH_LENGTH: 1000,
  /** 日志最大长度（防止内存泄漏） */
  MAX_LOG_LENGTH: 50000,
  /** 允许的命令前缀白名单 */
  ALLOWED_COMMAND_PREFIXES: [
    'npm',
    'yarn',
    'pnpm',
    'bun',
    'npx',
    'node',
    'python',
    'python3',
    'pip',
    'pip3',
    'php',
    'composer',
    'java',
    'javac',
    'mvn',
    'gradle',
    'go',
    'gorun',
    'rust',
    'cargo',
    'ruby',
    'gem',
    'dotnet',
    'docker',
    'docker-compose',
    'make',
    'cmake',
    'gulp',
    'grunt',
    'webpack',
    'vite',
    'next',
    'nuxt',
    'remix',
    'astro',
    'svelte',
    'serve',
    'live-server',
    'http-server',
    'code',
    'cmd',
    'bash',
    'zsh',
    'fish',
    'powershell',
    'pwsh',
    'exit',
  ],
  /** 危险字符黑名单（除基本命令分隔符外） */
  DANGEROUS_PATTERNS: [
    /;\s*rm\s+-rf/, // rm -rf
    /;\s*del\s+/, // del (Windows)
    /del\s+\/[fq]+\s+[a-z]:[\\*]/i, // del /f /q c:\ (强制删除 Windows 根目录文件)
    /`.*\$\(.*\)/, // 命令替换
    /\$\(.*\)/, // 命令替换
    /`.*`/, // 命令替换
    />\s*\/(?:dev|null)/, // 输出重定向到设备文件
    /\|\s*rm\s/, // 管道到rm
  ],
  /** 路径遍历模式 */
  PATH_TRAVERSAL_PATTERNS: [
    /\.\.[/\\]/, // ../ 或 ..\
    /^\.+[/\\]?$/, // 仅 ... 或 .. 等
  ],
  /** 允许的环境变量名称模式 */
  ENV_VAR_PATTERN: /^[A-Za-z_][A-Za-z0-9_]*$/,
}

/**
 * 安全验证器类
 */
export class SecurityValidator {
  /**
   * 验证命令是否安全
   * @param command 待验证的命令
   * @returns 验证后的安全命令
   * @throws SecurityError 如果命令不安全
   */
  static validateCommand(command: string): string {
    // 基本验证
    if (!command || typeof command !== 'string') {
      throw new SecurityError('命令不能为空')
    }

    const trimmed = command.trim()

    // 检查命令长度
    if (trimmed.length > SECURITY_CONSTANTS.MAX_COMMAND_LENGTH) {
      throw new SecurityError('命令长度超过限制')
    }

    // 检查危险模式
    for (const pattern of SECURITY_CONSTANTS.DANGEROUS_PATTERNS) {
      if (pattern.test(trimmed)) {
        throw new SecurityError('命令包含危险操作')
      }
    }

    // 对于特定命令，检查是否以允许的前缀开头
    // 注意：这只是额外验证，基本的命令如 npm run dev 是允许的
    const firstWord = trimmed.split(/\s+/)[0].toLowerCase()

    // Windows cmd /c 前缀处理
    const actualCommand = trimmed.startsWith('cmd /c ')
      ? trimmed
          .substring(7)
          .trim()
          .replace(/^"(.*)"$/, '$1')
      : trimmed

    const actualFirstWord = actualCommand.split(/\s+/)[0].toLowerCase()

    // 检查是否是已知的包管理器或开发工具
    const isKnownTool = SECURITY_CONSTANTS.ALLOWED_COMMAND_PREFIXES.some(
      (prefix) =>
        actualFirstWord === prefix.toLowerCase() ||
        actualFirstWord.startsWith(prefix.toLowerCase() + ' ')
    )

    // 如果不是已知工具，进行更严格的检查
    if (!isKnownTool) {
      // 允许常见的开发命令格式（如 .\script, ./script 等）
      const isRelativeScript = /^\.\/|^\.\\/i.test(actualCommand)
      const isSimpleCommand = /^[a-z][a-z0-9_-]*(\s|$)/i.test(actualCommand)

      if (!isRelativeScript && !isSimpleCommand) {
        throw new SecurityError(`未知或不允许的命令: ${firstWord}`)
      }
    }

    return trimmed
  }

  /**
   * 验证并清理环境变量
   * @param env 环境变量对象
   * @returns 清理后的环境变量
   */
  static validateEnvironmentVariables(env: Record<string, string> = {}): Record<string, string> {
    const cleaned: Record<string, string> = {}

    for (const [key, value] of Object.entries(env)) {
      // 验证环境变量名称
      if (!SECURITY_CONSTANTS.ENV_VAR_PATTERN.test(key)) {
        throw new SecurityError(`无效的环境变量名称: ${key}`)
      }

      // 验证环境变量值
      if (typeof value !== 'string') {
        throw new SecurityError(`环境变量 ${key} 的值必须是字符串`)
      }

      // 检查值中是否包含危险命令
      for (const pattern of SECURITY_CONSTANTS.DANGEROUS_PATTERNS) {
        if (pattern.test(value)) {
          throw new SecurityError(`环境变量 ${key} 包含危险内容`)
        }
      }

      cleaned[key] = value
    }

    return cleaned
  }

  /**
   * 验证路径是否安全
   * @param targetPath 待验证的路径
   * @param basePath 基础路径（用于验证相对路径）
   * @returns 规范化后的绝对路径
   * @throws PathValidationError 如果路径不安全
   */
  static validatePath(targetPath: string, basePath?: string): string {
    if (!targetPath || typeof targetPath !== 'string') {
      throw new PathValidationError('路径不能为空')
    }

    // 检查路径长度
    if (targetPath.length > SECURITY_CONSTANTS.MAX_PATH_LENGTH) {
      throw new PathValidationError('路径长度超过限制')
    }

    // 检查路径遍历攻击
    for (const pattern of SECURITY_CONSTANTS.PATH_TRAVERSAL_PATTERNS) {
      if (pattern.test(targetPath)) {
        throw new PathValidationError('路径包含非法字符或路径遍历尝试')
      }
    }

    // 规范化路径
    let normalizedPath = path.normalize(targetPath)

    // 如果是相对路径且有基础路径，则转换为绝对路径
    if (!path.isAbsolute(normalizedPath)) {
      if (!basePath) {
        throw new PathValidationError('相对路径需要提供基础路径')
      }
      normalizedPath = path.resolve(basePath, normalizedPath)
    }

    // 再次检查规范化后的路径
    for (const pattern of SECURITY_CONSTANTS.PATH_TRAVERSAL_PATTERNS) {
      if (pattern.test(normalizedPath)) {
        throw new PathValidationError('路径包含非法字符')
      }
    }

    return normalizedPath
  }

  /**
   * 验证路径是否存在且可访问
   * @param targetPath 待验证的路径
   * @returns 路径信息
   * @throws PathValidationError 如果路径不可访问
   */
  static validatePathAccessible(targetPath: string): { exists: boolean; isDirectory: boolean } {
    try {
      const normalizedPath = this.validatePath(targetPath)
      const stats = fs.statSync(normalizedPath, { throwIfNoEntry: false })

      return {
        exists: stats !== null,
        isDirectory: stats?.isDirectory() ?? false,
      }
    } catch (error) {
      if (error instanceof PathValidationError) {
        throw error
      }
      throw new PathValidationError(`无法访问路径: ${getErrorMessage(error)}`)
    }
  }

  /**
   * 创建安全的 PtyOptions
   * @param cwd 工作目录
   * @param env 环境变量
   * @returns 安全的 PtyOptions
   */
  static createPtyOptions(cwd: string, env: Record<string, string> = {}): PtyOptions {
    const validatedPath = this.validatePath(cwd)
    const validatedEnv = this.validateEnvironmentVariables(env)

    // 过滤 process.env 中的 undefined 值
    const processEnv: Record<string, string> = {}
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        processEnv[key] = value
      }
    }

    const options: PtyOptions = {
      name: 'xterm-color',
      cwd: validatedPath,
      env: { ...processEnv, ...validatedEnv },
    }

    // Windows 不支持 encoding 参数
    if (process.platform !== 'win32') {
      options.encoding = 'utf-8'
    }

    // Windows 上设置额外的环境变量以确保正确处理控制台输入和信号
    if (process.platform === 'win32') {
      // 确保 PTY 能够正确处理 Ctrl+C 信号
      options.env['FORCE_COLOR'] = '1'
      // 确保使用与主进程相同的 ConPTY 设置
      options.env['NODE_PTY_DISABLE_CONPTY'] = process.env.NODE_PTY_DISABLE_CONPTY || '1'
    }

    return options
  }

  /**
   * 限制日志大小，防止内存泄漏
   * @param currentLog 当前日志内容
   * @param newData 新增的数据
   * @returns 限制后的日志内容
   */
  static limitLogSize(currentLog: string, newData: string): string {
    const maxLength = SECURITY_CONSTANTS.MAX_LOG_LENGTH
    const combined = currentLog + newData

    if (combined.length <= maxLength) {
      return combined
    }

    // 计算需要保留的长度（为警告消息预留空间）
    const warningMessage = '\n[日志已截断]'
    const warningLength = warningMessage.length
    const keepLength = maxLength - warningLength

    // 保留后半部分
    const excess = combined.length - keepLength
    const truncated = combined.slice(excess)

    return truncated + warningMessage
  }

  /**
   * 验证 IDE 命令
   * @param command IDE 命令
   * @returns 验证后的命令
   */
  static validateIdeCommand(command: string): string {
    const trimmed = command.trim()

    // 常见的 IDE 命令白名单
    const allowedIdeCommands = [
      'code', // VS Code
      'code-insiders',
      'cursor',
      'idea', // IntelliJ IDEA
      'webstorm',
      'phpstorm',
      'pycharm',
      'goland',
      'clion',
      'rider',
      'datagrip',
      'appcode',
      'android-studio',
      'subl', // Sublime Text
      'atom',
      'vim',
      'nvim',
      'nano',
      'vi',
      '.', // 当前目录（许多 IDE 支持这种语法）
    ]

    const firstWord = trimmed.split(/\s+/)[0].toLowerCase()

    if (!allowedIdeCommands.includes(firstWord)) {
      throw new SecurityError(`不允许的 IDE 命令: ${firstWord}`)
    }

    // 对于 "." 命令，跳过额外的命令验证
    if (firstWord === '.') {
      return trimmed
    }

    return this.validateCommand(trimmed)
  }

  /**
   * 验证自定义命令名称
   * @param name 命令名称
   * @returns 验证后的名称
   */
  static validateCommandName(name: string): string {
    const trimmed = name.trim()

    if (trimmed.length === 0 || trimmed.length > 50) {
      throw new SecurityError('命令名称长度必须在 1-50 个字符之间')
    }

    // 只允许字母、数字、空格、中文字符和常见符号
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9\s\-_@+.]+$/.test(trimmed)) {
      throw new SecurityError('命令名称包含非法字符')
    }

    return trimmed
  }
}

/**
 * 辅助函数：获取错误消息
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}
