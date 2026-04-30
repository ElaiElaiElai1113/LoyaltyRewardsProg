import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Gift } from 'lucide-react'
import { BusinessFilter } from '@/components/business-filter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
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
import { useLanguage } from '@/lib/language'
import type { Reward } from '@/types/domain'

import { RedeemRewardPanel } from '../components/redeem-reward-panel'
import { RewardCard } from '../components/reward-card'

const filters = ['All', 'Drink', 'Pastry', 'Merch', 'Experience'] as const

export function RewardsPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { t } = useLanguage()
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
      <div className="flex flex-col gap-8 border-b border-[var(--border)] pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4 max-w-2xl">
          <Badge>
            {t('Rewards Catalog')}
          </Badge>
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">
            {t('Rewards Marketplace')}
          </h1>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">
            {t('Use points for perks, reward credits, and offers from participating businesses.')}
          </p>
        </div>

        {profile && (
          <div className="flex flex-col items-start gap-4 lg:items-end">
            <span className="text-sm font-medium text-[var(--muted-foreground)]">{t('Your Points')}</span>
            <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-white px-6 py-4 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--muted)]">
                <Gift className="size-5 text-[var(--foreground)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-semibold leading-none text-[var(--foreground)]">{balancePoints}</span>
                <span className="text-xs font-medium text-[var(--muted-foreground)]">{t('Available Points')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="sticky top-20 z-40 -mx-5 space-y-3 border-y border-[var(--border)] bg-[var(--background)] px-5 py-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
        {(businesses.data ?? []).length > 1 && (
          <BusinessFilter
            businesses={businesses.data ?? []}
            selected={selectedBusiness}
            onChange={setSelectedBusiness}
          />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <span className="mr-2 text-sm font-medium text-[var(--muted-foreground)]">{t('Item Type:')}</span>
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? 'tertiary' : 'ghost'}
              size="sm"
              className={`rounded-full transition-all ${
                activeFilter === filter
                  ? 'px-8'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {t(filter)}
            </Button>
          ))}
        </div>
      </div>

      {rewards.isLoading ? (
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="mt-8 h-9 w-3/4" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-2/3" />
              <Skeleton className="mt-8 h-11 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : filteredRewards.length === 0 ? (
        <EmptyState
          icon={<Gift className="size-8" />}
          title={t('No rewards yet')}
          description={t('Rewards from participating businesses will appear here when they are available.')}
        />
      ) : (
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
      )}

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
            <DialogTitle>{t('Redeem reward')}</DialogTitle>
            <DialogDescription>
              {t('Confirm the reward details, choose a pickup window, and submit.')}
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
