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
    <div className="group flex h-full flex-col gap-5 rounded-xl border border-[var(--border)] bg-card p-4 shadow-card transition-colors hover:bg-[var(--muted)]/40">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge>{item.valueLabel}</Badge>
            {businessName ? <Badge variant="outline">{businessName}</Badge> : null}
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--foreground)]">
            {hasEnoughPoints ? <Gift className="size-5" /> : <Lock className="size-5" />}
          </div>
        </div>

        {item.imageUrl ? <img src={item.imageUrl} alt="" className="aspect-[16/9] w-full rounded-lg object-cover" /> : null}

        <div className="grow space-y-3">
          <h3 className="text-xl font-semibold leading-tight text-[var(--foreground)]">
            {item.title}
          </h3>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">{item.description}</p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-medium text-[var(--muted-foreground)]">Points Cost</span>
            <p className="text-2xl font-semibold text-[var(--foreground)]">
              {formatPoints(item.pointsCost)}
            </p>
            {!hasEnoughPoints ? (
              <p className="text-xs font-medium text-[var(--muted-foreground)]">
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
  )
}
