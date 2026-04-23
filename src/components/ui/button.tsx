import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-bold uppercase tracking-[0.08em] transition-all disabled:pointer-events-none disabled:opacity-50 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary-container text-on-primary shadow-[0_0_20px_rgba(244,168,79,0.22)] hover:bg-primary-fixed hover:shadow-[0_0_30px_rgba(244,168,79,0.28)] active:scale-[0.98]',
        secondary: 'bg-secondary-container text-[#2d1a06] shadow-[0_0_18px_rgba(216,162,58,0.2)] hover:bg-secondary-fixed active:scale-[0.98]',
        outline: 'border border-primary-container/35 bg-[#17100d]/55 text-on-surface hover:border-primary-container/70 hover:bg-primary-container/10 hover:text-primary-container',
        ghost: 'text-on-surface-variant hover:bg-primary-container/10 hover:text-primary-container',
        tertiary: 'border border-tertiary/50 bg-tertiary/15 text-tertiary hover:bg-tertiary/25 active:scale-[0.98]',
      },
      size: {
        default: 'h-12 px-7 py-3',
        sm: 'h-10 px-5 py-2 text-xs',
        lg: 'h-14 px-9 py-4 text-sm',
        icon: 'size-11 p-0',
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
