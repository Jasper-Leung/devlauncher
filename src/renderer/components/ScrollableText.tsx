import React, { useRef, useEffect, useState } from 'react'
import { SCROLLABLE_TEXT } from '../utils/constants'
import './ScrollableText.css'

interface ScrollableTextProps {
  text: string
}

/**
 * 可滚动文本组件
 * 当文本溢出时，鼠标悬停会自动滚动显示完整内容
 */
export function ScrollableText({ text }: ScrollableTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const checkOverflow = () => {
      setIsOverflowing(container.scrollWidth > container.clientWidth)
    }

    checkOverflow()

    const resizeObserver = new ResizeObserver(checkOverflow)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [text])

  const handleMouseEnter = () => {
    const container = containerRef.current
    if (!container || !isOverflowing) return

    const scrollDistance = container.scrollWidth - container.clientWidth
    let startTime: number | null = null
    const { ANIMATION_DURATION, PAUSE_DURATION, TOTAL_DURATION } = SCROLLABLE_TEXT

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime

      if (elapsed < PAUSE_DURATION) {
        // Pause at start
        container.scrollLeft = 0
      } else if (elapsed < PAUSE_DURATION + ANIMATION_DURATION) {
        // Scroll to show full text
        const progress = (elapsed - PAUSE_DURATION) / ANIMATION_DURATION
        // Use ease-in-out function
        const easeProgress =
          progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
        container.scrollLeft = easeProgress * scrollDistance
      } else if (elapsed < TOTAL_DURATION) {
        // Return to start
        const returnProgress =
          (elapsed - PAUSE_DURATION - ANIMATION_DURATION) /
          (TOTAL_DURATION - PAUSE_DURATION - ANIMATION_DURATION)
        const easeReturnProgress =
          returnProgress < 0.5
            ? 2 * returnProgress * returnProgress
            : 1 - Math.pow(-2 * returnProgress + 2, 2) / 2
        container.scrollLeft = scrollDistance * (1 - easeReturnProgress)
      } else {
        // Restart animation
        startTime = currentTime
        container.scrollLeft = 0
      }

      requestAnimationFrame(animate)
    }

    const animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }

  const handleMouseLeave = () => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0
    }
  }

  return (
    <span
      ref={containerRef}
      className="project-list-item-name"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {text}
    </span>
  )
}

export default ScrollableText
