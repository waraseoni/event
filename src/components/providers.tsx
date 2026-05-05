'use client'

import { createBrowserClient } from '@supabase/ssr'
import { ReactNode } from 'react'
import { LanguageProvider } from '@/contexts/language-context'
import { SystemSettingsProvider } from '@/contexts/system-settings-context'

export function Providers({ children }: { children: ReactNode }) {
  // Initialize Supabase client on the browser
  if (typeof window !== 'undefined') {
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return (
    <LanguageProvider>
      <SystemSettingsProvider>
        {children}
      </SystemSettingsProvider>
    </LanguageProvider>
  )
}
