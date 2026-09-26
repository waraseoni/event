'use client'

import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

const sheetVariants = cva(
  'fixed inset-y-0 right-0 h-full w-full border-l border-slate-200 bg-white p-6 shadow-xl transition-all duration-300 dark:border-slate-800 dark:bg-[#000000] sm:max-w-lg',
  {
    variants: { side: { right: '', left: 'left-0 right-auto border-r border-l-0', top: 'inset-x-0 top-0 h-auto max-h-[85vh] border-b', bottom: 'inset-x-0 bottom-0 h-auto max-h-[85vh] border-t' } },
    defaultVariants: { side: 'right' },
  }
)

export const Sheet = SheetPrimitive.Root
export const SheetTrigger = SheetPrimitive.Trigger
export const SheetPortal = SheetPrimitive.Portal
export const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay ref={ref} className={cn('fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', className)} {...props} />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & { side?: 'right' | 'left' | 'top' | 'bottom' }
>(({ className, side = 'right', children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

export const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex items-center justify-between border-b pb-4', className)} {...props} />
export const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex justify-end gap-2', className)} {...props} />

export const SheetClose = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Close>
>(({ className, children, ...props }, ref) => (
  <SheetPrimitive.Close ref={ref} className={cn('rounded-md p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800', className)} {...props}>
    {children ?? <X className="h-5 w-5" />}
  </SheetPrimitive.Close>
))
SheetClose.displayName = SheetPrimitive.Close.displayName
