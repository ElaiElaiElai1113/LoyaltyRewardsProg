import { Gift } from 'lucide-react'
import { Link } from 'react-router'

import { ActivityList } from '@/features/activity/components/activity-list'
import { CustomerOnboardingChecklist } from '@/features/dashboard/components/customer-onboarding-checklist'
import { CustomerWalletSummary } from '@/features/dashboard/components/customer-wallet-summary'
import { MembershipBanner } from '@/features/membership/components/membership-banner'
import { VerificationStatusNotice } from '@/features/membership/components/verification-status-notice'
import {
  useActivities,
  useRewardBalance,
} from '@/hooks/use-customer-data'
import { useAuth } from '@/hooks/use-auth'
import { useTenant } from '@/hooks/use-tenant'
import { useLanguage } from '@/lib/language'
import { LoyalityCustomerDashboard } from '@/features/loyality/pages/loyality-customer-dashboard'

export function DashboardPage() {
  const { program } = useTenant()
  if (program.slug === 'loyality') return <LoyalityCustomerDashboard />
  return <DefaultDashboardPage />
}

function DefaultDashboardPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const rewardBalance = useRewardBalance(profile?.id)
  const activities = useActivities(profile?.id)

  const points = rewardBalance.data?.points ?? 0
  const recentActivity = activities.data?.slice(0, 4) ?? []
  const firstName = profile?.fullName?.split(' ')[0] ?? t('Member')
  const verificationStatus = profile?.verificationStatus ?? 'not_submitted'

  return (
    <div className="space-y-10 pb-16">
      <MembershipBanner />
      <VerificationStatusNotice
        status={verificationStatus}
        rejectionReason={profile?.verificationRejectionReason}
      />
      <CustomerOnboardingChecklist
        verificationStatus={verificationStatus}
        points={points}
        recentActivity={recentActivity}
        isLoading={rewardBalance.isPending || activities.isPending}
      />

      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">
            {t('Welcome back,')} {firstName}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
            {t('Show your member QR at partner businesses, earn points from rewardable purchases, then use points for partner gift cards.')}
          </p>
        </div>

        <CustomerWalletSummary
          points={points}
        />

        <Link
          to="/gift-cards"
          className="flex min-h-24 items-center gap-4 rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm transition-colors hover:bg-[var(--muted)]"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--muted)] text-[var(--foreground)]">
            <Gift className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--foreground)]">{t('Buy gift cards')}</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
              {t('Use points to buy existing gift cards from partner businesses.')}
            </p>
          </div>
        </Link>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">{t('Activity')}</p>
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">{t('Recent Activity')}</h2>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white p-2 shadow-sm">
          <ActivityList items={recentActivity} emptyActionTo="/shop" emptyActionLabel="Browse businesses" />
        </div>
      </section>
    </div>
  )
}
