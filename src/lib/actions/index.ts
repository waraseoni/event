import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function serverAction<T = unknown>(
  fn: () => Promise<T>,
  options?: { revalidatePaths?: string[] }
): Promise<ActionResult<T>> {
  try {
    const data = await fn()
    if (options?.revalidatePaths) {
      for (const p of options.revalidatePaths) revalidatePath(p)
    }
    return { success: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong'
    console.error('[serverAction]', message)
    return { success: false, error: message }
  }
}

export function zodServerAction<T extends z.ZodTypeAny>(schema: T) {
  return async (formData: FormData) => {
    const parsed = schema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return { success: false, error: 'Validation failed', data: null as T['_output'] | null }
    return { success: true as const, data: parsed.data as T['_output'] }
  }
}
