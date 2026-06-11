import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import type { ProjectConfig, StartupProfile } from '../../shared/types'
import { v4 as uuidv4 } from 'uuid'
import { ProjectImageRenderer } from './ProjectImageRenderer'

interface AddProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (project: Omit<ProjectConfig, 'id' | 'status'>) => Promise<void>
  editProject?: ProjectConfig
  onEdit?: (id: string, updates: Partial<ProjectConfig>) => Promise<void>
}

interface CustomCommand {
  name: string
  command: string
  type?: 'claude' | 'build' | 'test'
}

/**
 * 添加/编辑项目对话框组件
 */
export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  editProject,
  onEdit,
}) => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [path, setPath] = useState('')
  const [description, setDescription] = useState('')
  const [ideCommand, setIdeCommand] = useState('code .')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [customCommands, setCustomCommands] = useState<CustomCommand[]>([])
  const [startupProfiles, setStartupProfiles] = useState<StartupProfile[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [group, setGroup] = useState<string>('')
  const [allGroups, setAllGroups] = useState<string[]>([])
  const [readmeContent, setReadmeContent] = useState<string>('')
  const [readmeFileName, setReadmeFileName] = useState<string>('')
  const [showReadme, setShowReadme] = useState(true)

  const isEditing = !!editProject

  // 加载所有分组
  useEffect(() => {
    const loadGroups = async () => {
      const projects = await window.electronAPI.getProjects()
      const groups = new Set<string>()
      projects.forEach((p) => {
        if (p.group) {
          groups.add(p.group)
        }
      })
      setAllGroups(Array.from(groups).sort())
    }
    loadGroups()
  }, [])

  useEffect(() => {
    if (editProject) {
      setName(editProject.name)
      setPath(editProject.path)
      setDescription(editProject.description || '')
      setIdeCommand(editProject.ideCommand || 'code .')
      setTags(editProject.tags || [])
      setCustomCommands(editProject.customCommands || [])
      setStartupProfiles(editProject.startupProfiles || [])
      setGroup(editProject.group || '')

      // 加载 README
      const loadReadme = async () => {
        try {
          const result = await window.electronAPI.readReadme(editProject.path)
          if (result.success) {
            setReadmeContent(result.content)
            setReadmeFileName(result.fileName)
          } else {
            setReadmeContent('')
            setReadmeFileName('')
          }
        } catch (error) {
          console.error('加载 README 失败:', error)
          setReadmeContent('')
          setReadmeFileName('')
        }
      }
      loadReadme()
    }
  }, [editProject])

  useEffect(() => {
    if (!isOpen) {
      // 重置表单
      setName('')
      setPath('')
      setDescription('')
      setIdeCommand('code .')
      setTags([])
      setTagInput('')
      setCustomCommands([])
      setStartupProfiles([])
      setGroup('')
      setErrors({})
      setReadmeContent('')
      setReadmeFileName('')
      setShowReadme(true)
    }
  }, [isOpen])

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 加载 README 文件
  useEffect(() => {
    const loadReadme = async () => {
      if (path) {
        try {
          const result = await window.electronAPI.readReadme(path)
          if (result.success) {
            setReadmeContent(result.content)
            setReadmeFileName(result.fileName)
          } else {
            setReadmeContent('')
            setReadmeFileName('')
          }
        } catch (error) {
          console.error('加载 README 失败:', error)
          setReadmeContent('')
          setReadmeFileName('')
        }
      } else {
        setReadmeContent('')
        setReadmeFileName('')
      }
    }

    loadReadme()
  }, [path])

  const handleSelectDirectory = async () => {
    const selectedPath = await window.electronAPI.selectDirectory()
    if (selectedPath) {
      setPath(selectedPath)

      // 自动检测项目信息
      const [detectedProject, projectName] = await Promise.all([
        window.electronAPI.detectProject(selectedPath),
        window.electronAPI.extractProjectName(selectedPath),
      ])

      // 设置项目名称
      if (!name) {
        setName(projectName)
      }

      // 设置检测到的信息
      if (detectedProject) {
        if (!description && detectedProject.description) {
          setDescription(detectedProject.description)
        }
        if (detectedProject.ideCommand) {
          setIdeCommand(detectedProject.ideCommand)
        }
        // 如果没有启动配置，添加默认配置
        if (startupProfiles.length === 0) {
          const defaultProfile: StartupProfile = {
            id: uuidv4(),
            name: '默认启动',
            type: 'frontend',
            command: detectedProject.startCommand,
            isDefault: true,
          }
          setStartupProfiles([defaultProfile])
        }
        // 如果没有标签，根据语言生成标签
        if (tags.length === 0 && detectedProject.language !== 'Unknown') {
          const languageTags = getTagsForLanguage(detectedProject.language)
          setTags(languageTags)
        }
      }

      setErrors({ ...errors, path: '' })
    }
  }

  // 根据语言生成标签
  const getTagsForLanguage = (language: string): string[] => {
    const tagMap: Record<string, string[]> = {
      'Node.js/JavaScript': ['JavaScript', 'Node.js'],
      TypeScript: ['TypeScript', 'Node.js'],
      Python: ['Python'],
      Go: ['Go'],
      Rust: ['Rust'],
      Java: ['Java'],
      Ruby: ['Ruby'],
      PHP: ['PHP'],
      Dart: ['Flutter', 'Dart'],
      Elixir: ['Elixir'],
      Crystal: ['Crystal'],
    }
    return tagMap[language] || [language]
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  // 添加启动配置
  const handleAddStartupProfile = () => {
    const newProfile: StartupProfile = {
      id: uuidv4(),
      name: `配置 ${startupProfiles.length + 1}`,
      type: 'frontend',
      command: 'npm run dev',
      isDefault: startupProfiles.length === 0,
    }
    setStartupProfiles([...startupProfiles, newProfile])
  }

  // 删除启动配置
  const handleRemoveStartupProfile = (profileId: string) => {
    const updated = startupProfiles.filter((p) => p.id !== profileId)
    // 如果删除的是默认配置，将第一个设为默认
    if (updated.length > 0 && !updated.some((p) => p.isDefault)) {
      updated[0].isDefault = true
    }
    setStartupProfiles(updated)
  }

  // 更新启动配置
  const handleUpdateStartupProfile = (
    profileId: string,
    field: keyof StartupProfile,
    value: StartupProfile[keyof StartupProfile]
  ) => {
    // 如果设置 isDefault 为 true，需要将其他配置设为 false
    if (field === 'isDefault' && value === true) {
      const updated = startupProfiles.map((p) => ({
        ...p,
        isDefault: p.id === profileId,
      }))
      setStartupProfiles(updated)
    }

    const updated = startupProfiles.map((p) => {
      if (p.id === profileId) {
        return { ...p, [field]: value }
      }
      return p
    })
    setStartupProfiles(updated)
  }

  const handleAddCustomCommand = () => {
    setCustomCommands([...customCommands, { name: '', command: '', type: 'claude' }])
  }

  const handleRemoveCustomCommand = (index: number) => {
    setCustomCommands(customCommands.filter((_, i) => i !== index))
  }

  const handleCustomCommandChange = (index: number, field: keyof CustomCommand, value: string) => {
    const newCommands = [...customCommands]
    newCommands[index] = { ...newCommands[index], [field]: value }
    setCustomCommands(newCommands)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = t('project.validation.nameRequired')
    }
    if (!path.trim()) {
      newErrors.path = t('project.validation.pathRequired')
    }
    if (startupProfiles.length === 0) {
      newErrors.profiles = t('project.validation.profilesRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    try {
      const projectData: Omit<ProjectConfig, 'id' | 'status'> = {
        name: name.trim(),
        path: path.trim(),
        description: description.trim(),
        ideCommand: ideCommand.trim(),
        tags,
        startupProfiles,
        customCommands: customCommands.filter((c) => c.name && c.command),
        group: group.trim() || undefined,
      }

      console.log(
        'handleSubmit - isEditing:',
        isEditing,
        'onEdit:',
        !!onEdit,
        'editProject:',
        !!editProject
      )

      if (isEditing && onEdit && editProject) {
        console.log('执行编辑操作', { id: editProject.id, projectData })
        await onEdit(editProject.id, projectData)
      } else {
        console.log('执行添加操作')
        await onAdd(projectData)
      }
      onClose()
    } catch (error) {
      console.error('保存项目失败:', error)
      setErrors({ ...errors, submit: t('project.validation.saveFailed') })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{isEditing ? t('project.edit') : t('project.add')}</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className="modal-body"
            style={{
              maxHeight: '60vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* 项目名称 */}
            <div className="form-group">
              <label className="form-label">{t('project.name')} *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('project.enterProjectName')}
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            {/* 项目路径 */}
            <div className="form-group">
              <label className="form-label">{t('project.path')} *</label>
              <div className="file-selector">
                <input
                  type="text"
                  className="form-input"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder={t('project.selectDirectory')}
                  readOnly
                />
                <button type="button" className="file-select-btn" onClick={handleSelectDirectory}>
                  {t('project.selectPath')}
                </button>
              </div>
              {errors.path && <div className="form-error">{errors.path}</div>}
            </div>

            {/* 项目描述 */}
            <div className="form-group">
              <label className="form-label">{t('project.description')}</label>
              <textarea
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('project.enterDescription')}
              />
            </div>

            {/* IDE 命令 */}
            <div className="form-group">
              <label className="form-label">{t('project.ideCommand')}</label>
              <input
                type="text"
                className="form-input"
                value={ideCommand}
                onChange={(e) => setIdeCommand(e.target.value)}
                placeholder={t('project.enterIdeCommand')}
              />
            </div>

            {/* 标签 */}
            <div className="form-group">
              <label className="form-label">{t('project.tags')}</label>
              <div className="tags-input">
                {tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                    <button
                      type="button"
                      className="tag-remove"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder={t('project.enterTag')}
                />
              </div>
            </div>

            {/* 分组 */}
            <div className="form-group">
              <label className="form-label">{t('project.group')}</label>
              <select
                className="form-select"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
              >
                <option value="">{t('project.noGroup')}</option>
                {allGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
                <option value="__new__">{t('project.createNewGroup')}</option>
              </select>
              {group === '__new__' && (
                <input
                  type="text"
                  className="form-input"
                  style={{ marginTop: '8px' }}
                  placeholder={t('project.newGroupName')}
                  onChange={(e) => setGroup(e.target.value)}
                />
              )}
            </div>

            {/* 启动配置 */}
            <div className="form-group">
              <label className="form-label">{t('project.startupProfiles')} * </label>
              {errors.profiles && <div className="form-error">{errors.profiles}</div>}
              <div className="startup-profiles-form">
                {startupProfiles.map((profile, index) => (
                  <div key={profile.id} className="startup-profile-form-item">
                    <div className="startup-profile-form-header">
                      <span>
                        {t('project.profileName')} {index + 1}
                      </span>
                      {startupProfiles.length > 1 && (
                        <button
                          type="button"
                          className="command-remove"
                          onClick={() => handleRemoveStartupProfile(profile.id)}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.name}
                        onChange={(e) =>
                          handleUpdateStartupProfile(profile.id, 'name', e.target.value)
                        }
                        placeholder={t('project.profileName')}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        className="form-select"
                        style={{ width: '100px' }}
                        value={profile.type}
                        onChange={(e) =>
                          handleUpdateStartupProfile(profile.id, 'type', e.target.value)
                        }
                      >
                        <option value="frontend">{t('project.frontend')}</option>
                        <option value="backend">{t('project.backend')}</option>
                        <option value="internal">{t('project.internal') || '应用内终端'}</option>
                        <option value="external">{t('project.external') || '系统终端'}</option>
                        <option value="docker">{t('project.docker')}</option>
                      </select>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.command}
                        onChange={(e) =>
                          handleUpdateStartupProfile(profile.id, 'command', e.target.value)
                        }
                        placeholder={t('project.startCommand')}
                        style={{ flex: 1 }}
                      />
                    </div>
                    {profile.type === 'docker' && (
                      <input
                        type="text"
                        className="form-input"
                        value={profile.dockerContainer || ''}
                        onChange={(e) =>
                          handleUpdateStartupProfile(profile.id, 'dockerContainer', e.target.value)
                        }
                        placeholder={t('project.dockerContainer')}
                        style={{ marginTop: '8px' }}
                      />
                    )}
                    {/* 工作目录字段 */}
                    <div style={{ marginTop: '8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.cwd || ''}
                        onChange={(e) =>
                          handleUpdateStartupProfile(profile.id, 'cwd', e.target.value)
                        }
                        placeholder={t('project.workingDirectory')}
                      />
                      <small
                        style={{
                          color: '#888',
                          fontSize: '11px',
                          display: 'block',
                          marginTop: '4px',
                        }}
                      >
                        {t('project.workingDirectoryHint')}
                      </small>
                    </div>
                    {/* 多命令提示 */}
                    <div style={{ marginTop: '8px' }}>
                      <small style={{ color: '#888', fontSize: '11px', display: 'block' }}>
                        {t('project.multiCommandHint')}
                      </small>
                    </div>
                    {startupProfiles.length > 1 && (
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginTop: '8px',
                          fontSize: '13px',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={profile.isDefault}
                          onChange={(e) =>
                            handleUpdateStartupProfile(profile.id, 'isDefault', e.target.checked)
                          }
                        />
                        {t('project.setDefaultConfig')}
                      </label>
                    )}
                  </div>
                ))}
                <button type="button" className="add-command-btn" onClick={handleAddStartupProfile}>
                  + {t('project.addStartupProfile')}
                </button>
              </div>
            </div>

            {/* 自定义命令 */}
            <div className="form-group">
              <label className="form-label">{t('project.customCommands')}</label>
              <div className="command-list">
                {customCommands.map((cmd, index) => (
                  <div key={index} className="command-item">
                    <input
                      type="text"
                      className="form-input"
                      value={cmd.name}
                      onChange={(e) => handleCustomCommandChange(index, 'name', e.target.value)}
                      placeholder={t('project.commandName')}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={cmd.command}
                      onChange={(e) => handleCustomCommandChange(index, 'command', e.target.value)}
                      placeholder={t('project.commandContent')}
                    />
                    <button
                      type="button"
                      className="command-remove"
                      onClick={() => handleRemoveCustomCommand(index)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button type="button" className="add-command-btn" onClick={handleAddCustomCommand}>
                  + {t('project.addCommand')}
                </button>
              </div>
            </div>

            {/* README 预览 */}
            {readmeContent && (
              <div
                className="readme-preview"
                style={{
                  maxHeight: '300px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div className="readme-preview-header">
                  <span>📄 {readmeFileName}</span>
                  <button
                    type="button"
                    className="readme-preview-toggle"
                    onClick={() => setShowReadme(!showReadme)}
                  >
                    {showReadme ? t('common.collapse') : t('common.expand')}
                  </button>
                </div>
                <div
                  className={`readme-preview-content ${showReadme ? '' : 'collapsed'}`}
                  style={{ maxHeight: showReadme ? '250px' : '0', overflowY: 'auto' }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    components={{
img: ProjectImageRenderer,
                    }}
                  >
                    {readmeContent}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {errors.submit && <div className="form-error">{errors.submit}</div>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : isEditing ? t('common.save') : t('common.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddProjectModal
