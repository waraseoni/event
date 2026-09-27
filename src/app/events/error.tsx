'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <h2 className="text-2xl font-bold text-destructive">Something went wrong!</h2>
      <p className="text-muted-foreground mt-2">{error.message}</p>
      <button onClick={() => reset()} className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">Try again</button>
    </div>
  )
}

