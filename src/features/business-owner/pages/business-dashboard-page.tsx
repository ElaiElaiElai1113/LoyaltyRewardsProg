import {
  ArrowUpRight,
  CheckCircle,
  Copy,
  Gift,
  Package,
  QrCode,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { BusinessMetricCard } from '@/components/business-metric-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useApproveReferral,
  useBusinessOwnerData,
  usePendingReferrals,
  useRejectReferral,
  useValidateCreditCode,
} from '@/hooks/use-business-owner-data'
import { useAuth } from '@/hooks/use-auth'
import { useFulfillRedemption } from '@/hooks/use-admin-data'
import { useLanguage } from '@/lib/language'
import { formatCurrency, formatDate, formatPoints } from '@/lib/utils'

export function BusinessDashboardPage() {
  const { business, metrics, products, rewards, promotions, redemptions } = useBusinessOwnerData()
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [redemptionCode, setRedemptionCode] = useState('')
  const [copiedSignupUrl, setCopiedSignupUrl] = useState(false)
  const fulfillRedemption = useFulfillRedemption(profile)
  const pendingReferrals = usePendingReferrals(business?.id)
  const approveReferral = useApproveReferral(business?.id)
  const rejectReferral = useRejectReferral(business?.id)
  const validateCreditCode = useValidateCreditCode(business?.id)

  if (!metrics) {
    return <div className="text-center py-20 text-on-surface-variant/60">Loading...</div>
  }

  const businessColors = { primary: 'from-[#7a4a1f] to-[#d8a23a]', light: 'from-primary-container/18 to-secondary-container/14' }
  const signupQrUrl =
    profile?.referralCode && business?.id && typeof window !== 'undefined'
      ? `${window.location.origin}/promo?ref=${profile.referralCode}&business=${business.id}`
      : ''

  return (
    <div className="space-y-16">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#18215a,#283593_50%,#c026d3)] px-8 py-12 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:36px_36px] opacity-25"></div>
        <div className="relative">
          <p className="quest-kicker-light mb-3">Mission Control</p>
          <h1 className="font-serif text-4xl tracking-tight text-white md:text-6xl leading-[1.1]">
            {business?.name} Command Center
          </h1>
          <p className="mt-4 text-lg text-white/80 font-medium">
            Track members, quests, reward credits, and reward fulfillment from one arcade operations hub.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <BusinessMetricCard
          title="Members Recruited"
          value={metrics.totalMembers.toString()}
          icon={<Users className="size-6" />}
          trend="+12%"
          trendUp
        />
        <BusinessMetricCard
          title="Orders Completed"
          value={metrics.totalOrders.toString()}
          icon={<ShoppingBag className="size-6" />}
          trend="+8%"
          trendUp
        />
        <BusinessMetricCard
          title="Realm Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          icon={<TrendingUp className="size-6" />}
          trend="+15%"
          trendUp
        />
        <BusinessMetricCard
          title="Active Quests"
          value={metrics.activePromotions.toString()}
          icon={<Sparkles className="size-6" />}
        />
      </div>

      {/* XP Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="quest-panel p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="font-serif text-2xl text-primary">XP Issued</h3>
              <p className="text-sm text-on-surface-variant/70">Total XP awarded to customers</p>
            </div>
            <div className="size-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <TrendingUp className="size-6" />
            </div>
          </div>
          <p className="font-serif text-5xl tracking-tight text-primary">{formatPoints(metrics.pointsIssued)}</p>
        </div>

        <div className="quest-panel p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="font-serif text-2xl text-primary">XP Redeemed</h3>
              <p className="text-sm text-on-surface-variant/70">Total XP spent on rewards</p>
            </div>
            <div className="size-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <Gift className="size-6" />
            </div>
          </div>
          <p className="font-serif text-5xl tracking-tight text-primary">{formatPoints(metrics.pointsRedeemed)}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-serif text-2xl text-primary mb-6">Command Shortcuts</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/business/products"
            className={`group rounded-3xl bg-gradient-to-br ${businessColors.light} hover:${businessColors.primary} p-6 border border-outline-variant/10 hover:border-transparent transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary group-hover:text-white">Products</p>
                <p className="font-serif text-3xl text-primary group-hover:text-white">{products.length}</p>
              </div>
              <Package className="size-8 text-primary/70 group-hover:text-white/70" />
            </div>
          </Link>

          <Link
            to="/business/rewards"
            className={`group rounded-3xl bg-gradient-to-br ${businessColors.light} hover:${businessColors.primary} p-6 border border-outline-variant/10 hover:border-transparent transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary group-hover:text-white">Rewards</p>
                <p className="font-serif text-3xl text-primary group-hover:text-white">{rewards.length}</p>
              </div>
              <Gift className="size-8 text-primary/70 group-hover:text-white/70" />
            </div>
          </Link>

          <Link
            to="/business/promotions"
            className={`group rounded-3xl bg-gradient-to-br ${businessColors.light} hover:${businessColors.primary} p-6 border border-outline-variant/10 hover:border-transparent transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary group-hover:text-white">Promotions</p>
                <p className="font-serif text-3xl text-primary group-hover:text-white">{promotions.length}</p>
              </div>
              <Sparkles className="size-8 text-primary/70 group-hover:text-white/70" />
            </div>
          </Link>

          <Link
            to="/business/settings"
            className={`group rounded-3xl bg-gradient-to-br ${businessColors.light} hover:${businessColors.primary} p-6 border border-outline-variant/10 hover:border-transparent transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary group-hover:text-white">Settings</p>
                <p className="font-serif text-3xl text-primary group-hover:text-white">Manage</p>
              </div>
              <ArrowUpRight className="size-8 text-primary/70 group-hover:text-white/70" />
            </div>
          </Link>
        </div>
      </div>

      {/* Signup Portal */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="quest-panel p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="font-serif text-2xl text-primary">{t('Signup Portal')}</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-on-surface-variant/70">
                {t('Display this portal at checkout or on signage. New customers scan it, create an account, and appear below as pending invites before their reward credit is added.')}
              </p>
            </div>
            <div className={`size-12 rounded-xl bg-gradient-to-br ${businessColors.light} flex items-center justify-center text-primary`}>
              <QrCode className="size-6" />
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Input
              readOnly
              value={signupQrUrl}
              placeholder={t('Signup QR link unavailable')}
              className="h-14 rounded-2xl bg-surface-lowest text-sm"
            />
            <Button
              type="button"
              variant="outline"
              className="h-14 rounded-2xl px-6"
              disabled={!signupQrUrl}
              onClick={async () => {
                if (!signupQrUrl) return
                await navigator.clipboard.writeText(signupQrUrl)
                setCopiedSignupUrl(true)
                toast.success(t('Signup QR link copied'))
                window.setTimeout(() => setCopiedSignupUrl(false), 1800)
              }}
            >
              <Copy className="size-4" />
              {copiedSignupUrl ? t('Copied') : t('Copy Portal Link')}
            </Button>
          </div>
        </div>

        <div className="quest-panel p-8">
          <div className="mx-auto flex size-56 items-center justify-center rounded-3xl bg-surface-lowest p-4">
            {signupQrUrl ? <QRCodeSVG value={signupQrUrl} size={184} /> : <QrCode className="size-16 text-on-surface-variant/30" />}
          </div>
          <p className="mt-5 text-center text-sm font-semibold text-primary">{business?.name} {t('signup portal')}</p>
          <p className="mt-2 text-center text-xs leading-relaxed text-on-surface-variant/70">
            {t('Approve the invite below to grant the reward credit.')}
          </p>
        </div>
      </div>

        {/* Reward Credit Redemption Validation */}
        <div>
          <div className="mb-6 space-y-1">
          <h2 className="font-serif text-2xl text-primary">{t('Reward Credit Scanner')}</h2>
          <p className="text-sm text-on-surface-variant/70">{t("Enter the customer's 6-digit reward credit code")}</p>
        </div>

        <form
          className="quest-panel p-6"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            if (!business?.id || redemptionCode.length !== 6) return
            validateCreditCode.mutate(redemptionCode, {
              onSuccess: () => setRedemptionCode(''),
            })
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            <Input
              value={redemptionCode}
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              aria-label={t('Redemption code')}
              className="h-14 rounded-2xl bg-surface-lowest text-center font-mono text-2xl tracking-[0.2em]"
              onChange={(event) => {
                setRedemptionCode(event.target.value.replace(/\D/g, '').slice(0, 6))
              }}
            />
            <Button
              type="submit"
              className="h-14 rounded-2xl px-8"
              disabled={!business?.id || redemptionCode.length !== 6 || validateCreditCode.isPending}
            >
              <CheckCircle className="size-4" />
              {validateCreditCode.isPending ? t('Scanning...') : t('Validate Reward Credit')}
            </Button>
          </div>
        </form>
      </div>

      {/* Pending Invites */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl text-primary">{t('Pending Invites')}</h2>
            <p className="text-sm text-on-surface-variant/70">{t('Review new customer reward credit invites')}</p>
          </div>
          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70 italic">
            {pendingReferrals.data?.length ?? 0} pending
          </span>
        </div>

        <div className="quest-panel divide-y divide-outline-variant/10 overflow-hidden">
          {pendingReferrals.isLoading ? (
            <div className="p-12 text-center">
              <p className="text-on-surface-variant/60 font-medium">Loading referrals...</p>
            </div>
          ) : null}

          {!pendingReferrals.isLoading && (pendingReferrals.data?.length ?? 0) === 0 ? (
            <div className="p-12 text-center">
              <p className="text-on-surface-variant/60 font-medium">No pending referrals.</p>
            </div>
          ) : null}

          {(pendingReferrals.data ?? []).map((referral) => (
            <div key={referral.id} className="p-6 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="grid flex-1 gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/60">Referrer</p>
                  <p className="font-serif text-xl text-primary">{referral.referrer.fullName}</p>
                  <p className="text-sm font-medium text-on-surface-variant/75">{referral.referrer.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/60">New Customer</p>
                  <p className="font-serif text-xl text-primary">{referral.referee.fullName}</p>
                  <p className="text-sm font-medium text-on-surface-variant/75">{referral.referee.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70">
                  {formatDate(referral.createdAt)}
                </span>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full bg-success/10 text-success hover:bg-success/15"
                  disabled={approveReferral.isPending || rejectReferral.isPending || !profile?.id}
                  onClick={() => {
                    if (!profile?.id) return
                    approveReferral.mutate({ id: referral.id, approverId: profile.id })
                  }}
                >
                  <CheckCircle className="size-4" />
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-red-200 text-red-600 hover:bg-red-50"
                  disabled={approveReferral.isPending || rejectReferral.isPending}
                  onClick={() => rejectReferral.mutate(referral.id)}
                >
                  <XCircle className="size-4" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fulfillment Queue */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl text-primary">Fulfillment Queue</h2>
            <p className="text-sm text-on-surface-variant/70">Manage and fulfill pending reward claims</p>
          </div>
          <Link to="/business/rewards" className="text-sm font-semibold text-primary hover:underline">
            Manage Vault
          </Link>
        </div>

        <div className="quest-panel divide-y divide-outline-variant/10 overflow-hidden">
          {redemptions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-on-surface-variant/60 font-medium">No redemptions yet.</p>
            </div>
          ) : (
            redemptions.slice(0, 5).map((redemption) => (
              <div key={redemption.id} className="p-6 flex items-center justify-between group hover:bg-surface-low transition-colors">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Gift className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">{redemption.rewardTitle}</h4>
                    <p className="text-xs text-on-surface-variant/70">
                      Redeemed {new Date(redemption.redeemedAt).toLocaleDateString()} at {new Date(redemption.redeemedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className={`px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-widest ${
                    redemption.status === 'ready' 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {redemption.status}
                  </div>
                  
                  {redemption.status === 'ready' && (
                    <Button 
                      size="sm" 
                      className="rounded-full h-8 px-4 text-xs font-bold"
                      onClick={() => fulfillRedemption.mutate(redemption.id)}
                      disabled={fulfillRedemption.isPending}
                    >
                      {fulfillRedemption.isPending ? '...' : 'Fulfill'}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
