import type { LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'


interface MetricCardProps {
  label: string
  value: string
  icon: LucideIcon
  helper: string
}

export function MetricCard({ label, value, icon: Icon, helper }: MetricCardProps) {
  return (
    <Card featured className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        <div className="rounded-lg bg-muted p-2.5 text-foreground">
          <Icon className="size-5" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="font-display text-4xl font-semibold leading-none text-foreground tabular-nums">{value}</p>
        <p className="mt-2 text-xs font-medium text-muted-foreground">{helper}</p>
      </div>
    </Card>
  )
}
