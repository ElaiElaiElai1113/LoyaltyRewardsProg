import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.08em] uppercase',
  {
    variants: {
      variant: {
        default: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
        tenant: 'bg-tenant-soft text-[var(--primary-container)]',
        accent: 'bg-[var(--tenant-accent-soft)] text-[var(--primary-container)]',
        success: 'bg-green-50 text-[var(--success)]',
        outline: 'border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)]',
        secondary: 'bg-[var(--muted)] text-[var(--foreground)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge }
