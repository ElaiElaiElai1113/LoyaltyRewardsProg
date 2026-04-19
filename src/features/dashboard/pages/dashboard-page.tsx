import { CheckCircle, Clock, Copy, CupSoda, Gift, Ticket, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { MetricCard } from '@/components/metric-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ActivityList } from '@/features/activity/components/activity-list'
import { PromotionCard } from '@/features/rewards/components/promotion-card'
import { RewardCard } from '@/features/rewards/components/reward-card'
import {
  useActivities,
  useBusinesses,
  useGenerateCreditCode,
  usePromotions,
  useReferralStatus,
  useRewardBalance,
  useRewards,
} from '@/hooks/use-customer-data'
import { useAuth } from '@/hooks/use-auth'
import { formatPoints } from '@/lib/utils'

const creditCodeLifetimeSeconds = 15 * 60

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [copiedReferralUrl, setCopiedReferralUrl] = useState(false)
  const [creditCode, setCreditCode] = useState<string | null>(null)
  const [creditCodeCreatedAt, setCreditCodeCreatedAt] = useState<number | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(creditCodeLifetimeSeconds)
  const businesses = useBusinesses()
  const rewardBalance = useRewardBalance(profile?.id)
  const generateCreditCode = useGenerateCreditCode(profile?.id)
  const rewards = useRewards()
  const promotions = usePromotions()
  const activities = useActivities(profile?.id)
  const referralStatus = useReferralStatus(profile?.id)

  const balance = rewardBalance.data
  const referral = referralStatus.data
  const currentBusiness = businesses.data?.[0] ?? null
  const referralUrl =
    profile && currentBusiness && typeof window !== 'undefined'
      ? `${window.location.origin}/promo?ref=${profile.id}&business=${currentBusiness.id}`
      : ''
  const featuredRewards = rewards.data?.filter((reward) => reward.featured).slice(0, 2) ?? []
  const activePromotions = promotions.data?.slice(0, 2) ?? []
  const recentActivity = activities.data?.slice(0, 4) ?? []

  useEffect(() => {
    if (!creditCodeCreatedAt) return

    const updateRemainingTime = () => {
      const elapsedSeconds = Math.floor((Date.now() - creditCodeCreatedAt) / 1000)
      setRemainingSeconds(Math.max(creditCodeLifetimeSeconds - elapsedSeconds, 0))
    }

    updateRemainingTime()
    const interval = window.setInterval(updateRemainingTime, 1000)
    return () => window.clearInterval(interval)
  }, [creditCodeCreatedAt])

  const handleGenerateCreditCode = async () => {
    if (!profile?.id) return

    try {
      const code = await generateCreditCode.mutateAsync()
      setCreditCode(code)
      setCreditCodeCreatedAt(Date.now())
      setRemainingSeconds(creditCodeLifetimeSeconds)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not generate redemption code.')
    }
  }

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
            <div className="space-y-3">
              <MetricCard
                label="Drink Credits"
                value={`${balance?.availableCredits ?? 0}`}
                icon={CupSoda}
                helper="Credits ready to use"
              />
              {(balance?.availableCredits ?? 0) > 0 ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-12 w-full rounded-2xl"
                  disabled={generateCreditCode.isPending || !profile?.id}
                  onClick={handleGenerateCreditCode}
                >
                  <CupSoda className="size-4" />
                  {generateCreditCode.isPending ? 'Generating...' : 'Redeem Free Coffee'}
                </Button>
              ) : null}
            </div>
            <MetricCard
              label="Redeemable"
              value={`${rewards.data?.filter((reward) => (balance?.points ?? 0) >= reward.pointsCost).length ?? 0}`}
              icon={Ticket}
              helper="Rewards you can afford"
            />
            <div className="rounded-3xl bg-white/95 p-6 text-primary shadow-card">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center lg:flex-col lg:items-start">
                <div className="rounded-2xl bg-white p-3 text-primary shadow-sm">
                  {referralUrl ? <QRCodeSVG value={referralUrl} size={120} /> : <div className="size-[120px]" />}
                </div>
                <div className="min-w-0 flex-1 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl tracking-tight">Refer a Friend</h3>
                    <p className="text-sm font-medium leading-relaxed text-on-surface-variant">
                      Share this QR to give a friend (and yourself) a free coffee.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={referralUrl}
                      className="h-11 min-w-0 rounded-xl bg-surface-lowest px-3 py-2 text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 rounded-xl bg-white"
                      disabled={!referralUrl}
                      aria-label="Copy referral link"
                      onClick={async () => {
                        if (!referralUrl) return
                        await navigator.clipboard.writeText(referralUrl)
                        setCopiedReferralUrl(true)
                        window.setTimeout(() => setCopiedReferralUrl(false), 1800)
                      }}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                  {copiedReferralUrl ? (
                    <p className="text-xs font-bold text-success">Referral link copied.</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Dialog
        open={Boolean(creditCode)}
        onOpenChange={(open) => {
          if (!open) {
            setCreditCode(null)
            setCreditCodeCreatedAt(null)
          }
        }}
      >
        <DialogContent className="flex min-h-[100dvh] w-screen max-w-none items-center justify-center rounded-none border-0 bg-primary-container p-6 text-white sm:p-10">
          <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center text-primary shadow-card sm:p-12">
            <DialogHeader className="mb-8 items-center">
              <DialogTitle className="text-4xl text-primary sm:text-5xl">Redeem Free Coffee</DialogTitle>
              <DialogDescription className="text-base font-medium text-on-surface-variant">
                Show this code to your barista
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8">
              <div className="rounded-3xl bg-surface-low px-6 py-8">
                <p className="font-mono text-6xl font-bold tracking-[0.18em] text-primary sm:text-7xl">
                  {creditCode}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 text-on-surface-variant">
                <Clock className="size-5" />
                <span className="font-serif text-3xl text-primary">{formatCountdown(remainingSeconds)}</span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-on-surface-variant/75">
                This code expires 15 minutes after it is generated.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {referral ? (
        <section
          className={`rounded-3xl border p-6 shadow-sm ${
            referral.status === 'approved'
              ? 'border-success/20 bg-success/10'
              : referral.status === 'rejected'
                ? 'border-red-200 bg-red-50'
                : 'border-warning/20 bg-warning/10'
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${
                  referral.status === 'approved'
                    ? 'bg-success/15 text-success'
                    : referral.status === 'rejected'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-warning/15 text-warning'
                }`}
              >
                {referral.status === 'approved' ? (
                  <CheckCircle className="size-6" />
                ) : referral.status === 'rejected' ? (
                  <XCircle className="size-6" />
                ) : (
                  <Clock className="size-6" />
                )}
              </div>
              <div className="space-y-1">
                <p className="font-serif text-2xl tracking-tight text-primary">
                  Referral {referral.status}
                </p>
                <p className="max-w-2xl text-sm font-medium leading-relaxed text-on-surface-variant/80">
                  {referral.status === 'approved'
                    ? 'Your referral was approved. Your coffee credit has been added to your balance.'
                    : referral.status === 'rejected'
                      ? 'This referral was not approved. Ask a barista if you think this needs another look.'
                      : 'Your referral is pending barista approval. Your coffee credit will appear after approval.'}
                </p>
              </div>
            </div>
            <Badge
              variant="accent"
              className={
                referral.status === 'approved'
                  ? 'bg-success/10 text-success border-success/20'
                  : referral.status === 'rejected'
                    ? 'bg-red-100 text-red-600 border-red-200'
                    : 'bg-warning/10 text-warning border-warning/20'
              }
            >
              {referral.status}
            </Badge>
          </div>
        </section>
      ) : null}

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
