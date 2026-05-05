import type { LucideIcon } from 'lucide-react'



interface MetricCardProps {
  label: string
  value: string
  icon: LucideIcon
  helper: string
}

export function MetricCard({ label, value, icon: Icon, helper }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-[var(--muted-foreground)]">{label}</span>
        <div className="rounded-lg bg-[var(--muted)] p-2.5 text-[var(--foreground)]">
          <Icon className="size-5" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-4xl font-semibold leading-none text-[var(--foreground)]">{value}</p>
        <p className="mt-2 text-xs font-medium text-[var(--muted-foreground)]">{helper}</p>
      </div>
    </div>
  )
}
