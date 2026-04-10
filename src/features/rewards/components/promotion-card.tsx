import { CalendarDays, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { Promotion } from '@/types/domain'

interface PromotionCardProps {
  promotion: Promotion
}

export function PromotionCard({ promotion }: PromotionCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] bg-surface-low hover:bg-surface-highest/40 transition-all duration-300 border border-transparent hover:border-outline-variant/10 shadow-ritual p-8">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <Badge variant="ritual" className="bg-secondary-container/30 text-secondary">
            {promotion.badge}
          </Badge>
          <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/40">
            <CalendarDays className="size-3" />
            Expires {formatDate(promotion.expiresAt)}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-serif text-3xl tracking-tight text-primary leading-tight">
            {promotion.title}
          </h3>
          <p className="text-sm leading-relaxed text-on-surface-variant/60 font-medium italic">
            "{promotion.description}"
          </p>
        </div>

        <div className="mt-4 rounded-xl bg-tertiary/20 p-5 flex items-center justify-between group-hover:bg-tertiary/30 transition-colors">
          <div className="space-y-1">
            <p className="text-sm font-bold text-primary">{promotion.cta}</p>
            <p className="text-[0.65rem] uppercase tracking-wider text-primary/60 font-medium">{promotion.audience}</p>
          </div>
          <div className="size-8 rounded-full bg-surface-lowest flex items-center justify-center text-primary shadow-sm">
            <Sparkles className="size-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
