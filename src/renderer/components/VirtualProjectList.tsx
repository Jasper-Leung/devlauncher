/**
 * 虚拟滚动项目列表组件
 * P1 优化：只渲染可见项目，提高大型项目列表的性能
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProjectConfig } from '../../shared/types'
import { formatLastLaunched, formatProfileCount } from '../utils/formatters'
import { filterProjects } from '../utils/projectFilters'
import { VIRTUAL_SCROLL } from '../utils/constants'
import { ScrollableText } from './ScrollableText'
import './VirtualProjectList.css'

interface VirtualProjectListProps {
  projects: ProjectConfig[]
  selectedId: string | null
  searchQuery: string
  selectedGroup: string | null
  isBatchMode: boolean
  selectedIds: Set<string>
  viewMode: 'grid' | 'list'
  onProjectSelect: (id: string) => void
  onProjectToggle: (id: string) => void
  onProjectEdit: (project: ProjectConfig) => void
  onProjectDelete: (id: string) => void
}

/**
 * 虚拟滚动项目列表
 * 当项目数量超过阈值时启用虚拟滚动
 */
export function VirtualProjectList({
  projects,
  selectedId,
  searchQuery,
  selectedGroup,
  isBatchMode,
  selectedIds,
  viewMode,
  onProjectSelect,
  onProjectToggle,
  onProjectEdit,
  onProjectDelete,
}: VirtualProjectListProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(600)

  // 虚拟滚动配置
  const ITEM_HEIGHT =
    viewMode === 'list' ? VIRTUAL_SCROLL.ITEM_HEIGHT_LIST : VIRTUAL_SCROLL.ITEM_HEIGHT_GRID

  // 过滤项目
  const filteredProjects = useMemo(() => {
    return filterProjects(projects, { searchQuery, selectedGroup })
  }, [projects, searchQuery, selectedGroup])

  // 项目数量阈值：网格视图下禁用虚拟滚动，因为网格布局与绝对定位不兼容
  const useVirtualScroll = viewMode === 'list' && filteredProjects.length > VIRTUAL_SCROLL.THRESHOLD

  // 计算容器高度
  useEffect(() => {
    const updateContainerHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerHeight(rect.height || 600)
      }
    }

    updateContainerHeight()
    window.addEventListener('resize', updateContainerHeight)
    return () => window.removeEventListener('resize', updateContainerHeight)
  }, [])

  // 处理滚动事件
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (useVirtualScroll) {
        setScrollTop(e.currentTarget.scrollTop)
      }
    },
    [useVirtualScroll]
  )

  // 计算可见项目范围
  const { visibleStart, visibleEnd, totalHeight } = useMemo(() => {
    if (!useVirtualScroll) {
      return {
        visibleStart: 0,
        visibleEnd: filteredProjects.length,
        totalHeight: 'auto' as const,
      }
    }

    const totalHeight = filteredProjects.length * ITEM_HEIGHT
    const visibleStart = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - VIRTUAL_SCROLL.OVERSCAN)
    const visibleEnd = Math.min(
      filteredProjects.length,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + VIRTUAL_SCROLL.OVERSCAN
    )

    return { visibleStart, visibleEnd, totalHeight }
  }, [useVirtualScroll, filteredProjects.length, scrollTop, containerHeight, ITEM_HEIGHT])

  // 渲染单个项目
  const renderProjectItem = useCallback(
    (project: ProjectConfig, index: number) => {
      const top = useVirtualScroll ? index * ITEM_HEIGHT : undefined

      return (
        <li
          key={project.id}
          className={`project-list-item ${selectedId === project.id ? 'active' : ''} ${selectedIds.has(project.id) ? 'selected' : ''} ${isBatchMode ? 'batch-mode' : ''}`}
          style={
            useVirtualScroll
              ? { position: 'absolute', top: `${top}px`, width: '100%', height: `${ITEM_HEIGHT}px` }
              : undefined
          }
          onClick={() => !isBatchMode && onProjectSelect(project.id)}
        >
          <div className="project-list-item-header">
            {isBatchMode && (
              <div
                className="checkbox"
                onClick={(e) => {
                  e.stopPropagation()
                  onProjectToggle(project.id)
                }}
              >
                {selectedIds.has(project.id) ? '☑️' : '☐'}
              </div>
            )}
            <ScrollableText text={project.name} />
            <div className="project-list-item-actions">
              <button
                className="icon-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onProjectEdit(project)
                }}
                title={t('common.edit')}
              >
                ✏️
              </button>
              <button
                className="icon-btn danger"
                onClick={(e) => {
                  e.stopPropagation()
                  onProjectDelete(project.id)
                }}
                title={t('common.delete')}
              >
                🗑️
              </button>
            </div>
          </div>
          <div className="project-list-item-footer">
            <span className={`status-dot ${project.status}`}></span>
            {project.lastLaunched && (
              <span className="last-launched">{formatLastLaunched(project.lastLaunched)}</span>
            )}
            {project.startupProfiles && project.startupProfiles.length > 0 && (
              <span className="profile-count">
                {formatProfileCount(project.startupProfiles.length)}
              </span>
            )}
          </div>
        </li>
      )
    },
    [
      selectedId,
      selectedIds,
      isBatchMode,
      onProjectSelect,
      onProjectToggle,
      onProjectEdit,
      onProjectDelete,
      useVirtualScroll,
      ITEM_HEIGHT,
      t,
    ]
  )

  // 可见项目列表
  const visibleProjects = useMemo(() => {
    if (!useVirtualScroll) {
      return filteredProjects
    }

    return filteredProjects.slice(visibleStart, visibleEnd)
  }, [useVirtualScroll, filteredProjects, visibleStart, visibleEnd])

  return (
    <div
      ref={containerRef}
      className={`project-list-container ${viewMode === 'list' ? 'list-view' : ''} ${useVirtualScroll ? 'virtual-scroll' : ''}`}
      onScroll={handleScroll}
      style={{ height: '100%', overflow: 'auto' }}
    >
      <ul
        className="project-list"
        style={{
          position: 'relative',
          height: useVirtualScroll ? `${totalHeight}px` : 'auto',
          margin: 0,
          padding: 0,
        }}
      >
        {useVirtualScroll && visibleStart > 0 && (
          <div style={{ height: `${visibleStart * ITEM_HEIGHT}px` }} />
        )}
        {visibleProjects.map((project, idx) =>
          renderProjectItem(project, useVirtualScroll ? visibleStart + idx : idx)
        )}
        {useVirtualScroll && visibleEnd < filteredProjects.length && (
          <div style={{ height: `${(filteredProjects.length - visibleEnd) * ITEM_HEIGHT}px` }} />
        )}
      </ul>
    </div>
  )
}

export default VirtualProjectList
