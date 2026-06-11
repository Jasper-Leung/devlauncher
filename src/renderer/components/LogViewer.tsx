import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { colorizeLogLine, highlightLogText } from '../utils/logUtils.js'
import { createLogger } from '../utils/logger'
import './LogViewer.css'

const logger = createLogger('LogViewer')

interface LogViewerProps {
  logs: Record<string, string>
  projectId: string
  onClear: () => void
  isRunning?: boolean
}

export function LogViewer({ logs, projectId, onClear, isRunning = false }: LogViewerProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [commandInput, setCommandInput] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const logContentRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleCopy = async () => {
    const projectLogs = Object.entries(logs)
      .filter(([key]) => key.startsWith(projectId))
      .map(([, value]) => value)
      .join('\n')

    try {
      await navigator.clipboard.writeText(projectLogs)
      setCopyStatus('success')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch (error) {
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 2000)
      logger.error('Failed to copy logs', error)
    }
  }

  // 自动滚动到底部
  useEffect(() => {
    if (logContentRef.current) {
      logContentRef.current.scrollTop = logContentRef.current.scrollHeight
    }
  }, [logs, projectId])

  // 发送命令到 PTY 进程
  const handleSendCommand = () => {
    const command = commandInput.trim()
    if (!command) return

    // 发送命令到主进程
    window.electronAPI.sendCommandInput(projectId, command)

    // 添加到历史记录
    setCommandHistory((prev) => [...prev, command])
    setHistoryIndex(-1)
    setCommandInput('')
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSendCommand()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCommandInput(commandHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = Math.min(commandHistory.length - 1, historyIndex + 1)
        if (newIndex === commandHistory.length - 1 && historyIndex === newIndex) {
          setHistoryIndex(-1)
          setCommandInput('')
        } else {
          setHistoryIndex(newIndex)
          setCommandInput(commandHistory[newIndex])
        }
      }
    }
  }

  const projectLogEntries = Object.entries(logs).filter(([key]) => key.startsWith(projectId))

  if (projectLogEntries.length === 0) {
    return null
  }

  return (
    <div className="terminal-log">
      <div className="terminal-log-header">
        <span className="terminal-log-title">
          {t('logViewer.title')}
          {copyStatus === 'success' && (
            <span className="copy-status success">✓ {t('logViewer.copied')}</span>
          )}
          {copyStatus === 'error' && (
            <span className="copy-status error">✗ {t('logViewer.copyFailed')}</span>
          )}
        </span>
        <div className="terminal-log-actions">
          <button className="icon-btn" onClick={handleCopy} title={t('logViewer.copy')}>
            📋
          </button>
          <button className="icon-btn" onClick={onClear} title={t('logViewer.clear')}>
            🗑️
          </button>
        </div>
      </div>
      <div className="terminal-log-search">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder={t('logViewer.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="terminal-log-content" ref={logContentRef}>
        {projectLogEntries.map(([key, value]) => (
          <pre key={key}>
            {value.split('\n').map((line, lineIndex) => (
              <div key={`${key}-${lineIndex}`}>
                {highlightLogText(colorizeLogLine(line) as string, searchQuery)}
              </div>
            ))}
          </pre>
        ))}
      </div>
      {/* 命令输入区域 */}
      {isRunning && (
        <div className="terminal-input-area">
          <span className="terminal-prompt">$</span>
          <input
            ref={inputRef}
            type="text"
            className="terminal-input"
            placeholder={t('logViewer.inputPlaceholder') || '输入命令...'}
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isRunning}
          />
          <button
            className="terminal-send-btn"
            onClick={handleSendCommand}
            disabled={!commandInput.trim() || !isRunning}
            title={t('logViewer.send') || '发送命令'}
          >
            发送
          </button>
        </div>
      )}
    </div>
  )
}
