import { Lock, Sparkles, Trophy, Zap } from 'lucide-react'

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
  const unlockProgress = requirePoints ? Math.min(100, Math.round((balancePoints / reward.pointsCost) * 100)) : 100
  const buttonLabel = !hasInventory ? 'Sold Out' : canRedeem ? 'Claim' : unlockProgress >= 80 ? 'Almost There' : 'Locked'
  const rarity =
    reward.pointsCost >= 2000
      ? 'Legendary'
      : reward.pointsCost >= 750
        ? 'Epic'
        : reward.pointsCost >= 250
          ? 'Rare'
          : 'Common'
  const rarityClass =
    rarity === 'Legendary'
      ? 'rarity-legendary'
      : rarity === 'Epic'
        ? 'rarity-epic'
        : rarity === 'Rare'
          ? 'rarity-rare'
          : 'rarity-common'

  return (
    <div className="group glass-panel relative overflow-hidden p-1 transition-all duration-300 hover:-translate-y-1 hover:border-primary-container/45 hover:shadow-[0_0_30px_rgba(244,168,79,0.15)]">
      <div className="hud-scanline" />
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(135deg,rgba(123,216,207,0.12),rgba(244,168,79,0.16),rgba(216,162,58,0.1))]" />
      <div className="relative flex h-full flex-col gap-6 rounded-md bg-[#17100d]/82 p-7">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Badge variant="accent">
              {t(reward.category)}
            </Badge>
            {businessName && (
              <Badge variant="outline" className="text-[0.55rem] text-on-surface-variant/70">
                {businessName}
              </Badge>
            )}
          </div>
            <span className={`flex items-center gap-1.5 rounded px-3 py-1 text-[0.6rem] font-black uppercase tracking-widest ${rarityClass}`}>
              <Sparkles className="size-3" />
              {t(rarity)}
            </span>
        </div>

        <div className="flex size-16 items-center justify-center rounded border border-primary-container/35 bg-primary-container/10 text-primary-container shadow-[0_0_18px_rgba(244,168,79,0.14)]">
          {canRedeem ? <Trophy className="size-8" /> : <Lock className="size-8" />}
        </div>

        <div className="space-y-4 grow">
          <h3 className="font-serif text-3xl font-semibold uppercase tracking-[0.01em] text-on-surface leading-tight">
            {t(reward.title)}
          </h3>
          <p className="text-sm leading-relaxed text-on-surface-variant/85 font-medium">
            {t(reward.description)}
          </p>
        </div>

        {requirePoints && (
          <div className="space-y-2">
            <div className="flex justify-between text-[0.65rem] font-black uppercase tracking-widest text-on-surface-variant/75">
              <span>{t('Unlock Meter')}</span>
              <span>{unlockProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden bg-primary-container/10">
              <div
                className="h-full bg-[linear-gradient(90deg,#7bd8cf,#f4a84f,#d8a23a)] transition-all duration-700 shadow-[0_0_12px_rgba(244,168,79,0.42)]"
                style={{ width: `${unlockProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-end justify-between mt-4">
          <div className="space-y-1">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">{t('XP Cost')}</span>
            <p className="font-serif text-3xl font-bold tracking-tight text-primary-container">
              {formatPoints(reward.pointsCost)}
            </p>
            {!canRedeem && hasInventory && requirePoints ? (
              <p className="text-xs font-bold text-secondary">{formatPoints(pointsRemaining)} {t('XP to unlock')}</p>
            ) : null}
          </div>

          <div className="flex flex-col items-end gap-3">
            <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/80">
              {reward.inventory} {t('left')}
            </span>
            <Button
              onClick={() => onRedeem(reward)}
              disabled={!canRedeem}
              variant={canRedeem ? 'secondary' : 'outline'}
              size="sm"
            >
              {canRedeem ? <Zap className="size-4" /> : null}
              {t(buttonLabel)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
