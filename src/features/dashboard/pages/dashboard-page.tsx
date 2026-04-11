import { CupSoda, Gift, Ticket } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { MetricCard } from '@/components/metric-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActivityList } from '@/features/activity/components/activity-list'
import { PromotionCard } from '@/features/rewards/components/promotion-card'
import { RewardCard } from '@/features/rewards/components/reward-card'
import { useActivities, usePromotions, useRewardBalance, useRewards } from '@/hooks/use-customer-data'
import { useAuth } from '@/hooks/use-auth'
import { formatPoints } from '@/lib/utils'

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const rewardBalance = useRewardBalance(profile?.id)
  const rewards = useRewards()
  const promotions = usePromotions()
  const activities = useActivities(profile?.id)

  const balance = rewardBalance.data
  const featuredRewards = rewards.data?.filter((reward) => reward.featured).slice(0, 2) ?? []
  const activePromotions = promotions.data?.slice(0, 2) ?? []
  const recentActivity = activities.data?.slice(0, 4) ?? []

  return (
    <div className="space-y-16 pb-20">
      <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-6 max-w-2xl">
          <Badge variant="accent" className="bg-secondary-container/20 text-secondary">
            Dashboard
          </Badge>
          <h1 className="font-serif text-5xl tracking-tight text-primary md:text-7xl leading-[1.05]">
            Good to see you, <br />
            <span className="text-secondary">{profile?.fullName?.split(' ')[0] ?? 'Member'}.</span>
          </h1>
          <p className="text-lg leading-relaxed text-on-surface-variant/85 font-medium italic">
            Your balance, rewards, promotions, and recent activity — all in one place.
          </p>
        </div>

        <div className="flex-shrink-0">
          <Button asChild variant="default" size="lg" className="rounded-full h-16 px-10">
            <Link to="/rewards" className="flex items-center gap-3 text-lg">
              Explore Rewards
              <Gift className="size-6" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero Balance Section */}
      <section className="relative overflow-hidden rounded-3xl bg-primary-container p-10 md:p-16 text-white shadow-card">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
        <div className="relative z-10 grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-10">
            <div className="space-y-2">
              <span className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-white/80">Available Balance</span>
              <div className="flex items-baseline gap-4">
                <span className="font-serif text-7xl md:text-9xl tracking-tighter leading-none">
                  {formatPoints(balance?.points ?? 0)}
                </span>
                <span className="text-xl md:text-2xl font-medium text-white/80 italic">Points</span>
              </div>
            </div>

            <div className="space-y-4 max-w-md">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold uppercase tracking-widest text-white/85">Next Reward Progress</span>
                <span className="font-serif text-2xl">{balance?.tierProgress ?? 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 w-full overflow-hidden">
                <div
                  className="h-full bg-secondary-container transition-all duration-1000 ease-out"
                  style={{ width: `${balance?.tierProgress ?? 0}%` }}
                />
              </div>
              <p className="text-sm font-medium leading-relaxed text-white/80">
                Just {formatPoints(Math.max((balance?.nextRewardPoints ?? 0) - (balance?.points ?? 0), 0))} points away from your next reward.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            <MetricCard
              label="Drink Credits"
              value={`${balance?.availableCredits ?? 0}`}
              icon={CupSoda}
              helper="Credits ready to use"
            />
            <MetricCard
              label="Redeemable"
              value={`${rewards.data?.filter((reward) => (balance?.points ?? 0) >= reward.pointsCost).length ?? 0}`}
              icon={Ticket}
              helper="Rewards you can afford"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-20 lg:grid-cols-[1fr_400px]">
        {/* Featured Rewards */}
        <div className="space-y-10">
          <div className="flex items-end justify-between border-b border-outline-variant/10 pb-6">
            <div className="space-y-2">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Featured</span>
              <h2 className="font-serif text-4xl tracking-tight text-primary">Featured Rewards</h2>
            </div>
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/rewards">Full Catalog</Link>
            </Button>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {featuredRewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                balancePoints={balance?.points ?? 0}
                onRedeem={(selectedReward) => navigate(`/redeem/${selectedReward.id}`)}
              />
            ))}
          </div>
        </div>

        {/* Promotions Sidebar */}
        <div className="space-y-10">
          <div className="flex items-end justify-between border-b border-outline-variant/10 pb-6">
             <div className="space-y-2">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Limited Time</span>
              <h2 className="font-serif text-4xl tracking-tight text-primary">Promotions</h2>
            </div>
          </div>
          <div className="space-y-6">
            {activePromotions.map((promotion) => (
              <PromotionCard key={promotion.id} promotion={promotion} />
            ))}
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <section className="space-y-10 bg-surface-low -mx-6 px-6 py-20 rounded-[3rem]">
        <div className="mx-auto max-w-5xl space-y-10">
          <div className="flex items-end justify-between border-b border-outline-variant/10 pb-6">
            <div className="space-y-2">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Activity</span>
              <h2 className="font-serif text-4xl tracking-tight text-primary">Recent Activity</h2>
            </div>
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/activity">History</Link>
            </Button>
          </div>
          <div className="bg-surface-lowest rounded-3xl p-2 shadow-sm overflow-hidden border border-outline-variant/5">
            <ActivityList items={recentActivity} />
          </div>
        </div>
      </section>
    </div>
  )
}
