import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Gift } from 'lucide-react'
import { BusinessFilter } from '@/components/business-filter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { useLoginGate } from '@/hooks/use-login-gate'
import { useBusinesses, useRedeemReward, useRewardBalance, useRewards } from '@/hooks/use-customer-data'
import type { Reward } from '@/types/domain'

import { RedeemRewardPanel } from '../components/redeem-reward-panel'
import { RewardCard } from '../components/reward-card'

const filters = ['All', 'Drink', 'Pastry', 'Merch', 'Experience'] as const

export function RewardsPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const requireAuth = useLoginGate()
  const rewardBalance = useRewardBalance(profile?.id)
  const businesses = useBusinesses()
  const redeemReward = useRedeemReward(profile?.id)

  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>('All')
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)

  const rewards = useRewards(selectedBusiness ?? undefined)
  const balancePoints = rewardBalance.data?.points ?? 0
  const filteredRewards = (rewards.data ?? []).filter((reward) =>
    activeFilter === 'All' ? true : reward.category === activeFilter,
  )

  const getBusinessName = (businessId: string) =>
    businesses.data?.find((b) => b.id === businessId)?.name ?? ''

  const handleRedeem = (reward: Reward) => {
    requireAuth(() => setSelectedReward(reward))
  }

  return (
    <div className="space-y-16 pb-20">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between border-b border-outline-variant/10 pb-12">
        <div className="space-y-4 max-w-2xl">
          <Badge variant="accent" className="bg-tertiary/20 text-primary">
            Rewards Catalog
          </Badge>
          <h1 className="font-serif text-5xl tracking-tight text-primary md:text-7xl leading-[1.1]">
            Rewards
          </h1>
          <p className="text-lg leading-relaxed text-on-surface-variant/85 font-medium">
            Browse rewards and redeem them with your points. From drinks to seasonal merch, everything is earned.
          </p>
        </div>

        {profile && (
          <div className="flex flex-col items-start gap-4 lg:items-end">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Your Points</span>
            <div className="flex items-center gap-4 rounded-2xl bg-primary-container px-6 py-4 text-white shadow-card">
              <div className="flex size-10 items-center justify-center rounded-full bg-white/10">
                <Gift className="size-5 text-secondary-container" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl leading-none">{balancePoints}</span>
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white/80">Available Points</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="sticky top-24 z-40 -mx-6 bg-surface/80 px-6 py-4 backdrop-blur-md space-y-3">
        {(businesses.data ?? []).length > 1 && (
          <BusinessFilter
            businesses={businesses.data ?? []}
            selected={selectedBusiness}
            onChange={setSelectedBusiness}
          />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <span className="mr-2 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/80">Category:</span>
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? 'tertiary' : 'ghost'}
              size="sm"
              className={`rounded-full transition-all ${
                activeFilter === filter
                  ? 'px-8 shadow-sm'
                  : 'text-on-surface-variant/85 hover:text-primary'
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {filteredRewards.map((reward) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            balancePoints={balancePoints}
            businessName={getBusinessName(reward.businessId)}
            requirePoints={Boolean(profile)}
            onRedeem={handleRedeem}
          />
        ))}
      </div>

      <Dialog
        open={Boolean(selectedReward)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReward(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem reward</DialogTitle>
            <DialogDescription>
              Confirm the reward details, choose a pickup window, and submit.
            </DialogDescription>
          </DialogHeader>

          {selectedReward ? (
            <RedeemRewardPanel
              reward={selectedReward}
              balancePoints={balancePoints}
              isSubmitting={redeemReward.isPending}
              onSubmit={async (values) => {
                await redeemReward.mutateAsync({
                  rewardId: selectedReward.id,
                  ...values,
                })
                setSelectedReward(null)
                navigate('/activity')
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
