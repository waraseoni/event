'use client'

import { ReactNode } from 'react'
import { LanguageProvider } from '@/contexts/language-context'
import { SystemSettingsProvider } from '@/contexts/system-settings-context'
import { supabaseBrowser } from '@/lib/supabase/browser'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <SystemSettingsProvider>
        {children}
      </SystemSettingsProvider>
    </LanguageProvider>
  )
}
