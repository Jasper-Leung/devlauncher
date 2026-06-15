import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface ScannedProject {
  name: string
  path: string
  type: string
  depth: number
  exists?: boolean
}

interface ScanResult {
  projects: ScannedProject[]
  scanned: number
  errors: string[]
}

interface BatchImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: (added: number, skipped: number) => void
}

/**
 * 批量导入项目对话框组件
 */
export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const { t } = useTranslation()
  const [step, setStep] = useState<'select' | 'scanning' | 'review' | 'importing'>('select')
  const [scanPath, setScanPath] = useState('')
  const [maxDepth, setMaxDepth] = useState(3)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
  const [existingProjects, setExistingProjects] = useState<Set<string>>(new Set())
  const [isSelecting, setIsSelecting] = useState(false)
  const [importResult, setImportResult] = useState<{
    added: number
    skipped: number
    errors: string[]
  } | null>(null)

  // 加载已存在的项目路径
  useEffect(() => {
    const loadExistingProjects = async () => {
      const projects = await window.electronAPI.getProjects()
      setExistingProjects(new Set(projects.map((p) => p.path)))
    }
    loadExistingProjects()
  }, [])

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 重置表单状态
      setStep('select')
       
      setScanPath('')
       
      setMaxDepth(3)
       
      setScanResult(null)
       
      setSelectedProjects(new Set())
       
      setImportResult(null)
    }
  }, [isOpen])

  const handleSelectDirectory = async () => {
    setIsSelecting(true)
    try {
      const result = await window.electronAPI.selectScanDirectory()
      if (!result.canceled && result.path) {
        setScanPath(result.path)
      }
    } finally {
      setIsSelecting(false)
    }
  }

  const handleStartScan = async () => {
    if (!scanPath) {
      return
    }

    setStep('scanning')

    try {
      const result = await window.electronAPI.scanDirectory(scanPath, maxDepth)

      // 标记已存在的项目
      const projectsWithExists = result.projects.map((p) => ({
        ...p,
        exists: existingProjects.has(p.path),
      }))

      setScanResult({
        ...result,
        projects: projectsWithExists,
      })

      // 默认选中所有不存在的项目
      setSelectedProjects(new Set(projectsWithExists.filter((p) => !p.exists).map((p) => p.path)))

      setStep('review')
    } catch (error) {
      console.error('扫描失败:', error)
      setStep('select')
    }
  }

  const handleToggleProject = (projectPath: string) => {
    setSelectedProjects((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(projectPath)) {
        newSet.delete(projectPath)
      } else {
        newSet.add(projectPath)
      }
      return newSet
    })
  }

  const handleToggleAll = () => {
    const availableProjects = scanResult?.projects.filter((p) => !p.exists) || []
    if (selectedProjects.size === availableProjects.length) {
      setSelectedProjects(new Set())
    } else {
      setSelectedProjects(new Set(availableProjects.map((p) => p.path)))
    }
  }

  const handleFilterByType = (type: string) => {
    const projectsOfType = scanResult?.projects.filter((p) => p.type === type && !p.exists) || []
    const allSelected = projectsOfType.every((p) => selectedProjects.has(p.path))

    setSelectedProjects((prev) => {
      const newSet = new Set(prev)
      projectsOfType.forEach((p) => {
        if (allSelected) {
          newSet.delete(p.path)
        } else {
          newSet.add(p.path)
        }
      })
      return newSet
    })
  }

  const handleImport = async () => {
    if (selectedProjects.size === 0) {
      return
    }

    setStep('importing')

    const projectsToImport = scanResult!.projects
      .filter((p) => selectedProjects.has(p.path))
      .map((p) => ({
        name: p.name,
        path: p.path,
        type: p.type,
      }))

    try {
      const result = await window.electronAPI.batchAddProjects(projectsToImport)
      setImportResult(result)
      onImportComplete(result.added, result.skipped)
    } catch (error) {
      console.error('批量导入失败:', error)
      setImportResult({
        added: 0,
        skipped: 0,
        errors: [String(error)],
      })
    }
  }

  const handleClose = () => {
    onClose()
  }

  if (!isOpen) {
    return null
  }

  // 获取所有项目类型
  const projectTypes = Array.from(new Set(scanResult?.projects.map((p) => p.type) || [])).sort()

  // 统计信息
  const availableCount = scanResult?.projects.filter((p) => !p.exists).length || 0
  const existingCount = scanResult?.projects.filter((p) => p.exists).length || 0

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal batch-import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{t('batchImport.title')}</h3>
          <button className="modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* 步骤 1: 选择扫描目录 */}
          {step === 'select' && (
            <div className="scan-step">
              <div className="scan-step-description">
                <p>{t('batchImport.description')}</p>
              </div>

              <div className="form-group">
                <label className="form-label">{t('batchImport.scanPath')}</label>
                <div className="file-selector">
                  <input
                    type="text"
                    className="form-input"
                    value={scanPath}
                    onChange={(e) => setScanPath(e.target.value)}
                    placeholder={t('batchImport.selectScanPath')}
                  />
                  <button
                    type="button"
                    className="file-select-btn"
                    onClick={handleSelectDirectory}
                    disabled={isSelecting}
                  >
                    {isSelecting ? t('batchImport.selecting') : t('common.browse')}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('batchImport.scanDepth', { depth: maxDepth })}
                </label>
                <input
                  type="range"
                  className="depth-slider"
                  min="1"
                  max="10"
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                />
                <div className="depth-description">
                  <span className="depth-value">1</span>
                  <span className="depth-description-text">{t('batchImport.scanDepthHint')}</span>
                  <span className="depth-value">10</span>
                  <span className="depth-description-text">{t('batchImport.scanDepthDeep')}</span>
                </div>
              </div>

              <div className="scan-tips">
                <h4>{t('batchImport.scanTips')}</h4>
                <ul>
                  <li>{t('batchImport.scanTip1')}</li>
                  <li>{t('batchImport.scanTip2')}</li>
                  <li>{t('batchImport.scanTip3')}</li>
                </ul>
              </div>
            </div>
          )}

          {/* 步骤 2: 扫描中 */}
          {step === 'scanning' && (
            <div className="scan-step scanning">
              <div className="scanning-animation">
                <div className="spinner"></div>
                <p>{t('batchImport.scanning')}</p>
                <p className="scan-path">{scanPath}</p>
              </div>
            </div>
          )}

          {/* 步骤 3: 审查扫描结果 */}
          {step === 'review' && scanResult && (
            <div className="scan-step">
              <div className="scan-summary">
                <div className="scan-summary-item">
                  <span className="scan-summary-label">{t('batchImport.scanDirectory')}</span>
                  <span className="scan-summary-value">{scanPath}</span>
                </div>
                <div className="scan-summary-item">
                  <span className="scan-summary-label">{t('batchImport.directoriesScanned')}</span>
                  <span className="scan-summary-value">{scanResult.scanned}</span>
                </div>
                <div className="scan-summary-item">
                  <span className="scan-summary-label">{t('batchImport.projectsFound')}</span>
                  <span className="scan-summary-value">{scanResult.projects.length}</span>
                </div>
                <div className="scan-summary-item">
                  <span className="scan-summary-label">{t('batchImport.availableImport')}</span>
                  <span className="scan-summary-value success">{availableCount}</span>
                </div>
                <div className="scan-summary-item">
                  <span className="scan-summary-label">{t('batchImport.alreadyExists')}</span>
                  <span className="scan-summary-value muted">{existingCount}</span>
                </div>
              </div>

              {/* 按类型筛选 */}
              {projectTypes.length > 0 && (
                <div className="type-filters">
                  <span className="type-filters-label">{t('batchImport.filterByType')}</span>
                  {projectTypes.map((type) => (
                    <button
                      key={type}
                      className="type-filter-btn"
                      onClick={() => handleFilterByType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}

              {/* 项目列表 */}
              <div className="projects-list">
                <div className="projects-list-header">
                  <label className="select-all-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedProjects.size === availableCount && availableCount > 0}
                      onChange={handleToggleAll}
                    />
                    <span>
                      {t('batchImport.selectAll', {
                        selected: selectedProjects.size,
                        total: availableCount,
                      })}
                    </span>
                  </label>
                </div>

                <div className="projects-list-content">
                  {scanResult.projects.map((project) => (
                    <div
                      key={project.path}
                      className={`project-item ${project.exists ? 'exists' : ''} ${selectedProjects.has(project.path) ? 'selected' : ''}`}
                    >
                      <label className="project-item-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedProjects.has(project.path) || project.exists}
                          disabled={project.exists}
                          onChange={() => handleToggleProject(project.path)}
                        />
                        <div className="project-item-info">
                          <div className="project-item-name">
                            {project.name}
                            {project.exists && (
                              <span className="exists-badge">{t('batchImport.existsBadge')}</span>
                            )}
                          </div>
                          <div className="project-item-path">{project.path}</div>
                          <div className="project-item-meta">
                            <span className="project-type-badge">{project.type}</span>
                            <span className="project-depth">
                              {t('batchImport.depth', { depth: project.depth })}
                            </span>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {scanResult.errors.length > 0 && (
                <div className="scan-errors">
                  <h4>{t('batchImport.scanErrors', { count: scanResult.errors.length })}</h4>
                  <ul>
                    {scanResult.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {scanResult.errors.length > 5 && (
                      <li>
                        {t('batchImport.moreErrors', { count: scanResult.errors.length - 5 })}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 步骤 4: 导入完成 */}
          {step === 'importing' && importResult && (
            <div className="scan-step">
              <div className="import-result">
                <div className="import-result-icon">{importResult.added > 0 ? '✅' : '⚠️'}</div>
                <h3>{t('batchImport.importComplete')}</h3>

                <div className="import-stats">
                  <div className="import-stat-item success">
                    <span className="import-stat-value">{importResult.added}</span>
                    <span className="import-stat-label">{t('batchImport.importSuccess')}</span>
                  </div>
                  <div className="import-stat-item muted">
                    <span className="import-stat-value">{importResult.skipped}</span>
                    <span className="import-stat-label">{t('batchImport.importSkipped')}</span>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="import-errors">
                    <h4>{t('batchImport.importErrors', { count: importResult.errors.length })}</h4>
                    <ul>
                      {importResult.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button className="btn btn-primary" onClick={handleClose}>
                  {t('batchImport.done')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 'select' && (
            <>
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartScan}
                disabled={!scanPath || isSelecting}
              >
                {t('batchImport.startScan')}
              </button>
            </>
          )}

          {step === 'review' && (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setStep('select')}>
                {t('batchImport.back')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleImport}
                disabled={selectedProjects.size === 0}
              >
                {t('batchImport.importSelected', { count: selectedProjects.size })}
              </button>
            </>
          )}

          {step === 'scanning' && (
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              {t('batchImport.cancelScan')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default BatchImportModal
