'use client'

import { useLanguage } from '@/contexts/language-context'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en')
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
      title={t('language.switch')}
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium">
        {language === 'en' ? 'हिंदी' : 'English'}
      </span>
    </Button>
  )
}
