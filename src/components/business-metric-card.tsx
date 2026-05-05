import type { ReactNode } from 'react'

interface BusinessMetricCardProps {
  title: string
  value: string
  icon: ReactNode
  helper?: string
  trend?: string
  trendUp?: boolean
}

export function BusinessMetricCard({ title, value, icon, helper, trend, trendUp }: BusinessMetricCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-[var(--muted-foreground)]">{title}</span>
        <div className="rounded-lg bg-[var(--muted)] p-2.5 text-[var(--foreground)]">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-4xl font-semibold leading-none text-[var(--foreground)]">{value}</p>
        {trend && (
          <p className={`text-xs font-medium ${trendUp ? 'text-success' : 'text-error'}`}>
            {trend}
          </p>
        )}
        {!trend && helper ? (
          <p className="mt-2 text-xs font-medium text-[var(--muted-foreground)]">{helper}</p>
        ) : null}
      </div>
    </div>
  )
}
