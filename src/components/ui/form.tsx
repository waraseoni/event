import { ReactNode } from 'react'
import { FormProvider, useForm, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ZodType } from 'zod'
import { cn } from '@/lib/utils'

export function Form({ schema, defaultValues, onSubmit, children, className }: { schema: ZodType<any>; defaultValues?: Record<string, any>; onSubmit: (data: any) => void | Promise<void>; children: ReactNode; className?: string }) {
  const methods = useForm({ resolver: zodResolver(schema as any), defaultValues, mode: 'onChange' })
  const { handleSubmit, formState: { isSubmitting } } = methods
  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-4', className)} noValidate>
        {children}
        {isSubmitting && <p className="text-sm text-muted-foreground">Saving...</p>}
      </form>
    </FormProvider>
  )
}

export function FormField<T extends string>({ name, label, children }: { name: string; label: string; children: React.ReactNode }) {
  const { register, formState: { errors } } = useFormContext()
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      {children}
      {errors[name] && <p className="text-xs text-destructive">{(errors[name] as { message?: string }).message}</p>}
    </div>
  )
}
