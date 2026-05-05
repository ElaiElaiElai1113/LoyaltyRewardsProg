import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-soft hover:-translate-y-0.5 hover:bg-[var(--primary-container)]',
        tenant: 'bg-tenant transition-opacity hover:opacity-90',
        secondary: 'border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-soft hover:-translate-y-0.5 hover:bg-[var(--muted)]',
        outline: 'border border-[var(--primary)]/20 bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--primary)]/45 hover:bg-[var(--muted)]',
        ghost: 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
        tertiary: 'border border-[var(--primary)]/20 bg-[var(--tenant-accent-soft)] text-[var(--foreground)] hover:border-[var(--primary)]/40 hover:bg-[var(--muted)]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 py-2 text-xs',
        lg: 'h-11 px-6 py-3',
        icon: 'size-10 p-0',
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
