import { Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPoints } from '@/lib/utils'
import type { Reward } from '@/types/domain'

interface RewardCardProps {
  reward: Reward
  balancePoints?: number
  onRedeem: (reward: Reward) => void
}

export function RewardCard({ reward, balancePoints = 0, onRedeem }: RewardCardProps) {
  const canRedeem = balancePoints >= reward.pointsCost && reward.inventory > 0

  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] bg-surface-low hover:bg-surface-highest/40 transition-all duration-300 border border-transparent hover:border-outline-variant/10 shadow-card p-8">
      <div className="flex flex-col gap-6 h-full">
        <div className="flex justify-between items-start">
          <Badge variant="accent" className="bg-tertiary/60">
            {reward.category}
          </Badge>
          {reward.featured && (
            <span className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-secondary">
              <Sparkles className="size-3" />
              Featured
            </span>
          )}
        </div>

        <div className="space-y-4 grow">
          <h3 className="font-serif text-3xl tracking-tight text-primary leading-tight">
            {reward.title}
          </h3>
          <p className="text-sm leading-relaxed text-on-surface-variant/85 font-medium">
            {reward.description}
          </p>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div className="space-y-1">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Cost</span>
            <p className="font-serif text-3xl tracking-tight text-primary">
              {formatPoints(reward.pointsCost)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/80">
              {reward.inventory} left
            </span>
            <Button
              onClick={() => onRedeem(reward)}
              disabled={!canRedeem}
              variant={canRedeem ? "secondary" : "outline"}
              size="sm"
              className="rounded-full"
            >
              {canRedeem ? 'Redeem now' : 'More points needed'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
