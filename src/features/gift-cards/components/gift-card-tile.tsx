import { CheckCircle, Gift, Lock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPoints } from '@/lib/utils'
import type { GiftCardCatalogItem } from '@/types/domain'

interface GiftCardTileProps {
  item: GiftCardCatalogItem
  balancePoints?: number
  businessName?: string
  onSelect: (item: GiftCardCatalogItem) => void
}

export function GiftCardTile({ item, balancePoints = 0, businessName, onSelect }: GiftCardTileProps) {
  const hasEnoughPoints = balancePoints >= item.pointsCost

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm group relative overflow-hidden p-1 transition-all duration-300 hover:-translate-y-1 hover:border-primary-container/45">
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(135deg,rgba(123,216,207,0.12),rgba(244,168,79,0.16),rgba(216,162,58,0.1))]" />
      <div className="relative flex h-full flex-col gap-6 rounded-md bg-[#17100d]/82 p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="accent">{item.valueLabel}</Badge>
            {businessName ? <Badge variant="outline">{businessName}</Badge> : null}
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded border border-primary-container/35 bg-primary-container/10 text-primary-container">
            {hasEnoughPoints ? <Gift className="size-6" /> : <Lock className="size-6" />}
          </div>
        </div>

        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="aspect-[16/9] w-full rounded object-cover" />
        ) : null}

        <div className="grow space-y-3">
          <h3 className="font-serif text-3xl font-semibold uppercase tracking-[0.01em] text-on-surface">
            {item.title}
          </h3>
          <p className="text-sm font-medium leading-relaxed text-on-surface-variant/85">{item.description}</p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Points Cost</span>
            <p className="font-serif text-3xl font-bold tracking-tight text-primary-container">
              {formatPoints(item.pointsCost)}
            </p>
            {!hasEnoughPoints ? (
              <p className="text-xs font-bold text-secondary">
                {formatPoints(item.pointsCost - balancePoints)} points needed
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant={hasEnoughPoints ? 'secondary' : 'outline'}
            size="sm"
            disabled={!hasEnoughPoints}
            onClick={() => onSelect(item)}
          >
            {hasEnoughPoints ? <CheckCircle className="size-4" /> : null}
            Issue
          </Button>
        </div>
      </div>
    </div>
  )
}
