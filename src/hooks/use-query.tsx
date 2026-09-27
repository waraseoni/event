'use client'

import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'

export function TanStackProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false, retry: 1 },
      mutations: { onError: (err: unknown) => console.error('[mutation]', err) },
    },
  }))
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export function useTanStackQuery<T>(key: string[], fetcher: () => Promise<T>, options?: { enabled?: boolean }) {
  const { data, error, isLoading, refetch } = useQuery<T>({
    queryKey: key,
    queryFn: fetcher,
    enabled: options?.enabled !== false,
  })
  return { data, error, isLoading, refetch }
}

export { useMutation }
export type { QueryFunctionContext, QueryKey } from '@tanstack/react-query'
