import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-safe Supabase client. Uses the public anon key and is subject to
 * Row Level Security. This is the only client that `'use client'` code should
 * ever use.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL is required. Add it to .env.local and restart the dev server.'
  )
}

if (!anonKey) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY is required. Add it to .env.local and restart the dev server.'
  )
}

export const supabaseBrowser = createBrowserClient(url, anonKey)
