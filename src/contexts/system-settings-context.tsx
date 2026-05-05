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

export function SystemSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('system_settings')
        .select('*')
        .single()

      if (fetchError) {
        // If no settings exist, create default
        if (fetchError.code === 'PGRST116') {
          const { data: newData, error: createError } = await supabase
            .from('system_settings')
            .insert([DEFAULT_SETTINGS])
            .select()
            .single()

          if (createError) throw createError
          setSettings(newData)
          return
        }
        throw fetchError
      }

      setSettings(data)
    } catch (err: any) {
      console.error('Error fetching system settings:', err)
      setError(err.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (data: Partial<SystemSettings>) => {
    try {
      setError(null)

      if (!settings?.id) {
        // Create new settings
        const { data: newData, error: createError } = await supabase
          .from('system_settings')
          .insert([{ ...DEFAULT_SETTINGS, ...data }])
          .select()
          .single()

        if (createError) throw createError
        setSettings(newData)
        return
      }

      // Update existing settings
      const { data: updatedData, error: updateError } = await supabase
        .from('system_settings')
        .update(data)
        .eq('id', settings.id)
        .select()
        .single()

      if (updateError) throw updateError
      setSettings(updatedData)
    } catch (err: any) {
      console.error('Error updating settings:', err)
      setError(err.message || 'Failed to update settings')
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
