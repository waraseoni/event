'use client'

import { useLanguage } from '@/contexts/language-context'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'
import { SUPPORTED_LANGUAGES, LANGUAGE_CODES } from '@/constants/languages'

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  const toggleLanguage = () => {
    const currentIndex = LANGUAGE_CODES.indexOf(language)
    const nextIndex = (currentIndex + 1) % LANGUAGE_CODES.length
    setLanguage(LANGUAGE_CODES[nextIndex])
  }

  const otherLanguage = LANGUAGE_CODES.find(code => code !== language)

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-500/10 transition-colors"
      title={t('language.switch')}
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">
        {otherLanguage ? SUPPORTED_LANGUAGES[otherLanguage].nativeName : language}
      </span>
    </button>
  )
}
