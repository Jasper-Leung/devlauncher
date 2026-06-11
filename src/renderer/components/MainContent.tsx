/**
 * 主内容区域组件
 * P2 优化：从 App.tsx 拆分出来，负责显示选中项目的详情
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import type { ProjectConfig } from '../../shared/types'
import { StartupProfiles } from './StartupProfiles'
import { LogViewer } from './LogViewer'
import './MainContent.css'

interface MainContentProps {
  selectedProject: ProjectConfig | null
  logs: Record<string, string>
  onStartProfile: (project: ProjectConfig, profileId: string) => void
  onStopProject: (project: ProjectConfig) => void
  onOpenIde: (project: ProjectConfig) => void
  onOpenFolder: (project: ProjectConfig) => void
  onOpenTerminal: (project: ProjectConfig) => void
  onEditProject: (project: ProjectConfig) => void
  onRunCustomCommand: (project: ProjectConfig, commandName: string) => void
  onClearLogs: (projectId: string) => void
}

/**
 * 空状态组件
 */
const EmptyState: React.FC<{
  icon: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}> = ({ icon, title, description, actionLabel, onAction }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction} style={{ marginTop: '20px' }}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

/**
 * 项目详情卡片组件
 */
const ProjectDetailCard: React.FC<{
  project: ProjectConfig
  logs: Record<string, string>
  onStartProfile: (project: ProjectConfig, profileId: string) => void
  onStopProject: (project: ProjectConfig) => void
  onOpenIde: (project: ProjectConfig) => void
  onOpenFolder: (project: ProjectConfig) => void
  onOpenTerminal: (project: ProjectConfig) => void
  onEditProject: (project: ProjectConfig) => void
  onRunCustomCommand: (project: ProjectConfig, commandName: string) => void
  onClearLogs: (projectId: string) => void
}> = ({
  project,
  logs,
  onStartProfile,
  onStopProject,
  onOpenIde,
  onOpenFolder,
  onOpenTerminal,
  onEditProject,
  onRunCustomCommand,
  onClearLogs,
}) => {
  const { t } = useTranslation()

  return (
    <div key={project.id} className="project-card">
      {/* 项目头部 */}
      <div className="project-card-header">
        <div className="project-card-title">
          <h3>{project.name}</h3>
          <p className="project-card-path">{project.path}</p>
          {project.description && <p className="project-card-description">{project.description}</p>}
        </div>
        <div className="status-indicator">
          <span className={`status-dot ${project.status}`}></span>
          {project.status === 'running'
            ? project.startupProfiles?.find((p) => p.id === project.activeProfileId)?.name ||
              t('common.running')
            : t('common.stopped')}
        </div>
      </div>

      {/* 项目标签 */}
      {project.tags && project.tags.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {project.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 启动配置 */}
      <StartupProfiles
        project={project}
        onStartProfile={onStartProfile}
        onStopProject={onStopProject}
      />

      {/* 通用操作按钮 */}
      <div className="actions">
        <button className="btn btn-primary" onClick={() => onOpenIde(project)}>
          💻 {t('mainContent.openIde')}
        </button>
        <button className="btn btn-secondary" onClick={() => onOpenFolder(project)}>
          📁 {t('mainContent.openFolder')}
        </button>
        <button className="btn btn-secondary" onClick={() => onOpenTerminal(project)}>
          🖥 {t('mainContent.openTerminal')}
        </button>
        <button className="btn btn-secondary" onClick={() => onEditProject(project)}>
          ✏️ {t('mainContent.editProject')}
        </button>
      </div>

      {/* 自定义命令 */}
      {project.customCommands && project.customCommands.length > 0 && (
        <div className="custom-commands">
          {project.customCommands.map((cmd, index) => (
            <button
              key={index}
              className="custom-command-btn"
              onClick={() => onRunCustomCommand(project, cmd.name)}
            >
              {cmd.name}
            </button>
          ))}
        </div>
      )}

      {/* 日志查看器 */}
      <LogViewer
        logs={logs}
        projectId={project.id}
        onClear={() => onClearLogs(project.id)}
        isRunning={project.status === 'running'}
      />
    </div>
  )
}

/**
 * 主内容区域组件
 */
export const MainContent: React.FC<MainContentProps> = ({
  selectedProject,
  logs,
  onStartProfile,
  onStopProject,
  onOpenIde,
  onOpenFolder,
  onOpenTerminal,
  onEditProject,
  onRunCustomCommand,
  onClearLogs,
}) => {
  const { t } = useTranslation()
  return (
    <div className="main-content">
      {selectedProject ? (
        <ProjectDetailCard
          project={selectedProject}
          logs={logs}
          onStartProfile={onStartProfile}
          onStopProject={onStopProject}
          onOpenIde={onOpenIde}
          onOpenFolder={onOpenFolder}
          onOpenTerminal={onOpenTerminal}
          onEditProject={onEditProject}
          onRunCustomCommand={onRunCustomCommand}
          onClearLogs={onClearLogs}
        />
      ) : (
        <EmptyState
          icon="📁"
          title={t('mainContent.selectProject')}
          description={t('mainContent.selectProjectDesc')}
        />
      )}
    </div>
  )
}

export default MainContent
