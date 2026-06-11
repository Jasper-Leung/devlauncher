import React from 'react'
import { useTranslation } from 'react-i18next'
import type { ProjectConfig } from '../../shared/types'
import { formatLastLaunched, formatProfileCount } from '../utils/formatters'
import { filterProjects } from '../utils/projectFilters'
import { ScrollableText } from './ScrollableText'
import './ProjectList.css'

interface ProjectListProps {
  projects: ProjectConfig[]
  selectedId: string | null
  searchQuery: string
  selectedGroup: string | null
  isBatchMode: boolean
  selectedIds: Set<string>
  viewMode: 'grid' | 'list'
  excludedTags: string[]
  onProjectSelect: (id: string) => void
  onProjectToggle: (id: string) => void
  onProjectEdit: (project: ProjectConfig) => void
  onProjectDelete: (id: string) => void
}

export function ProjectList({
  projects,
  selectedId,
  searchQuery,
  selectedGroup,
  isBatchMode,
  selectedIds,
  viewMode,
  excludedTags,
  onProjectSelect,
  onProjectToggle,
  onProjectEdit,
  onProjectDelete,
}: ProjectListProps) {
  const { t } = useTranslation()
  const filteredProjects = filterProjects(projects, { searchQuery, selectedGroup, excludedTags })

  return (
    <ul className={`project-list ${viewMode === 'list' ? 'list-view' : ''}`}>
      {filteredProjects.map((project) => (
        <li
          key={project.id}
          className={`project-list-item ${selectedId === project.id ? 'active' : ''} ${selectedIds.has(project.id) ? 'selected' : ''} ${isBatchMode ? 'batch-mode' : ''}`}
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
      ))}
    </ul>
  )
}
