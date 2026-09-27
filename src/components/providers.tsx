'use client'

import { ReactNode } from 'react'
import { LanguageProvider } from '@/contexts/language-context'
import { SystemSettingsProvider } from '@/contexts/system-settings-context'
import { CurrentUserProvider } from '@/contexts/user-context'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <SystemSettingsProvider>
        <CurrentUserProvider>
          {children}
        </CurrentUserProvider>
      </SystemSettingsProvider>
    </LanguageProvider>
  )
}
