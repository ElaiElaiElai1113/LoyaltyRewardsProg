import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary-container text-on-primary shadow-card hover:brightness-110 active:scale-[0.98]',
        secondary: 'bg-secondary-container text-primary hover:brightness-110 active:scale-[0.98]',
        outline: 'border border-outline-variant/20 bg-transparent text-on-surface hover:bg-surface-low',
        ghost: 'text-on-surface hover:bg-surface-low hover:text-primary',
        tertiary: 'bg-tertiary text-primary hover:brightness-105 active:scale-[0.98]',
      },
      size: {
        default: 'h-12 px-8 py-3',
        sm: 'h-10 px-6 py-2 text-xs uppercase tracking-widest',
        lg: 'h-14 px-10 py-4 text-base',
        icon: 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
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
  },
)
Button.displayName = 'Button'

export { Button }
