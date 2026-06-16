import { History, QrCode, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ActivityList } from '@/features/activity/components/activity-list'
import { CustomerOnboardingChecklist } from '@/features/dashboard/components/customer-onboarding-checklist'
import { CustomerWalletSummary } from '@/features/dashboard/components/customer-wallet-summary'
import { useMyGiftCards } from '@/features/gift-cards/hooks/use-gift-cards'
import { MembershipBanner } from '@/features/membership/components/membership-banner'
import { VerificationStatusNotice } from '@/features/membership/components/verification-status-notice'
import {
  useActivities,
  useRewardBalance,
} from '@/hooks/use-customer-data'
import { useAuth } from '@/hooks/use-auth'
import { useMembership } from '@/hooks/use-membership'
import { useLanguage } from '@/lib/language'

export function DashboardPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const rewardBalance = useRewardBalance(profile?.id)
  const activities = useActivities(profile?.id)
  const giftCards = useMyGiftCards()
  const { isActive: isMembershipActive } = useMembership()

  const balance = rewardBalance.data
  const points = balance?.points ?? 0
  const recentActivity = activities.data?.slice(0, 4) ?? []
  const activeGiftCardCount = giftCards.data?.filter((card) => card.status === 'active').length ?? 0
  const firstName = profile?.fullName?.split(' ')[0] ?? t('Member')
  const verificationStatus = profile?.verificationStatus ?? 'not_submitted'

  const quickActions = [
    {
      title: t('Show member QR'),
      description: t('Partner staff scan your QR to record purchases and award points.'),
      icon: QrCode,
      to: '/profile',
    },
    {
      title: t('Verify ID'),
      description: t('Activate your member QR and reward earning access.'),
      icon: ShieldCheck,
      to: '/profile#id-verification',
    },
    {
      title: t('View history'),
      description: t('Review recent points and redemption activity.'),
      icon: History,
      to: '/activity',
    },
  ]

  return (
    <div className="space-y-10 pb-16">
      <MembershipBanner />
      <VerificationStatusNotice
        status={verificationStatus}
        rejectionReason={profile?.verificationRejectionReason}
      />
      <CustomerOnboardingChecklist
        verificationStatus={verificationStatus}
        isMembershipActive={isMembershipActive}
        points={points}
        recentActivity={recentActivity}
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

        <CustomerWalletSummary
          verificationStatus={verificationStatus}
          isMembershipActive={isMembershipActive}
          points={points}
          availableCredits={balance?.availableCredits ?? 0}
          activeGiftCardCount={activeGiftCardCount}
        />

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
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">{t('Activity')}</p>
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">{t('Recent Activity')}</h2>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white p-2 shadow-sm">
          <ActivityList items={recentActivity} emptyActionTo="/profile" emptyActionLabel="Show member QR" />
        </div>
      </section>
    </div>
  )
}
