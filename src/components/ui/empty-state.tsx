import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type Props = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-card',
        className,
      )}
    >
      {icon ? (
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-3xl font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  )
}
