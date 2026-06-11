import { t } from 'i18next'

export function formatLastLaunched(timestamp: number | undefined): string {
  if (!timestamp) return t('formatters.neverLaunched')

  const now = Date.now()
  const diff = now - timestamp

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return t('formatters.justNow')
  if (minutes < 60) return t('formatters.minutesAgo', { count: minutes })
  if (hours < 24) return t('formatters.hoursAgo', { count: hours })
  if (days < 7) return t('formatters.daysAgo', { count: days })

  const date = new Date(timestamp)
  return date.toLocaleDateString()
}

export function getProfileIcon(type: string): string {
  const iconMap: Record<string, string> = {
    frontend: '⚡',
    backend: '🔧',
    docker: '🐳',
  }
  return iconMap[type] || '📦'
}

export function getProfileTypeClass(type: string): string {
  return `profile-type-${type}`
}

export function formatProfileCount(count: number): string {
  return t('formatters.profileCount', { count })
}
