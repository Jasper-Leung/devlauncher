/**
 * 全局错误边界组件
 * 捕获 React 组件树中的错误，防止应用崩溃
 * 这是 P0 级别的错误处理改进
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { getErrorMessage } from '../../shared/errorTypes'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * 错误边界组件
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    // 更新状态使下一次渲染能够显示降级后的 UI
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 可以将错误日志上报给服务器
    console.error('ErrorBoundary 捕获到错误:', error)
    console.error('错误堆栈:', errorInfo.componentStack)

    // 保存错误信息到状态
    this.setState({
      error,
      errorInfo,
    })

    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 将错误信息保存到 localStorage 以便调试
    try {
      localStorage.setItem(
        'lastError',
        JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: Date.now(),
        })
      )
    } catch {
      // 忽略存储错误
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    // 清除存储的错误信息
    try {
      localStorage.removeItem('lastError')
    } catch {
      // 忽略存储错误
    }
    // 刷新页面
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义降级 UI，则使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误 UI
      return (
        <div style={errorContainerStyle}>
          <div style={errorBoxStyle}>
            <div style={iconStyle}>⚠️</div>
            <h1 style={titleStyle}>出错了</h1>
            <p style={messageStyle}>应用遇到了一个意外错误。您可以尝试刷新页面或重启应用。</p>

            {this.state.error && (
              <details style={detailsStyle}>
                <summary style={summaryStyle}>错误详情</summary>
                <div style={errorContentStyle}>
                  <div style={errorLabelStyle}>错误信息:</div>
                  <pre style={preStyle}>{getErrorMessage(this.state.error)}</pre>

                  {this.state.error.stack && (
                    <>
                      <div style={errorLabelStyle}>堆栈信息:</div>
                      <pre style={preStyle}>{this.state.error.stack}</pre>
                    </>
                  )}

                  {this.state.errorInfo?.componentStack && (
                    <>
                      <div style={errorLabelStyle}>组件堆栈:</div>
                      <pre style={preStyle}>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div style={buttonContainerStyle}>
              <button onClick={this.handleReset} style={buttonStyle}>
                🔄 刷新页面
              </button>
              <button
                onClick={() => {
                  // 发送 IPC 事件让主进程重启应用
                  window.location.reload()
                }}
                style={{ ...buttonStyle, ...secondaryButtonStyle }}
              >
                🏠 返回首页
              </button>
            </div>

            <p style={hintStyle}>如果问题持续存在，请检查控制台日志或联系技术支持。</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 样式定义
const errorContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: '20px',
  backgroundColor: 'var(--bg-primary, #1a1a1a)',
  color: 'var(--text-primary, #ffffff)',
}

const errorBoxStyle: React.CSSProperties = {
  maxWidth: '600px',
  width: '100%',
  padding: '40px',
  borderRadius: '12px',
  backgroundColor: 'var(--bg-secondary, #2a2a2a)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  textAlign: 'center',
}

const iconStyle: React.CSSProperties = {
  fontSize: '64px',
  marginBottom: '20px',
}

const titleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  color: 'var(--error-color, #ff6b6b)',
}

const messageStyle: React.CSSProperties = {
  fontSize: '16px',
  color: 'var(--text-secondary, #a0a0a0)',
  marginBottom: '24px',
  lineHeight: '1.6',
}

const detailsStyle: React.CSSProperties = {
  marginTop: '24px',
  marginBottom: '24px',
  textAlign: 'left',
}

const summaryStyle: React.CSSProperties = {
  cursor: 'pointer',
  padding: '8px',
  backgroundColor: 'var(--bg-tertiary, #3a3a3a)',
  borderRadius: '6px',
  userSelect: 'none',
}

const errorContentStyle: React.CSSProperties = {
  marginTop: '12px',
  padding: '16px',
  backgroundColor: 'var(--bg-tertiary, #1a1a1a)',
  borderRadius: '6px',
  maxHeight: '300px',
  overflow: 'auto',
}

const errorLabelStyle: React.CSSProperties = {
  fontWeight: 'bold',
  marginTop: '12px',
  marginBottom: '4px',
  color: 'var(--text-secondary, #a0a0a0)',
}

const preStyle: React.CSSProperties = {
  margin: '0',
  padding: '12px',
  backgroundColor: 'var(--bg-quaternary, #0a0a0a)',
  borderRadius: '4px',
  fontSize: '12px',
  overflow: 'auto',
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'center',
  marginTop: '24px',
}

const buttonStyle: React.CSSProperties = {
  padding: '12px 24px',
  fontSize: '16px',
  fontWeight: '500',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  backgroundColor: 'var(--primary-color, #4a9eff)',
  color: 'white',
  transition: 'all 0.2s',
}

const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-tertiary, #3a3a3a)',
}

const hintStyle: React.CSSProperties = {
  marginTop: '20px',
  fontSize: '14px',
  color: 'var(--text-secondary, #666666)',
}

/**
 * 简单的错误边界 Hook 版本（用于函数组件）
 */
export function useErrorHandler(): (error: Error) => void {
  return React.useCallback((error: Error) => {
    throw error
  }, [])
}

/**
 * 高阶组件版本（用于包装现有组件）
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
): React.ComponentType<P> {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
