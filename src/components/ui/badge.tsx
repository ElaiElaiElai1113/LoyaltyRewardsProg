import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground',
        tenant: 'bg-tenant-soft',
        accent: 'bg-[var(--accent-gold-soft)] text-primary',
        success: 'bg-muted text-success',
        outline: 'border border-border bg-card text-muted-foreground',
        secondary: 'bg-muted text-foreground',
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
