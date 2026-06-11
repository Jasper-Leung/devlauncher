/**
 * 侧边栏宽度调节手柄组件
 * 允许用户通过拖拽来调整侧边栏宽度
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import './Resizer.css'

interface ResizerProps {
  /** 当前侧边栏宽度 */
  width: number
  /** 宽度变化回调 */
  onWidthChange: (width: number) => void
  /** 最小宽度 */
  minWidth?: number
  /** 最大宽度 */
  maxWidth?: number
}

export function Resizer({ width, onWidthChange, minWidth = 300, maxWidth = 1200 }: ResizerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  // 开始拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    startX.current = e.clientX
    startWidth.current = width
    // 防止文本选择
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ew-resize'
  }, [width])

  // 拖拽中
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX.current
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth.current + deltaX))
      onWidthChange(newWidth)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, minWidth, maxWidth, onWidthChange])

  return (
    <div
      className={`resizer ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
      title="拖拽调整宽度"
    >
      <div className="resizer-handle">
        <div className="resizer-line"></div>
      </div>
    </div>
  )
}

export default Resizer
