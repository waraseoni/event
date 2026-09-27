'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { SystemSettings } from '@/types'

interface SystemSettingsContextType {
  settings: SystemSettings | null
  loading: boolean
  error: string | null
  refreshSettings: () => Promise<void>
  updateSettings: (data: Partial<SystemSettings>) => Promise<void>
  uploadLogo: (file: File) => Promise<string | null>
  uploadBanner: (file: File) => Promise<string | null>
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(
  undefined
)

const DEFAULT_SETTINGS: Partial<SystemSettings> = {
  system_name: 'Events Management System',
  system_short_name: 'EMS',
  owner_name: 'System Owner',
  currency_symbol: '₹',
  date_format: 'DD/MM/YYYY',
  time_format: '12h',
  theme_color: 'indigo',
  accent_color: 'fuchsia',
}

// Supabase/PostgREST errors serialise to `{}` when logged directly, which hides
// the real cause. Flatten them so RLS denials are actually diagnosable.
type PostgrestLike = {
  message?: string
  code?: string
  details?: string
  hint?: string
  status?: number
}

function describeError(err: unknown): string {
  const e = (err ?? {}) as PostgrestLike
  const parts = [e.code ? `[${e.code}]` : null, e.status ? `HTTP ${e.status}` : null]
    .filter(Boolean)
    .join(' ')
  const detail = [e.message || 'Failed to load settings', e.details, e.hint]
    .filter(Boolean)
    .join(' | ')
  return parts ? `${parts} ${detail}` : detail
}

function logError(label: string, err: unknown) {
  const e = (err ?? {}) as PostgrestLike
  console.error(label, {
    code: e.code,
    status: e.status,
    message: e.message,
    details: e.details,
    hint: e.hint,
  })
}

export function SystemSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      // Settings are RLS-protected (owner/manager only). Querying before the
      // session exists just produces a guaranteed denial, so wait for auth and
      // stay quiet while logged out.
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setSettings(null)
        return
      }

      // maybeSingle() returns null on 0 rows instead of raising PGRST116.
      const { data, error: fetchError } = await supabase
        .from('system_settings')
        .select('*')
        .maybeSingle()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No settings row yet - seed one. A staff/manager account is not
          // allowed to INSERT, so fall back to defaults rather than breaking
          // the whole UI for a missing row.
          const { data: newData, error: createError } = await (supabase
            .from('system_settings')
            .insert as any)([DEFAULT_SETTINGS])
            .select()
            .maybeSingle()

          if (createError) {
            logError('Could not seed system settings:', createError)
            setError(describeError(createError))
            setSettings(null)
            return
          }
          setSettings(newData)
          return
        }
        throw fetchError
      }

      if (!data) {
        setSettings(null)
        return
      }
      setSettings(data)
    } catch (err: unknown) {
      logError('Error fetching system settings:', err)
      setError(describeError(err))
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (data: Partial<SystemSettings>) => {
    try {
      setError(null)

      if (!settings?.id) {
        // Create new settings
        const { data: newData, error: createError } = await (supabase
          .from('system_settings')
          .insert as any)([{ ...DEFAULT_SETTINGS, ...data }])
          .select()
          .single()

      if (createError) {
        logError('Error creating settings:', createError)
        throw createError
      }
      setSettings(newData)
      return
    }


      // Update existing settings
      const { data: updatedData, error: updateError } = await (supabase
        .from('system_settings')
        .update as any)(data)
        .eq('id', settings.id)
        .select()
        .single()

      if (updateError) {
        logError('Error updating settings:', updateError)
        throw updateError
      }
      setSettings(updatedData)
    } catch (err: unknown) {
      logError('Error updating settings:', err)
      setError(describeError(err))
      throw err
    }
  }

  const uploadFile = async (file: File, bucket: string, folder: string): Promise<string | null> => {
    try {
      // Check if bucket exists, create if not
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some(b => b.name === bucket)

      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 5242880, // 5MB limit
        })
        if (createError) {
          console.error('Error creating bucket:', createError)
          throw createError
        }
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      return publicUrl
    } catch (err: any) {
      console.error('Error uploading file:', err)
      throw err
    }
  }

  const uploadLogo = async (file: File): Promise<string | null> => {
    const url = await uploadFile(file, 'system-assets', 'logos')
    if (url) {
      await updateSettings({ logo_url: url })
    }
    return url
  }

  const uploadBanner = async (file: File): Promise<string | null> => {
    const url = await uploadFile(file, 'system-assets', 'banners')
    if (url) {
      await updateSettings({ banner_url: url })
    }
    return url
  }

  useEffect(() => {
    fetchSettings()

    // The provider is mounted above the auth boundary, so reload when the
    // session appears or disappears instead of only on first paint.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        fetchSettings()
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <SystemSettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        refreshSettings: fetchSettings,
        updateSettings,
        uploadLogo,
        uploadBanner,
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  )
}

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext)
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider')
  }
  return context
}

// Helper function to format currency
export function formatCurrency(amount: number, currencySymbol: string = '₹'): string {
  return `${currencySymbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Helper function to format date
export function formatDate(date: string | Date, format: string = 'DD/MM/YYYY'): string {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()

  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`
  }
}

// Helper function to get full address
export function getFullAddress(settings: SystemSettings | null): string {
  if (!settings) return ''
  
  const parts = [
    settings.office_address,
    settings.city,
    settings.state,
    settings.pincode,
  ].filter(Boolean)
  
  return parts.join(', ')
}

// Helper function to get contact info line
export function getContactLine(settings: SystemSettings | null): string {
  if (!settings) return ''
  
  const parts = [
    settings.contact_number,
    settings.email,
  ].filter(Boolean)
  
  return parts.join(' | ')
}
