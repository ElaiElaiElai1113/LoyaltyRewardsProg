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
    <div className="compact-catalog-card group relative overflow-hidden p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <Badge
            variant="accent"
            className="border-[var(--champagne)]/70 bg-[var(--champagne)] text-[var(--espresso)] shadow-soft"
          >
            {t(promotion.badge)}
          </Badge>
          <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-[var(--champagne)]">
            <CalendarDays className="size-3" />
            {t('Expires')} {formatDate(promotion.expiresAt)}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-serif text-3xl tracking-tight text-primary leading-tight">
            {t(promotion.title)}
          </h3>
          <p className="text-sm leading-relaxed text-on-surface-variant/85 font-medium italic">
            "{t(promotion.description)}"
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-muted p-5 transition-colors group-hover:bg-blush/70">
          <div className="space-y-1">
            <p className="text-sm font-bold text-[var(--champagne)]">{t(promotion.cta)}</p>
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--cream)]/85">{t(promotion.audience)}</p>
          </div>
          <div className="flex size-8 items-center justify-center rounded-full bg-[var(--espresso)] text-[var(--champagne)] shadow-sm">
            <Sparkles className="size-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
