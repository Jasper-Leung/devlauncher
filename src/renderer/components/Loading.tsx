/**
 * 加载状态组件
 * P2 优化：为长时间操作添加加载状态提示
 */

import React from 'react'
import './Loading.css'

export interface LoadingProps {
  /** 加载消息 */
  message?: string
  /** 是否为小型加载指示器 */
  size?: 'small' | 'medium' | 'large'
  /** 是否全屏显示 */
  fullscreen?: boolean
  /** 附加类名 */
  className?: string
}

/**
 * 加载状态组件
 */
export const Loading: React.FC<LoadingProps> = ({
  message,
  size = 'medium',
  fullscreen = false,
  className = '',
}) => {
  const sizeClass = `loading-${size}`

  if (fullscreen) {
    return (
      <div className={`loading-overlay ${className}`}>
        <div className={`loading-container ${sizeClass}`}>
          <div className="spinner" />
          {message && <p className="loading-message">{message}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={`loading-inline ${sizeClass} ${className}`}>
      <div className="spinner" />
      {message && <span className="loading-message">{message}</span>}
    </div>
  )
}

/**
 * 进度条组件
 */
export interface ProgressProps {
  /** 当前进度（0-100） */
  value: number
  /** 总进度 */
  max?: number
  /** 状态消息 */
  message?: string
  /** 是否显示百分比 */
  showPercentage?: boolean
  /** 附加类名 */
  className?: string
}

/**
 * 进度条组件
 */
export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  message,
  showPercentage = true,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={`progress-container ${className}`}>
      {message && (
        <div className="progress-message">
          <span className="progress-text">{message}</span>
          {showPercentage && <span className="progress-percentage">{percentage.toFixed(0)}%</span>}
        </div>
      )}
      <div className="progress-bar-bg">
        <div
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}

/**
 * 批量操作进度组件
 */
export interface BatchProgressProps {
  /** 当前索引 */
  current: number
  /** 总数 */
  total: number
  /** 成功数量 */
  success?: number
  /** 失败数量 */
  failed?: number
  /** 当前处理的项目名称 */
  currentItem?: string
  /** 附加类名 */
  className?: string
}

/**
 * 批量操作进度组件
 */
export const BatchProgress: React.FC<BatchProgressProps> = ({
  current,
  total,
  success = 0,
  failed = 0,
  currentItem,
  className = '',
}) => {
  const percentage = Math.min(Math.max((current / total) * 100, 0), 100)

  return (
    <div className={`batch-progress ${className}`}>
      <div className="batch-progress-header">
        <span className="batch-progress-text">
          处理中: {current} / {total}
        </span>
        <span className="batch-progress-percentage">{percentage.toFixed(0)}%</span>
      </div>
      <div className="progress-bar-bg">
        <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
      </div>
      {currentItem && (
        <div className="batch-progress-current" title={currentItem}>
          当前: {currentItem}
        </div>
      )}
      {(success > 0 || failed > 0) && (
        <div className="batch-progress-stats">
          {success > 0 && <span className="batch-success">✓ {success}</span>}
          {failed > 0 && <span className="batch-failed">✗ {failed}</span>}
        </div>
      )}
    </div>
  )
}

export default Loading
