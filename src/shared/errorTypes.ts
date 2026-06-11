/**
 * 统一的错误类型定义
 * 用于整个应用的错误处理
 */

/**
 * 应用错误基类
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public stack?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * 安全验证错误
 */
export class SecurityError extends AppError {
  constructor(message: string) {
    super(message, 'SECURITY_ERROR')
    this.name = 'SecurityError'
  }
}

/**
 * 命令执行错误
 */
export class CommandExecutionError extends AppError {
  constructor(
    message: string,
    public exitCode?: number
  ) {
    super(message, 'COMMAND_ERROR')
    this.name = 'CommandExecutionError'
  }
}

/**
 * 路径验证错误
 */
export class PathValidationError extends AppError {
  constructor(message: string) {
    super(message, 'PATH_ERROR')
    this.name = 'PathValidationError'
  }
}

/**
 * 文件操作错误
 */
export class FileOperationError extends AppError {
  constructor(
    message: string,
    public path?: string
  ) {
    super(message, 'FILE_ERROR')
    this.name = 'FileOperationError'
  }
}

/**
 * 工具函数：判断是否为应用错误
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * 工具函数：安全获取错误消息
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

/**
 * 工具函数：安全获取错误堆栈
 */
export function getErrorStack(error: unknown): string | undefined {
  if (isAppError(error)) {
    return error.stack
  }
  if (error instanceof Error) {
    return error.stack
  }
  return undefined
}
