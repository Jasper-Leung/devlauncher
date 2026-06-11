/**
 * 语言切换组件
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGE_CONFIG, type Language } from '../i18n/config'
import { useUIStore } from '../stores/uiStore'
import './LanguageSwitcher.css'

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation()
  const { language, setLanguage } = useUIStore()

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
  }

  const currentLang = language || (i18n.language as Language) || 'zh'

  return (
    <div className="language-switcher">
      <button
        className={`language-btn ${currentLang === 'zh' ? 'active' : ''}`}
        onClick={() => handleLanguageChange('zh')}
        title={LANGUAGE_CONFIG.zh.name}
      >
        <span className="language-flag">{LANGUAGE_CONFIG.zh.flag}</span>
        <span className="language-code">ZH</span>
      </button>
      <button
        className={`language-btn ${currentLang === 'en' ? 'active' : ''}`}
        onClick={() => handleLanguageChange('en')}
        title={LANGUAGE_CONFIG.en.name}
      >
        <span className="language-flag">{LANGUAGE_CONFIG.en.flag}</span>
        <span className="language-code">EN</span>
      </button>
    </div>
  )
}

export default LanguageSwitcher
