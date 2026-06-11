/**
 * 国际化配置
 */

/**
 * 支持的语言类型
 */
export type Language = 'zh' | 'en'

/**
 * 语言配置映射
 */
export const LANGUAGE_CONFIG: Record<Language, { name: string; flag: string }> = {
  zh: { name: '简体中文', flag: '🇨🇳' },
  en: { name: 'English', flag: '🇺🇸' },
}

/**
 * 默认语言
 */
export const DEFAULT_LANGUAGE: Language = 'zh'

/**
 * LocalStorage 存储键
 */
export const LANGUAGE_STORAGE_KEY = 'language'
