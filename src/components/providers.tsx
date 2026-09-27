'use client'

import { ReactNode } from 'react'
import { LanguageProvider } from '@/contexts/language-context'
import { SystemSettingsProvider } from '@/contexts/system-settings-context'
import { CurrentUserProvider } from '@/contexts/user-context'
import { TanStackProvider } from '@/hooks/use-query'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <SystemSettingsProvider>
        <CurrentUserProvider>
          <TanStackProvider>
            {children}
          </TanStackProvider>
        </CurrentUserProvider>
      </SystemSettingsProvider>
    </LanguageProvider>
  )
}
