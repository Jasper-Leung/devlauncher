/**
 * 分组管理模态框组件
 * P2 优化：从 App.tsx 拆分出来，负责管理项目分组
 */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProjectConfig } from '../../shared/types'
import { getGroupsFromProjects } from '../utils/projectHelpers.js'
import './GroupManagerModal.css'

interface GroupManagerModalProps {
  isOpen: boolean
  projects: ProjectConfig[]
  onClose: () => void
  onCreateGroup: (name: string) => void
  onDeleteGroup: (name: string) => void
}

/**
 * 分组管理模态框组件
 */
export const GroupManagerModal: React.FC<GroupManagerModalProps> = ({
  isOpen,
  projects,
  onClose,
  onCreateGroup,
  onDeleteGroup,
}) => {
  const { t } = useTranslation()
  const [newGroupName, setNewGroupName] = useState('')

  // 如果模态框未打开，不渲染任何内容
  if (!isOpen) {
    return null
  }

  const allGroups = getGroupsFromProjects(projects)

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName.trim())
      setNewGroupName('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateGroup()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{t('groupManager.title')}</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          {/* 创建新分组 */}
          <div className="form-group">
            <label className="form-label">{t('groupManager.createNew')}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder={t('groupManager.groupName')}
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className="btn btn-primary" onClick={handleCreateGroup}>
                {t('common.create')}
              </button>
            </div>
          </div>

          {/* 现有分组列表 */}
          {allGroups.length > 0 && (
            <div className="form-group">
              <label className="form-label">{t('groupManager.existingGroups')}</label>
              <div className="groups-list">
                {allGroups.map((group) => {
                  const groupProjects = projects.filter((p) => p.group === group)
                  return (
                    <div key={group} className="group-item">
                      <div className="group-item-info">
                        <span className="group-item-name">📂 {group}</span>
                        <span className="group-item-count">
                          {t('groupManager.projectCount', { count: groupProjects.length })}
                        </span>
                      </div>
                      <button
                        className="icon-btn danger"
                        onClick={() => onDeleteGroup(group)}
                        title={t('groupManager.deleteGroup')}
                      >
                        🗑️
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GroupManagerModal
