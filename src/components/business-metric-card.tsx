import type { ReactNode } from 'react'

import { Card } from '@/components/ui/card'

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
    <Card featured className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</span>
        <div className="rounded-lg bg-muted p-2.5 text-foreground">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="font-display text-4xl font-semibold leading-none text-foreground tabular-nums">{value}</p>
        {trend && (
          <p className={`text-xs font-medium ${trendUp ? 'text-success' : 'text-error'}`}>
            {trend}
          </p>
        )}
        {!trend && helper ? (
          <p className="mt-2 text-xs font-medium text-muted-foreground">{helper}</p>
        ) : null}
      </div>
    </Card>
  )
}
