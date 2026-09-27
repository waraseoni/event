'use client'

export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
    </div>
  )
}

