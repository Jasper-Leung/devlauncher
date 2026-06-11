import React from 'react'
import { useTranslation } from 'react-i18next'
import type { ProjectConfig } from '../../shared/types'
import { getProfileIcon, getProfileTypeClass } from '../utils/formatters'
import './StartupProfiles.css'

interface StartupProfilesProps {
  project: ProjectConfig
  onStartProfile: (project: ProjectConfig, profileId: string) => void
  onStopProject: (project: ProjectConfig) => void
}

export function StartupProfiles({ project, onStartProfile, onStopProject }: StartupProfilesProps) {
  const { t } = useTranslation()

  if (!project.startupProfiles || project.startupProfiles.length === 0) {
    return (
      <div className="startup-profiles">
        <h4 className="startup-profiles-title">{t('startupProfiles.title')}</h4>
        <div className="no-profiles">
          <p>{t('startupProfiles.noProfiles')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="startup-profiles">
      <h4 className="startup-profiles-title">{t('startupProfiles.title')}</h4>
      <div className="startup-profiles-list">
        {project.startupProfiles.map((profile) => (
          <div
            key={profile.id}
            className={`startup-profile-item ${project.activeProfileId === profile.id ? 'active' : ''}`}
          >
            <span className="profile-icon">{getProfileIcon(profile.type)}</span>
            <span className="profile-name">{profile.name}</span>
            <span className={`profile-type ${getProfileTypeClass(profile.type)}`}>
              {profile.type}
            </span>
            {project.status === 'running' && project.activeProfileId === profile.id ? (
              <button className="btn btn-danger btn-sm" onClick={() => onStopProject(project)}>
                ⏹ {t('startupProfiles.stop')}
              </button>
            ) : (
              <button
                className="btn btn-success btn-sm"
                onClick={() => onStartProfile(project, profile.id)}
                disabled={project.status === 'running'}
              >
                ▶ {t('startupProfiles.start')}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
