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
    <div className="quest-panel relative overflow-hidden p-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(244,168,79,0.28),0_0_26px_rgba(244,168,79,0.14)]">
      <div className="hud-scanline" />
      <div className="flex items-center justify-between mb-4">
        <span className="quest-kicker">{title}</span>
        <div className="rounded border border-primary-container/30 bg-primary-container/10 p-2.5 text-primary-container shadow-[0_0_14px_rgba(244,168,79,0.14)]">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="font-serif text-4xl font-bold tracking-tight text-primary-container leading-none">{value}</p>
        {trend && (
          <p className={`text-xs font-medium ${trendUp ? 'text-success' : 'text-error'}`}>
            {trend}
          </p>
        )}
        {!trend && helper ? (
          <p className="mt-2 text-xs font-medium text-on-surface-variant/75">{helper}</p>
        ) : null}
      </div>
    </div>
  )
}
