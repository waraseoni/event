import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-indigo-500/30',
        destructive:
          'bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 shadow-rose-500/30',
        outline:
          'border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/50',
        secondary:
          'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 shadow-cyan-500/30',
        accent:
          'bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white hover:from-fuchsia-600 hover:to-pink-700 shadow-fuchsia-500/30',
        ghost: 'hover:bg-white/10 hover:text-white text-white/80',
        link: 'text-indigo-300 underline-offset-4 hover:underline hover:text-indigo-200',
        gradient:
          'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 shadow-fuchsia-500/30',
        success:
          'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/30',
        warning:
          'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-amber-500/30',
        glass:
          'bg-white/20 backdrop-blur-xl border border-white/30 text-white hover:bg-white/30 shadow-lg',
      },
      size: {
        default: 'h-11 px-6 py-3',
        sm: 'h-9 rounded-lg px-4 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        xl: 'h-14 rounded-xl px-10 text-lg',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
