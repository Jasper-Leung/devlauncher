/**
 * 统一日志工具
 * 在生产环境可以轻松禁用或重定向日志
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

/**
 * 获取当前环境
 */
const isDevelopment = import.meta.env.MODE === 'development'

/**
 * 日志配置
 */
interface LoggerConfig {
  enabled: boolean
  level: LogLevel
}

// 默认配置：开发环境启用所有日志，生产环境只启用错误日志
const defaultConfig: LoggerConfig = {
  enabled: isDevelopment,
  level: isDevelopment ? 'debug' : 'error',
}

let currentConfig: LoggerConfig = { ...defaultConfig }

/**
 * 日志级别优先级
 */
const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  log: 1,
  info: 2,
  warn: 3,
  error: 4,
}

/**
 * 检查是否应该输出日志
 */
function shouldLog(level: LogLevel): boolean {
  if (!currentConfig.enabled) return false
  return levelPriority[level] >= levelPriority[currentConfig.level]
}

/**
 * 格式化日志前缀
 */
function formatPrefix(level: LogLevel, context?: string): string {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 12)
  const contextStr = context ? `[${context}] ` : ''
  return `[${timestamp}] ${level.toUpperCase()} ${contextStr}`
}

/**
 * 统一日志接口
 */
export const logger = {
  /**
   * 设置日志配置
   */
  configure(config: Partial<LoggerConfig>): void {
    currentConfig = { ...currentConfig, ...config }
  },

  /**
   * 获取当前配置
   */
  getConfig(): LoggerConfig {
    return { ...currentConfig }
  },

  /**
   * 输出调试日志
   */
  debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.debug(formatPrefix('debug'), message, ...args)
    }
  },

  /**
   * 输出普通日志
   */
  log(message: string, ...args: unknown[]): void {
    if (shouldLog('log')) {
      console.log(formatPrefix('log'), message, ...args)
    }
  },

  /**
   * 输出信息日志
   */
  info(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.info(formatPrefix('info'), message, ...args)
    }
  },

  /**
   * 输出警告日志
   */
  warn(message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(formatPrefix('warn'), message, ...args)
    }
  },

  /**
   * 输出错误日志
   */
  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (shouldLog('error')) {
      console.error(formatPrefix('error'), message, error, ...args)
    }
  },

  /**
   * 创建带上下文的日志记录器
   */
  context(context: string) {
    return {
      debug: (message: string, ...args: unknown[]) => logger.debug(message, ...args),
      log: (message: string, ...args: unknown[]) => logger.log(message, ...args),
      info: (message: string, ...args: unknown[]) => logger.info(message, ...args),
      warn: (message: string, ...args: unknown[]) => logger.warn(message, ...args),
      error: (message: string, error?: Error | unknown, ...args: unknown[]) =>
        logger.error(`[${context}] ${message}`, error, ...args),
    }
  },
}

/**
 * 便捷的上下文日志记录器创建函数
 */
export function createLogger(context: string) {
  return logger.context(context)
}

// 默认导出
export default logger
