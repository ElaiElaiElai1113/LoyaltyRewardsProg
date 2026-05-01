import { CalendarDays, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/language'
import { formatDate } from '@/lib/utils'
import type { Promotion } from '@/types/domain'

interface PromotionCardProps {
  promotion: Promotion
}

export function PromotionCard({ promotion }: PromotionCardProps) {
  const { t } = useLanguage()

  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] bg-surface-low hover:bg-surface-highest/40 transition-colors duration-300 border border-transparent hover:border-outline-variant/10 shadow-card p-8">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <Badge variant="accent" className="bg-secondary-container/30 text-secondary">
            {t(promotion.badge)}
          </Badge>
          <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/80">
            <CalendarDays className="size-3" />
            {t('Expires')} {formatDate(promotion.expiresAt)}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-display text-3xl tracking-tight text-primary leading-tight">
            {t(promotion.title)}
          </h3>
          <p className="text-sm leading-relaxed text-on-surface-variant/85 font-medium italic">
            "{t(promotion.description)}"
          </p>
        </div>

        <div className="mt-4 rounded-xl bg-tertiary/20 p-5 flex items-center justify-between group-hover:bg-tertiary/30 transition-colors">
          <div className="space-y-1">
            <p className="text-sm font-bold text-primary">{t(promotion.cta)}</p>
            <p className="text-[0.65rem] uppercase tracking-wider text-primary/80 font-medium">{t(promotion.audience)}</p>
          </div>
          <div className="size-8 rounded-full bg-surface-lowest flex items-center justify-center text-primary shadow-card">
            <Sparkles className="size-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
