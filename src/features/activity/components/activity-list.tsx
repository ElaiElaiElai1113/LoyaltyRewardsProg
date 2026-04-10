import { CircleDollarSign, Gift, ShieldCheck, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { formatDate, formatPoints, formatTime } from '@/lib/utils'
import type { Activity } from '@/types/domain'

interface ActivityListProps {
  items: Activity[]
}

function getIcon(type: Activity['type']) {
  switch (type) {
    case 'earned':
      return CircleDollarSign
    case 'bonus':
      return Sparkles
    case 'adjustment':
      return ShieldCheck
    default:
      return Gift
  }
}

export function ActivityList({ items }: ActivityListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const Icon = getIcon(item.type)

        return (
          <div key={item.id} className="group relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between bg-surface-low rounded-2xl transition-all hover:bg-surface-highest/40">
            <div className="flex items-center gap-6">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface-lowest text-primary shadow-sm group-hover:shadow-md transition-all">
                <Icon className="size-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-serif text-xl tracking-tight text-primary leading-tight">{item.title}</h3>
                  <Badge variant={item.points >= 0 ? 'success' : 'default'} className="rounded-full">
                    {item.points >= 0 ? `+${formatPoints(item.points)}` : formatPoints(item.points)}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-on-surface-variant/50">{item.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between md:flex-col md:items-end gap-1">
              <div className="flex flex-col md:items-end">
                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/30">Occasion</span>
                <p className="text-sm font-semibold text-on-surface-variant/70">{formatDate(item.createdAt)}</p>
              </div>
              <p className="hidden md:block text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/20 italic">{formatTime(item.createdAt)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
