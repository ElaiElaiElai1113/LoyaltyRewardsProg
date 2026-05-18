import { CalendarDays, Sparkles } from 'lucide-react'

import { useLanguage } from '@/lib/language'
import { formatDate } from '@/lib/utils'
import type { Promotion } from '@/types/domain'

interface PromotionCardProps {
  promotion: Promotion
  businessName?: string
}

export function PromotionCard({ promotion, businessName }: PromotionCardProps) {
  const { t } = useLanguage()

  return (
    <div className="compact-catalog-card group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-card">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {businessName ? (
              <span className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-neutral-700">
                {businessName}
              </span>
            ) : null}
            <span className="inline-flex items-center rounded-full bg-black px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-sm">
              {t(promotion.badge)}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-neutral-700">
            <CalendarDays className="size-3" />
            {t('Expires')} {formatDate(promotion.expiresAt)}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-serif text-3xl leading-tight tracking-tight text-black">
            {t(promotion.title)}
          </h3>
          <p className="text-sm font-medium leading-relaxed text-neutral-600">
            "{t(promotion.description)}"
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-neutral-100 p-5 transition-colors group-hover:bg-neutral-200">
          <div className="space-y-1">
            <p className="text-sm font-bold text-black">{t(promotion.cta)}</p>
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-neutral-600">{t(promotion.audience)}</p>
          </div>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-sm">
            <Sparkles className="size-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
