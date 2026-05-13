import { Activity, Gift, History, ShoppingBag, Ticket } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { MetricCard } from '@/components/metric-card'
import { Button } from '@/components/ui/button'
import { ActivityList } from '@/features/activity/components/activity-list'
import { useMyGiftCards } from '@/features/gift-cards/hooks/use-gift-cards'
import { MembershipBanner } from '@/features/membership/components/membership-banner'
import { VerificationStatusNotice } from '@/features/membership/components/verification-status-notice'
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
  const verificationStatus = profile?.verificationStatus ?? 'not_submitted'
  const rewardActionsLocked = verificationStatus !== 'verified'

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
      <VerificationStatusNotice
        status={verificationStatus}
        rejectionReason={profile?.verificationRejectionReason}
      />

      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">
            {t('Welcome back,')} {firstName}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
            {t('Track your balance, rewards, and recent activity across partner businesses.')}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--muted-foreground)]">{t('Total Points')}</p>
                <p className="mt-3 text-4xl font-semibold tracking-normal text-[var(--foreground)]">
                  {formatPoints(points)}
                </p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--foreground)]">
                <Ticket className="size-5" />
              </div>
            </div>
            <div data-tenant={featuredRewards[0]?.businessId} className="mt-5">
              <span className="inline-flex rounded-md bg-tenant-soft px-2.5 py-1 text-xs font-medium">
                {formatCurrency((balance?.availableCredits ?? 0) / 100)} {t('reward credits available')}
              </span>
              {isFrozen ? (
                <span className="ml-2 inline-flex rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--muted-foreground)]">
                  {t('Frozen')}
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm transition-colors hover:bg-[var(--muted)]"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--foreground)]">
                  <action.icon className="size-5" />
                </div>
                <h2 className="mt-4 text-base font-semibold text-[var(--foreground)]">{action.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{action.description}</p>
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
              <p className="text-sm font-medium text-[var(--muted-foreground)]">{t('Featured')}</p>
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">{t('Featured Rewards')}</h2>
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
                actionLocked={rewardActionsLocked}
                onRedeem={(selectedReward) => {
                  if (rewardActionsLocked) {
                    navigate('/profile')
                    return
                  }
                  navigate(`/redeem/${selectedReward.id}`)
                }}
              />
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">{t('Limited Time')}</p>
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">{t('Promotions')}</h2>
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
            <p className="text-sm font-medium text-[var(--muted-foreground)]">{t('Activity')}</p>
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">{t('Recent Activity')}</h2>
          </div>
          <Button asChild variant="ghost">
            <Link to="/activity">{t('History')}</Link>
          </Button>
        </div>
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white p-2 shadow-sm">
          <ActivityList items={recentActivity} />
        </div>
      </section>
    </div>
  )
}
