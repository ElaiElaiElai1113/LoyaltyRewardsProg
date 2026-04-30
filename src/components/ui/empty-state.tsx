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
        'flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-16 text-center shadow-sm',
        className,
      )}
    >
      {icon ? (
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-[var(--muted)] text-on-surface-variant/55">
          {icon}
        </div>
      ) : null}
      <h3 className="font-serif text-2xl text-primary">{title}</h3>
      {description ? (
        <p className="mt-3 max-w-md text-sm leading-6 text-on-surface-variant/80">{description}</p>
      ) : null}
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  )
}
