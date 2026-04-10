import type { LucideIcon } from 'lucide-react'



interface MetricCardProps {
  label: string
  value: string
  icon: LucideIcon
  helper: string
}

export function MetricCard({ label, value, icon: Icon, helper }: MetricCardProps) {
  return (
    <div className="rounded-2xl bg-surface-low p-6 transition-all hover:bg-surface-highest/50">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-on-surface-variant/50">{label}</span>
        <div className="rounded-full bg-surface-lowest p-2.5 text-primary shadow-sm">
          <Icon className="size-5" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="font-serif text-4xl tracking-tight text-primary leading-none">{value}</p>
        <p className="text-xs font-medium text-on-surface-variant/40 mt-2">{helper}</p>
      </div>
    </div>
  )
}
