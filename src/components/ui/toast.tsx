'use client'

import { toast } from 'sonner'
import { Toaster } from 'sonner'

export function useToast() {
  return {
    success: (msg: string) => toast.success(msg),
    error: (msg: string) => toast.error(msg),
    info: (msg: string) => toast.info(msg),
    loading: (msg: string) => toast.loading(msg),
  }
}

export function ToasterComponent() {
  return <Toaster position="top-right" richColors />
}
