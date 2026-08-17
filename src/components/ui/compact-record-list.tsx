import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export function CompactRecordList({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      role="list"
      className={cn(
        'min-w-0 divide-y divide-outline-variant/10 overflow-hidden rounded-2xl border border-[var(--border)] bg-card text-card-foreground shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

interface CompactRecordRowProps extends ComponentProps<'div'> {
  selected?: boolean
}

export function CompactRecordRow({ className, selected = false, ...props }: CompactRecordRowProps) {
  return (
    <div
      role="listitem"
      className={cn(
        'min-w-0 px-3 py-3 transition-colors sm:px-4',
        selected ? 'bg-primary-container/[0.08]' : 'hover:bg-surface-low',
        className,
      )}
      {...props}
    />
  )
}
