import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-[0.04em]',
  {
    variants: {
      variant: {
        default: 'bg-surface-highest text-on-surface-variant',
        accent: 'bg-tertiary text-primary uppercase tracking-[0.1em] font-bold text-[0.6rem] px-4 py-1.5',
        success: 'bg-tertiary text-primary',
        outline: 'border border-outline-variant/30 text-on-surface-variant',
        secondary: 'bg-secondary-container text-primary',
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
