import React from 'react'

export function highlightLogText(text: string, query: string): React.ReactNode {
  if (!query) return text

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="log-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

const LOG_PATTERNS: Array<{ pattern: RegExp; className: string }> = [
  { pattern: /\b(error|err|exception|fatal|failed)\b/gi, className: 'log-error' },
  { pattern: /\b(warn|warning|deprecated)\b/gi, className: 'log-warning' },
  { pattern: /\b(success|done|finished|completed)\b/gi, className: 'log-success' },
  { pattern: /\b(info|notice|log)\b/gi, className: 'log-info' },
  { pattern: /\b(\d{4}-\d{2}-\d{2}T?\s?\d{2}:\d{2}:\d{2})\b/g, className: 'log-timestamp' },
  { pattern: /\b(http|https|ftp):\/\/[^\s]+\b/gi, className: 'log-url' },
]

export function colorizeLogLine(line: string): React.ReactNode {
  let result: React.ReactNode = line
  let key = 0

  for (const { pattern, className } of LOG_PATTERNS) {
    if (typeof result !== 'string') {
      break
    }
    result = result.split(pattern).flatMap((part, i) =>
      pattern.test(part) ? (
        <span key={`${key}-${i}`} className={className}>
          {part}
        </span>
      ) : (
        part
      )
    )
    key++
  }

  return result
}

export async function copyLogsToClipboard(logs: Record<string, string>): Promise<boolean> {
  try {
    const allLogs = Object.entries(logs)
      .map(([id, content]) => `=== Project ${id} ===\n${content}`)
      .join('\n\n')

    await navigator.clipboard.writeText(allLogs)
    return true
  } catch {
    return false
  }
}
