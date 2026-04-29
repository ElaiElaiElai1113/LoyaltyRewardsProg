import { CheckCircle, Gift, Lock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'
import { formatPoints } from '@/lib/utils'
import type { Reward } from '@/types/domain'

interface RewardCardProps {
  reward: Reward
  balancePoints?: number
  businessName?: string
  requirePoints?: boolean
  onRedeem: (reward: Reward) => void
}

export function RewardCard({
  reward,
  balancePoints = 0,
  businessName,
  requirePoints = true,
  onRedeem,
}: RewardCardProps) {
  const { t } = useLanguage()
  const hasInventory = reward.inventory > 0
  const hasEnoughPoints = balancePoints >= reward.pointsCost
  const canRedeem = hasInventory && (!requirePoints || hasEnoughPoints)
  const pointsRemaining = Math.max(reward.pointsCost - balancePoints, 0)
  const buttonLabel = !hasInventory ? 'Sold Out' : canRedeem ? 'Redeem' : 'Need More Points'

  return (
    <div
      data-tenant={reward.businessId}
      className="flex h-full flex-col gap-5 rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm"
    >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Badge variant="tenant">
              {t(reward.category)}
            </Badge>
            {businessName && (
              <Badge variant="outline" className="text-[0.7rem] text-[var(--muted-foreground)]">
                {businessName}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex size-11 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--foreground)]">
          {canRedeem ? <Gift className="size-5" /> : <Lock className="size-5" />}
        </div>

        <div className="grow space-y-3">
          <h3 className="text-xl font-semibold leading-tight text-[var(--foreground)]">
            {t(reward.title)}
          </h3>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            {t(reward.description)}
          </p>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">{t('Points Cost')}</span>
            <p className="text-2xl font-semibold text-[var(--tenant-accent)]">
              {formatPoints(reward.pointsCost)}
            </p>
            {!canRedeem && hasInventory && requirePoints ? (
              <p className="text-xs font-medium text-[var(--muted-foreground)]">{formatPoints(pointsRemaining)} {t('points needed')}</p>
            ) : null}
          </div>

          <div className="flex flex-col items-end gap-3">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {reward.inventory} {t('left')}
            </span>
            <Button
              onClick={() => onRedeem(reward)}
              disabled={!canRedeem}
              variant={canRedeem ? 'tenant' : 'outline'}
              size="sm"
            >
              {canRedeem ? <CheckCircle className="size-4" /> : null}
              {t(buttonLabel)}
            </Button>
          </div>
        </div>
    </div>
  )
}
