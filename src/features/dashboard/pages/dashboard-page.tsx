import { Activity, Gift, History, ShoppingBag, Ticket } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { MetricCard } from '@/components/metric-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ActivityList } from '@/features/activity/components/activity-list'
import { useMyGiftCards } from '@/features/gift-cards/hooks/use-gift-cards'
import { MembershipBanner } from '@/features/membership/components/membership-banner'
import { PromotionCard } from '@/features/rewards/components/promotion-card'
import { RewardCard } from '@/features/rewards/components/reward-card'
import {
  useActivities,
  usePromotions,
  useRewardBalance,
  useRewards,
} from '@/hooks/use-customer-data'
import { useAuth } from '@/hooks/use-auth'
import { useMembership } from '@/hooks/use-membership'
import { useLanguage } from '@/lib/language'
import { formatCurrency, formatPoints } from '@/lib/utils'

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { t } = useLanguage()
  const rewardBalance = useRewardBalance(profile?.id)
  const rewards = useRewards()
  const promotions = usePromotions()
  const activities = useActivities(profile?.id)
  const giftCards = useMyGiftCards()
  const { membership, isActive: isMembershipActive } = useMembership()

  const balance = rewardBalance.data
  const points = balance?.points ?? 0
  const isFrozen = Boolean(membership) && !isMembershipActive
  const featuredRewards = rewards.data?.filter((reward) => reward.featured).slice(0, 2) ?? []
  const activePromotions = promotions.data?.slice(0, 2) ?? []
  const recentActivity = activities.data?.slice(0, 4) ?? []
  const activeGiftCardCount = giftCards.data?.filter((card) => card.status === 'active').length ?? 0
  const firstName = profile?.fullName?.split(' ')[0] ?? t('Member')

  const quickActions = [
    {
      title: t('Redeem rewards'),
      description: t('Use your points across participating businesses.'),
      icon: Gift,
      to: '/rewards',
    },
    {
      title: t('View history'),
      description: t('Review recent points and redemption activity.'),
      icon: History,
      to: '/activity',
    },
    {
      title: t('Browse businesses'),
      description: t('Shop products and offers from the network.'),
      icon: ShoppingBag,
      to: '/shop',
    },
  ]

  return (
    <div className="space-y-10 pb-16">
      <MembershipBanner />

      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] text-foreground">
            {t('Welcome back,')} {firstName}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {t('Track your balance, rewards, and recent activity across partner businesses.')}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <Card featured className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t('Total Points')}</p>
                <p className="font-display mt-3 text-5xl font-semibold tracking-[-0.02em] text-foreground tabular-nums">
                  {formatPoints(points)}
                </p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-[var(--accent-gold)]">
                <Ticket className="size-5" />
              </div>
            </div>
            <div data-tenant={featuredRewards[0]?.businessId} className="mt-5">
              <span className="inline-flex rounded-md bg-tenant-soft px-2.5 py-1 text-xs font-medium">
                {formatCurrency((balance?.availableCredits ?? 0) / 100)} {t('reward credits available')}
              </span>
              {isFrozen ? (
                <span className="ml-2 inline-flex rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {t('Frozen')}
                </span>
              ) : null}
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="cursor-pointer rounded-2xl border border-border bg-card p-5 shadow-card transition-colors duration-200 hover:bg-muted"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
                  <action.icon className="size-5" />
                </div>
                <h2 className="font-display mt-4 text-xl font-semibold text-foreground">{action.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label={t('Reward Credits')}
          value={formatCurrency((balance?.availableCredits ?? 0) / 100)}
          icon={Gift}
          helper={isFrozen ? t('Frozen') : t('Ready to use')}
        />
        <MetricCard
          label={t('Gift Cards')}
          value={`${activeGiftCardCount}`}
          icon={Ticket}
          helper={t('Active in wallet')}
        />
        <MetricCard
          label={t('Recent Activity')}
          value={`${recentActivity.length}`}
          icon={Activity}
          helper={t('Latest entries')}
        />
      </section>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-gold)]">{t('Featured')}</p>
              <h2 className="font-display text-3xl font-semibold text-foreground">{t('Featured Rewards')}</h2>
            </div>
            <Button asChild variant="ghost">
              <Link to="/rewards">{t('Full Catalog')}</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {featuredRewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                balancePoints={points}
                onRedeem={(selectedReward) => navigate(`/redeem/${selectedReward.id}`)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-gold)]">{t('Limited Time')}</p>
            <h2 className="font-display text-3xl font-semibold text-foreground">{t('Promotions')}</h2>
          </div>
          <div className="space-y-4">
            {activePromotions.map((promotion) => (
              <PromotionCard key={promotion.id} promotion={promotion} />
            ))}
          </div>
        </section>
      </div>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-gold)]">{t('Activity')}</p>
            <h2 className="font-display text-3xl font-semibold text-foreground">{t('Recent Activity')}</h2>
          </div>
          <Button asChild variant="ghost">
            <Link to="/activity">{t('History')}</Link>
          </Button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-card">
          <ActivityList items={recentActivity} />
        </div>
      </section>
    </div>
  )
}
