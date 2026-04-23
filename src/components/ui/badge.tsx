import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded px-3 py-1 text-xs font-bold uppercase tracking-[0.1em]',
  {
    variants: {
      variant: {
        default: 'border border-outline-variant bg-surface-highest/60 text-on-surface-variant',
        accent: 'border border-primary-container/45 bg-primary-container/15 text-primary-container text-[0.6rem] px-4 py-1.5',
        success: 'border border-success/40 bg-success/15 text-success',
        outline: 'border border-outline-variant/50 text-on-surface-variant',
        secondary: 'border border-secondary-container/45 bg-secondary-container/15 text-secondary-container',
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
