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
    <div className="luxe-card animate-card-stagger rounded-[1.5rem] p-6 text-card-foreground">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-[var(--muted-foreground)]">{title}</span>
        <div className="luxe-art rounded-[1rem] p-2.5">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="font-serif text-4xl font-semibold leading-none text-primary-container">{value}</p>
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
