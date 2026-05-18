import { CheckCircle, Gift, Lock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'
import { formatPoints } from '@/lib/utils'
import type { GiftCardCatalogItem } from '@/types/domain'

interface GiftCardTileProps {
  item: GiftCardCatalogItem
  balancePoints?: number
  businessName?: string
  actionLocked?: boolean
  onSelect: (item: GiftCardCatalogItem) => void
}

export function GiftCardTile({ item, balancePoints = 0, businessName, actionLocked = false, onSelect }: GiftCardTileProps) {
  const { t } = useLanguage()
  const hasEnoughPoints = balancePoints >= item.pointsCost
  const canIssue = hasEnoughPoints && !actionLocked

  return (
    <div className="luxe-card group flex h-full flex-col gap-5 rounded-[1.75rem] p-4 text-card-foreground transition-all duration-300 hover:-translate-y-1 hover:border-primary/35">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge>{item.valueLabel}</Badge>
            {businessName ? <Badge variant="outline">{businessName}</Badge> : null}
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[1rem] bg-[var(--muted)] text-[var(--foreground)] shadow-soft">
            {canIssue ? <Gift className="size-5" /> : <Lock className="size-5" />}
          </div>
        </div>

        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="aspect-[16/9] w-full rounded-[1.35rem] object-cover shadow-soft" />
        ) : (
          <div className="luxe-art relative aspect-[16/9] overflow-hidden rounded-[1.35rem] p-5 shadow-soft">
            <div className="absolute left-5 top-5 h-16 w-24 rotate-[-8deg] rounded-xl border border-[var(--champagne)]/35 bg-[var(--cream)]/12" />
            <div className="absolute bottom-5 right-6 h-20 w-32 rotate-6 rounded-2xl border border-[var(--champagne)]/35 bg-[var(--cream)]/12" />
            <div className="animate-float-soft absolute right-8 top-8 flex size-14 items-center justify-center rounded-full bg-[var(--champagne)] text-[var(--espresso)] shadow-soft">
              <Gift className="size-7" />
            </div>
            <p className="absolute bottom-5 left-5 font-serif text-3xl text-[var(--cream)]">{item.valueLabel}</p>
          </div>
        )}

        <div className="grow space-y-3">
          <h3 className="text-xl font-semibold leading-tight text-[var(--foreground)]">
            {item.title}
          </h3>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">{item.description}</p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-medium text-[var(--muted-foreground)]">{t('Points Cost')}</span>
            <p className="text-2xl font-semibold text-[var(--foreground)]">
              {formatPoints(item.pointsCost)}
            </p>
            {!hasEnoughPoints ? (
              <p className="text-xs font-medium text-[var(--muted-foreground)]">
                {formatPoints(item.pointsCost - balancePoints)} {t('points needed')}
              </p>
            ) : actionLocked ? (
              <p className="text-xs font-medium text-[var(--muted-foreground)]">{t('ID verification required')}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant={canIssue ? 'secondary' : 'outline'}
            size="sm"
            disabled={!hasEnoughPoints}
            onClick={() => onSelect(item)}
          >
            {canIssue ? <CheckCircle className="size-4" /> : null}
            {actionLocked && hasEnoughPoints ? t('Verify ID') : t('Issue')}
          </Button>
        </div>
    </div>
  )
}
