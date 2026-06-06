import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, language: string = 'en'): string {
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date, language: string = 'en'): string {
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date, language: string = 'en'): string {
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function calculateDaysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

export function generateUniqueCode(prefix: string = ''): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}${timestamp}${random}`
}

export function getContactTypeLabel(type: string, t?: (key: string) => string): string {
  if (t) {
    const translated = t(`contacts.type.${type}`)
    if (translated !== `contacts.type.${type}`) {
      return translated
    }
  }
  // Fallback to English labels if no translation function provided
  const labels: Record<string, string> = {
    vendor: 'Vendor (rented from)',
    renter: 'Renter (rented to)',
    customer: 'Customer (for events)',
    worker: 'Worker',
  }
  return labels[type] || type
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    rented: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    retired: 'bg-gray-100 text-gray-800',
    planned: 'bg-gray-100 text-gray-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    reserved: 'bg-purple-100 text-purple-800',
    picked_up: 'bg-orange-100 text-orange-800',
    returned: 'bg-green-100 text-green-800',
    damaged: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}
