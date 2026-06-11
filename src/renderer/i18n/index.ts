/**
 * i18next 初始化配置
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhTranslation from './locales/zh/translation.json'
import enTranslation from './locales/en/translation.json'
import { DEFAULT_LANGUAGE } from './config'

// 初始化 i18next
i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zhTranslation },
    en: { translation: enTranslation },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false, // React 已经做了 XSS 防护
  },
  react: {
    useSuspense: false, // 禁用 Suspense 以避免额外的复杂性
  },
})

export default i18n
