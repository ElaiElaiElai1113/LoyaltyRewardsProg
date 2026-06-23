import {
  ArrowUpRight,
  CheckCircle,
  Copy,
  Download,
  DollarSign,
  Gift,
  Hotel,
  MonitorPlay,
  QrCode,
  ReceiptText,
  ScanLine,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { BusinessMetricCard } from '@/components/business-metric-card'
import { QrScanner } from '@/components/qr-scanner'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useBusinessOwnerData,
  usePartnerPerformance,
  usePartnerReferrals,
  useValidateCreditCode,
} from '@/hooks/use-business-owner-data'
import { useAuth } from '@/hooks/use-auth'
import { useFulfillRedemption } from '@/hooks/use-admin-data'
import { useLanguage } from '@/lib/language'
import { getPartnerReferralStatusLabel, getRedemptionStatusLabel } from '@/lib/status-labels'
import { formatCurrency, formatDate, formatPoints } from '@/lib/utils'

export function BusinessDashboardPage() {
  const { business, metrics, promotions, redemptions } = useBusinessOwnerData()
  const { profile } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const signupQrRef = useRef<HTMLDivElement | null>(null)
  const [redemptionCode, setRedemptionCode] = useState('')
  const [memberQrInput, setMemberQrInput] = useState('')
  const [copiedSignupUrl, setCopiedSignupUrl] = useState(false)
  const [pendingFulfillmentId, setPendingFulfillmentId] = useState<string | null>(null)
  const fulfillRedemption = useFulfillRedemption(profile)
  const partnerPerformance = usePartnerPerformance(business?.id)
  const partnerReferrals = usePartnerReferrals(business?.id)
  const validateCreditCode = useValidateCreditCode(business?.id)

  if (!metrics) {
    return (
      <div className="space-y-10">
        <Skeleton className="h-48 rounded-[2rem]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
      </div>
    )
  }

  const businessColors = { primary: 'from-primary to-primary-container', light: 'from-primary/14 to-secondary-container/14' }
  const signupQrUrl =
    profile?.referralCode && business?.id && typeof window !== 'undefined'
      ? `${window.location.origin}/promo?ref=${profile.referralCode}&business=${business.id}`
      : ''
  const partnerSummaries = partnerPerformance.data ?? []
  const partnerReferralCount = partnerReferrals.data?.length ?? 0
  const partnerCreditsEarned = partnerSummaries.reduce((sum, entry) => sum + entry.creditsEarned, 0)
  const partnerCreditsRedeemed = partnerSummaries.reduce((sum, entry) => sum + entry.creditsRedeemed, 0)
  const outstandingPartnerCredits = Math.max(partnerCreditsEarned - partnerCreditsRedeemed, 0)
  const pendingFulfillmentCount = redemptions.filter((redemption) => redemption.status === 'ready').length
  const openMemberQrSale = (input: string) => {
    const value = input.trim()
    if (!value) {
      toast.error(t('Paste or scan a member QR first.'))
      return
    }

    try {
      const url = new URL(value, window.location.origin)
      const match = url.pathname.match(/^\/business\/member-sale\/([^/]+)$/)
      const token = match?.[1]

      if (token) {
        navigate(`/business/member-sale/${token}`)
        return
      }
    } catch {
      // Fall through and treat the value as a raw token.
    }

    if (/^[A-Za-z0-9_-]{12,}$/.test(value)) {
      navigate(`/business/member-sale/${value}`)
      return
    }

    toast.error(t('That QR is not a Medellin Rewards member QR.'))
  }

  const handleDownloadSignupQr = () => {
    const svg = signupQrRef.current?.querySelector('svg')
    if (!svg || !business?.name) {
      toast.error(t('Unable to download QR code.'))
      return
    }

    const serializer = new XMLSerializer()
    const svgMarkup = serializer.serializeToString(svg)
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const fileBase = business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'signup-portal'

    link.href = url
    link.download = `${fileBase}-signup-qr.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    toast.success(t('QR code downloaded.'))
  }

  return (
      <div className="space-y-10 xl:space-y-16">
      {/* Welcome Section */}
      <div className="warm-hero-muted relative overflow-hidden rounded-[2rem] px-6 py-8 shadow-2xl xl:px-8 xl:py-12">
        <div className="absolute inset-0 bg-[var(--muted)] bg-[length:36px_36px] opacity-25"></div>
        <div className="relative">
          <p className="text-sm font-medium text-[var(--muted-foreground)] mb-3">{t('Business Overview')}</p>
          <h1 className="font-serif text-[clamp(2.6rem,5vw,4rem)] tracking-tight text-white leading-[1.1]">
            {business?.name} {t('Command Center')}
          </h1>
          <p className="mt-4 text-lg text-white/80 font-medium">
            {t('Scan customer member QR codes, record purchases, award points, and track commission from one workspace.')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-primary/15 bg-card p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <QrCode className="size-6" />
            </div>
            <div className="space-y-3">
              <h2 className="font-serif text-3xl text-primary">Customer QR Sales</h2>
              <p className="text-sm leading-6 text-on-surface-variant/80">
                Staff scan the customer QR from their profile, enter the purchase amount, and Medellin Rewards records the points plus the commission owed by this business.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-primary/15 bg-primary/5 p-8 shadow-sm">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Commission Model</p>
          <p className="mt-3 font-serif text-4xl text-primary">{business?.commissionRatePercent ?? 0}%</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant/80">
            Applied to recorded QR sales and tracked as commission owed to Medellin Rewards.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-primary/15 bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ScanLine className="size-6" />
            </div>
            <div className="space-y-2">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">{t('Member QR scanner')}</p>
              <h2 className="font-serif text-3xl text-primary">{t('Scan member QR')}</h2>
              <p className="max-w-2xl text-sm leading-6 text-on-surface-variant/80">
                {t('Use the staff device camera, upload a screenshot, or paste the member QR link to open the sale form.')}
              </p>
            </div>
          </div>
          <QrScanner
            idleMessage={t('Point the camera at the customer member QR or upload a QR screenshot.')}
            detectedMessage={t('Member QR detected. Opening the sale form.')}
            unavailableMessage={t('Live camera scanning is not available in this browser. Paste the QR link instead.')}
            onDetected={openMemberQrSale}
          />
        </div>

        <form
          className="rounded-3xl border border-primary/15 bg-card p-6 shadow-sm sm:p-8"
          onSubmit={(event) => {
            event.preventDefault()
            openMemberQrSale(memberQrInput)
          }}
        >
          <div className="space-y-2">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">{t('Manual fallback')}</p>
            <h2 className="font-serif text-3xl text-primary">{t('Paste QR link')}</h2>
            <p className="text-sm leading-6 text-on-surface-variant/80">
              {t('If the camera is unavailable, paste the customer QR link or token here.')}
            </p>
          </div>
          <div className="mt-6 grid gap-3">
            <Input
              value={memberQrInput}
              onChange={(event) => setMemberQrInput(event.target.value)}
              placeholder="https://.../business/member-sale/token"
              className="h-14 rounded-2xl bg-surface-lowest text-sm"
            />
            <Button type="submit" className="h-12 rounded-2xl">
              <ScanLine className="size-4" />
              {t('Open sale form')}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-primary/15 bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MonitorPlay className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">{t('Walkthrough demo')}</p>
              <h2 className="mt-2 font-serif text-3xl leading-tight text-primary">{t('See the business walkthrough')}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant/80">
                {t('Open the guided demo for scanning a customer QR, recording the purchase, awarding points, and tracking commission.')}
              </p>
            </div>
          </div>
          <Button asChild className="shrink-0 rounded-full">
            <Link to="/business/guide">
              <MonitorPlay className="size-4" />
              {t('Open walkthrough')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BusinessMetricCard
          title={t('Members Recruited')}
          value={metrics.totalMembers.toString()}
          icon={<Users className="size-6" />}
          helper={t('Customers with completed orders')}
        />
        <BusinessMetricCard
          title={t('Orders Completed')}
          value={metrics.totalOrders.toString()}
          icon={<ShoppingBag className="size-6" />}
          helper={t('Confirmed order volume')}
        />
        <BusinessMetricCard
          title={t('Business Revenue')}
          value={formatCurrency(metrics.totalRevenue)}
          icon={<TrendingUp className="size-6" />}
          helper={t('Lifetime demo order value')}
        />
        <BusinessMetricCard
          title={t('Active Campaigns')}
          value={metrics.activePromotions.toString()}
          icon={<Sparkles className="size-6" />}
          helper={t('Promotions currently live')}
        />
        <BusinessMetricCard
          title="Partner Referrals"
          value={partnerReferralCount.toString()}
          icon={<Hotel className="size-6" />}
          helper="Customers attributed to partner contacts"
        />
        <BusinessMetricCard
          title="Partner Credits"
          value={partnerCreditsEarned.toString()}
          icon={<Gift className="size-6" />}
          helper="Credits earned by referral sources"
        />
        <BusinessMetricCard
          title="Outstanding Credits"
          value={outstandingPartnerCredits.toString()}
          icon={<QrCode className="size-6" />}
          helper="Partner credits not yet marked redeemed"
        />
        <BusinessMetricCard
          title="QR Transactions"
          value={(metrics.memberTransactionCount ?? 0).toString()}
          icon={<ReceiptText className="size-6" />}
          helper="Outside-app sales recorded from member QR scans"
        />
        <BusinessMetricCard
          title="QR Revenue"
          value={formatCurrency(metrics.inPersonRevenue ?? 0)}
          icon={<DollarSign className="size-6" />}
          helper="Outside-app purchase volume recorded"
        />
        <BusinessMetricCard
          title="Commission Owed"
          value={formatCurrency(metrics.commissionOwed ?? 0)}
          icon={<TrendingUp className="size-6" />}
          helper="Unpaid Medellin Rewards commission"
        />
        <BusinessMetricCard
          title={t('Pending Fulfillment')}
          value={pendingFulfillmentCount.toString()}
          icon={<CheckCircle className="size-6" />}
          helper={t('Reward claims ready for staff')}
        />
      </div>

      {/* Points Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-card text-card-foreground shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="font-serif text-2xl text-primary">{t('Points Issued')}</h3>
              <p className="text-sm text-on-surface-variant/70">{t('Total points awarded to customers')}</p>
            </div>
            <div className="size-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <TrendingUp className="size-6" />
            </div>
          </div>
          <p className="font-serif text-5xl tracking-tight text-primary">{formatPoints(metrics.pointsIssued)}</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-card text-card-foreground shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="font-serif text-2xl text-primary">{t('Points Redeemed')}</h3>
              <p className="text-sm text-on-surface-variant/70">{t('Total points spent on rewards')}</p>
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
        <h2 className="font-serif text-2xl text-primary mb-6">{t('Command Shortcuts')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            to="/business/promotions"
            className={`group rounded-3xl bg-gradient-to-br ${businessColors.light} hover:${businessColors.primary} p-6 border border-outline-variant/10 hover:border-transparent transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary group-hover:text-white">{t('Promotions')}</p>
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
                <p className="text-sm font-semibold uppercase tracking-wider text-primary group-hover:text-white">{t('Settings')}</p>
                <p className="font-serif text-3xl text-primary group-hover:text-white">{t('Manage')}</p>
              </div>
              <ArrowUpRight className="size-8 text-primary/70 group-hover:text-white/70" />
            </div>
          </Link>

          <Link
            to="/business/partners"
            className={`group rounded-3xl bg-gradient-to-br ${businessColors.light} hover:${businessColors.primary} p-6 border border-outline-variant/10 hover:border-transparent transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary group-hover:text-white">Partners</p>
                <p className="font-serif text-3xl text-primary group-hover:text-white">{partnerPerformance.data?.length ?? 0}</p>
              </div>
              <Hotel className="size-8 text-primary/70 group-hover:text-white/70" />
            </div>
          </Link>
        </div>
      </div>

      {/* Signup Portal */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-[var(--border)] bg-card text-card-foreground shadow-sm p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="font-serif text-2xl text-primary">{t('Signup Portal')}</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-on-surface-variant/70">
                Display this portal at checkout or on signage. New customers scan it to create an account and earn rewards.
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

        <div className="rounded-xl border border-[var(--border)] bg-card text-card-foreground shadow-sm p-8">
          <div ref={signupQrRef} className="mx-auto flex size-56 items-center justify-center rounded-3xl bg-surface-lowest p-4">
            {signupQrUrl ? <QRCodeSVG value={signupQrUrl} size={184} /> : <QrCode className="size-16 text-on-surface-variant/30" />}
          </div>
          <p className="mt-5 text-center text-sm font-semibold text-primary">{business?.name} {t('signup portal')}</p>
          <p className="mt-2 text-center text-xs leading-relaxed text-on-surface-variant/70">
            Customer invite credits remain available for the legacy referral flow.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-5 w-full rounded-2xl"
            disabled={!signupQrUrl}
            onClick={handleDownloadSignupQr}
          >
            <Download className="size-4" />
            {t('Download QR')}
          </Button>
        </div>
      </div>

        {/* Reward Credit Redemption Validation */}
        <div>
          <div className="mb-6 space-y-1">
          <h2 className="font-serif text-2xl text-primary">{t('Reward Credit Scanner')}</h2>
          <p className="text-sm text-on-surface-variant/70">{t("Enter the customer's 6-digit reward credit code")}</p>
        </div>

        <form
          className="rounded-xl border border-[var(--border)] bg-card text-card-foreground shadow-sm p-6"
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

      {/* Partner Referrals */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl text-primary">Partner Referrals</h2>
            <p className="text-sm text-on-surface-variant/70">Track hotel/front-desk referrals and reward partners after first paid orders.</p>
          </div>
          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70 italic">
            {partnerCreditsEarned} credits earned
          </span>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <div className="rounded-xl border border-[var(--border)] bg-card text-card-foreground shadow-sm divide-y divide-outline-variant/10 overflow-hidden">
            {partnerPerformance.isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-5">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-10 w-12" />
                </div>
              ))
            ) : (partnerPerformance.data ?? []).slice(0, 4).map((entry) => (
              <div key={entry.partnerReferrerId} className="flex items-center justify-between p-5">
                <div>
                  <p className="font-serif text-xl text-primary">{entry.contactName}</p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-2xl text-primary">{entry.creditsEarned}</p>
                  <p className="text-[0.65rem] uppercase tracking-[0.18em] text-on-surface-variant/70">credits</p>
                </div>
              </div>
            ))}
            {!partnerPerformance.isLoading && (partnerPerformance.data?.length ?? 0) === 0 ? (
              <EmptyState
                className="border-0 shadow-none"
                icon={<Hotel className="size-8" />}
                title={t('No partner contacts yet')}
                description={t('Create partner contacts to track hotel and front-desk referrals.')}
              />
            ) : null}
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-card text-card-foreground shadow-sm divide-y divide-outline-variant/10 overflow-hidden">
          {partnerReferrals.isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-7 w-40" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-7 w-44" />
                    <Skeleton className="h-4 w-52" />
                  </div>
                </div>
              </div>
            ))
          ) : null}

          {!partnerReferrals.isLoading && (partnerReferrals.data?.length ?? 0) === 0 ? (
              <EmptyState
                className="border-0 shadow-none"
                icon={<Users className="size-8" />}
                title={t('No partner referrals yet')}
                description={t('Attributed customers will appear here after referral links are used.')}
              />
          ) : null}

          {(partnerReferrals.data ?? []).slice(0, 6).map((referral) => (
            <div key={referral.id} className="p-6 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="grid flex-1 gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/60">Referral Source</p>
                  <p className="font-serif text-xl text-primary">{referral.partnerReferrer.contactName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/60">Attributed Customer</p>
                  <p className="font-serif text-xl text-primary">{referral.customer.fullName}</p>
                  <p className="text-sm font-medium text-on-surface-variant/75">{referral.customer.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70">{formatDate(referral.createdAt)}</span>
                <Button type="button" size="sm" variant="outline" className="rounded-full">
                  {getPartnerReferralStatusLabel(referral.status)}
                </Button>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* Fulfillment Queue */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl text-primary">{t('Fulfillment Queue')}</h2>
            <p className="text-sm text-on-surface-variant/70">{t('Manage and fulfill pending reward claims')}</p>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-card text-card-foreground shadow-sm divide-y divide-outline-variant/10 overflow-hidden">
          {redemptions.length === 0 ? (
            <EmptyState
              className="border-0 shadow-none"
              icon={<Gift className="size-8" />}
              title={t('No redemptions yet')}
              description={t('Reward claims will appear here when customers redeem points.')}
            />
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
                      {t('Redeemed {date} at {time}', {
                        date: new Date(redemption.redeemedAt).toLocaleDateString(),
                        time: new Date(redemption.redeemedAt).toLocaleTimeString(),
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className={`px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-widest ${
                    redemption.status === 'ready' 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {getRedemptionStatusLabel(redemption.status)}
                  </div>
                  
                  {redemption.status === 'ready' && (
                    <Button 
                      size="sm" 
                      className="rounded-full h-8 px-4 text-xs font-bold"
                      onClick={() => {
                        setPendingFulfillmentId(redemption.id)
                        fulfillRedemption.mutate(redemption.id, {
                          onSettled: () => {
                            setPendingFulfillmentId((current) => (current === redemption.id ? null : current))
                          },
                        })
                      }}
                      disabled={pendingFulfillmentId !== null}
                    >
                      {pendingFulfillmentId === redemption.id ? '...' : t('Fulfill')}
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
