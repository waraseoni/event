'use client'

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <h2 className="text-2xl font-bold">Page not found</h2>
      <p className="text-muted-foreground mt-2">The page you are looking for does not exist.</p>
    </div>
  )
}

