import type { LucideIcon } from 'lucide-react'



interface MetricCardProps {
  label: string
  value: string
  icon: LucideIcon
  helper: string
}

export function MetricCard({ label, value, icon: Icon, helper }: MetricCardProps) {
  return (
    <div className="quest-panel relative overflow-hidden p-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(244,168,79,0.28),0_0_26px_rgba(244,168,79,0.14)]">
      <div className="hud-scanline" />
      <div className="flex items-center justify-between mb-4">
        <span className="quest-kicker">{label}</span>
        <div className="rounded border border-primary-container/30 bg-primary-container/10 p-2.5 text-primary-container shadow-[0_0_14px_rgba(244,168,79,0.14)]">
          <Icon className="size-5" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="font-serif text-4xl font-bold tracking-tight text-primary-container leading-none">{value}</p>
        <p className="mt-2 text-xs font-medium text-on-surface-variant/75">{helper}</p>
      </div>
    </div>
  )
}
