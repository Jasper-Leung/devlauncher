/**
 * 组件加载工具
 * 用于实现动态导入和代码分割
 */

import React, { Suspense, ComponentType, lazy, Component } from 'react'
import { Loading } from './Loading'

/**
 * 组件加载选项
 */
interface LazyComponentOptions {
  /** 加载中显示的组件 */
  fallback?: React.ReactNode
  /** 加载失败时显示的组件 */
  errorFallback?: React.ReactNode
  /** 延迟加载时间（毫秒） */
  delay?: number
}

/**
 * 创建带加载状态的懒加载组件
 */
 
export function createLazyComponent<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): T {
  const {
    fallback = (
      <div>
        <Loading message="加载中..." size="small" />
      </div>
    ),
    delay = 200,
  } = options

  // 创建延迟加载组件
  const LazyComponent = lazy(
    () =>
      new Promise((resolve, reject) => {
        importFn()
          .then((module) => {
            // 添加最小延迟以避免闪烁
            setTimeout(() => resolve(module), delay)
          })
          .catch(reject)
      })
  )

  // 返回带Suspense的组件
  const WrappedComponent: T = (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  ) as T

  return WrappedComponent
}

/**
 * 带错误边界的Suspense包装器
 */
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

/**
 * 组件加载错误边界
 */
class ComponentErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('组件加载错误:', error)
    console.error('错误信息:', errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="component-error">
            <p>组件加载失败: {this.state.error?.message || '未知错误'}</p>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: '12px', padding: '8px 16px' }}
            >
              刷新页面
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}

/**
 * 安全的懒加载组件包装器
 */
export function SafeLazy<T extends ComponentType<unknown>>(
  Component: T,
  fallback?: React.ReactNode
): T {
  const WrappedComponent = (props: React.ComponentProps<T>) => (
    <ComponentErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback || <Loading message="加载中..." size="small" />}>
        <Component {...props} />
      </Suspense>
    </ComponentErrorBoundary>
  )

  return WrappedComponent as T
}

/**
 * 预加载组件
 * 用于在后台预加载可能会用到的组件
 */
export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<unknown> }>
): void {
  importFn().catch((error) => {
    console.warn('组件预加载失败:', error)
  })
}
