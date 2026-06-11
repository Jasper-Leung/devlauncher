import React from 'react'
import { useTranslation } from 'react-i18next'
import { BatchProgress } from './Loading'
import './BatchActions.css'

interface BatchActionsProps {
  isBatchMode: boolean
  selectedCount: number
  filteredCount: number
  isAllSelected: boolean
  isProcessing?: boolean
  processingProgress?: {
    current: number
    total: number
    success: number
    failed: number
    currentItem?: string
  }
  onToggleBatchMode: () => void
  onToggleSelectAll: () => void
  onBatchStart: () => void
  onBatchStop: () => void
  onBatchDelete: () => void
}

const BatchActionsComponent: React.FC<BatchActionsProps> = ({
  isBatchMode,
  selectedCount,
  filteredCount,
  isAllSelected,
  isProcessing,
  processingProgress,
  onToggleBatchMode,
  onToggleSelectAll,
  onBatchStart,
  onBatchStop,
  onBatchDelete,
}) => {
  const { t } = useTranslation()
  const actualIsProcessing = isProcessing ?? false

  if (!isBatchMode) {
    return (
      <button
        className={`batch-mode-btn ${isBatchMode ? 'active' : ''}`}
        onClick={onToggleBatchMode}
      >
        ☑ {t('batchActions.title')}
      </button>
    )
  }

  const isDisabled = actualIsProcessing || selectedCount === 0

  return (
    <div className="batch-actions-container">
      <div className="batch-actions">
        <div className="batch-actions-header">
          <span className="batch-count">
            {actualIsProcessing
              ? t('sidebar.processingProgress')
              : t('sidebar.selectedCount', { selected: selectedCount, total: filteredCount })}
          </span>
          <button
            className="icon-btn"
            onClick={onToggleSelectAll}
            title={t('sidebar.selectAll')}
            disabled={actualIsProcessing}
          >
            {isAllSelected ? '☑️' : '☐'}
          </button>
        </div>

        {/* P2 优化：显示批量操作进度 */}
        {actualIsProcessing && processingProgress ? (
          <BatchProgress
            current={processingProgress.current}
            total={processingProgress.total}
            success={processingProgress.success}
            failed={processingProgress.failed}
            currentItem={processingProgress.currentItem}
          />
        ) : (
          <div className="batch-actions-buttons">
            <button className="btn btn-success btn-sm" onClick={onBatchStart} disabled={isDisabled}>
              ▶ {t('sidebar.batchStart')}
            </button>
            <button className="btn btn-danger btn-sm" onClick={onBatchStop} disabled={isDisabled}>
              ⏹ {t('sidebar.batchStop')}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onBatchDelete}
              disabled={isDisabled}
            >
              🗑️ {t('sidebar.batchDelete')}
            </button>
          </div>
        )}
      </div>
      <button
        className={`batch-mode-btn ${isBatchMode ? 'active' : ''}`}
        onClick={onToggleBatchMode}
        disabled={actualIsProcessing}
      >
        ✕ {t('sidebar.cancelBatchMode')}
      </button>
    </div>
  )
}

export const BatchActions = React.memo(BatchActionsComponent)
