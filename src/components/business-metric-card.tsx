interface BusinessMetricCardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
}

export function BusinessMetricCard({ title, value, icon, trend, trendUp }: BusinessMetricCardProps) {
  return (
    <div className="rounded-3xl bg-white border border-outline-variant/5 shadow-sm p-6 transition-all hover:shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-on-surface-variant/80">{title}</span>
        <div className="rounded-full bg-surface-low p-2.5 text-primary shadow-sm">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="font-serif text-4xl tracking-tight text-primary leading-none">{value}</p>
        {trend && (
          <p className={`text-xs font-medium ${trendUp ? 'text-success' : 'text-error'}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  )
}
