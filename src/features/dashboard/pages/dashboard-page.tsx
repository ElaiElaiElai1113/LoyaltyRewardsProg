import { CheckCircle, Clock, Copy, Crown, Flame, Gift, Swords, Ticket, Trophy, XCircle } from 'lucide-react'
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
import { useLanguage } from '@/lib/language'
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
  const { t } = useLanguage()
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
    profile?.referralCode && currentBusiness && typeof window !== 'undefined'
      ? `${window.location.origin}/promo?ref=${profile.referralCode}&business=${currentBusiness.id}`
      : ''
  const featuredRewards = rewards.data?.filter((reward) => reward.featured).slice(0, 2) ?? []
  const activePromotions = promotions.data?.slice(0, 2) ?? []
  const recentActivity = activities.data?.slice(0, 4) ?? []
  const points = balance?.points ?? 0
  const level = Math.max(1, Math.floor(points / 500) + 1)
  const nextLevelPoints = level * 500
  const levelBasePoints = (level - 1) * 500
  const levelProgress = Math.min(100, Math.round(((points - levelBasePoints) / 500) * 100))

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
      <div className="glass-panel relative overflow-hidden p-8 lg:p-10">
        <div className="hud-scanline" />
        <div className="absolute right-8 top-8 hidden rounded border border-secondary-container/50 bg-secondary-container/15 px-5 py-2 text-xs font-black uppercase tracking-widest text-secondary-container shadow-[0_0_16px_rgba(216,162,58,0.16)] md:block">
          {t('Level')} {level}
        </div>
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-6 max-w-2xl">
          <Badge variant="accent">
            {t('Player Dashboard')}
          </Badge>
          <h1 className="font-serif text-5xl font-bold uppercase tracking-[0.02em] text-primary-container md:text-7xl leading-[1.05]">
            {t('Welcome back,')} <br />
            <span className="text-secondary-container">{profile?.fullName?.split(' ')[0] ?? t('Member')}.</span>
          </h1>
          <p className="text-lg leading-relaxed text-on-surface-variant/85 font-medium">
            {t('Complete visits, stack XP, unlock rewards, and keep your streak alive.')}
          </p>
        </div>

        <div className="flex-shrink-0 space-y-4">
          <div className="rounded border border-primary-container/25 bg-[#17100d]/82 p-5 text-white shadow-card">
            <div className="flex items-center justify-between gap-6">
              <span className="text-xs font-black uppercase tracking-widest text-white/75">{t('Next Level')}</span>
              <span className="font-serif text-2xl font-bold text-primary-container">{levelProgress}%</span>
            </div>
            <div className="mt-4 h-3 overflow-hidden bg-primary-container/10">
              <div
                className="h-full bg-[linear-gradient(90deg,#7bd8cf,#f4a84f,#d8a23a)] transition-all duration-700 shadow-[0_0_12px_rgba(244,168,79,0.42)]"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className="mt-3 text-xs font-bold text-white/70">
              {formatPoints(Math.max(nextLevelPoints - points, 0))} XP {t('until Level')} {level + 1}
            </p>
          </div>
          <Button asChild variant="default" size="lg" className="h-16 px-10">
            <Link to="/rewards" className="flex items-center gap-3 text-lg">
              {t('Open Reward Vault')}
              <Crown className="size-6" />
            </Link>
          </Button>
        </div>
        </div>
      </div>

      {/* Hero Balance Section */}
      <section className="glass-panel relative overflow-hidden p-10 text-white md:p-16">
        <div className="hud-scanline" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(244,168,79,0.055)_1px,transparent_1px),linear-gradient(rgba(244,168,79,0.055)_1px,transparent_1px)] bg-[length:40px_40px] opacity-50" />
        <div className="relative z-10 grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-10">
            <div className="space-y-2">
              <span className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-white/80">{t('XP Balance')}</span>
              <div className="flex items-baseline gap-4">
                <span className="font-serif text-7xl font-bold tracking-tighter text-primary-container md:text-9xl leading-none">
                  {formatPoints(points)}
                </span>
                <span className="text-xl md:text-2xl font-medium text-white/80 italic">XP</span>
              </div>
            </div>

            <div className="space-y-4 max-w-md">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold uppercase tracking-widest text-white/85">{t('Reward Quest Progress')}</span>
                <span className="font-serif text-2xl font-bold text-primary-container">{balance?.tierProgress ?? 0}%</span>
              </div>
              <div className="h-2 bg-primary-container/10 w-full overflow-hidden">
                <div
                  className="h-full bg-[linear-gradient(90deg,#7bd8cf,#f4a84f,#d8a23a)] transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(244,168,79,0.42)]"
                  style={{ width: `${balance?.tierProgress ?? 0}%` }}
                />
              </div>
              <p className="text-sm font-medium leading-relaxed text-white/80">
                {t('Just')} {formatPoints(Math.max((balance?.nextRewardPoints ?? 0) - (balance?.points ?? 0), 0))} XP {t('away from your next reward.')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            <div className="space-y-3">
              <MetricCard
                label={t('Reward Credits')}
                value={`${balance?.availableCredits ?? 0}`}
                icon={Gift}
                helper={t('Instant perks ready')}
              />
              {(balance?.availableCredits ?? 0) > 0 ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-12 w-full rounded-2xl"
                  disabled={generateCreditCode.isPending || !profile?.id}
                  onClick={handleGenerateCreditCode}
                >
                  <Gift className="size-4" />
                  {generateCreditCode.isPending ? t('Generating...') : t('Use Reward Credit')}
                </Button>
              ) : null}
            </div>
            <MetricCard
              label={t('Unlocked')}
              value={`${rewards.data?.filter((reward) => (balance?.points ?? 0) >= reward.pointsCost).length ?? 0}`}
              icon={Ticket}
              helper={t('Rewards in your vault')}
            />
            <div className="rounded border border-primary-container/20 bg-[#17100d]/88 p-6 text-on-surface shadow-card">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center lg:flex-col lg:items-start">
                <div className="rounded border border-primary-container/35 bg-[#fff8ef] p-3 text-primary shadow-[0_0_18px_rgba(244,168,79,0.14)]">
                  {referralUrl ? <QRCodeSVG value={referralUrl} size={120} /> : <div className="size-[120px]" />}
                </div>
                <div className="min-w-0 flex-1 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl font-semibold uppercase tracking-[0.04em] text-primary-container">{t('Party Invite')}</h3>
                    <p className="text-sm font-medium leading-relaxed text-on-surface-variant">
                      {t('Share this QR to give a friend and yourself a reward credit.')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={referralUrl}
                      className="h-11 min-w-0 rounded bg-surface-lowest px-3 py-2 text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 bg-primary-container/10"
                      disabled={!referralUrl}
                      aria-label={t('Copy referral link')}
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
                    <p className="text-xs font-bold text-success">{t('Referral link copied.')}</p>
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
        <DialogContent className="flex min-h-[100dvh] w-screen max-w-none items-center justify-center rounded-none border-0 bg-[#120d0b]/95 p-6 text-white sm:p-10">
          <div className="glass-panel w-full max-w-xl p-8 text-center text-on-surface sm:p-12">
            <DialogHeader className="mb-8 items-center">
              <DialogTitle className="text-4xl text-primary-container sm:text-5xl">{t('Redeem Reward Credit')}</DialogTitle>
              <DialogDescription className="text-base font-medium text-on-surface-variant">
                {t('Show this code to staff')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8">
              <div className="rounded border border-primary-container/20 bg-surface-low px-6 py-8">
                <p className="font-mono text-6xl font-bold tracking-[0.18em] text-primary-container sm:text-7xl">
                  {creditCode}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 text-on-surface-variant">
                <Clock className="size-5" />
                <span className="font-serif text-3xl text-primary-container">{formatCountdown(remainingSeconds)}</span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-on-surface-variant/75">
                {t('This code expires 15 minutes after it is generated.')}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {referral ? (
        <section
          className={`rounded border p-6 shadow-sm ${
            referral.status === 'approved'
              ? 'border-success/20 bg-success/10'
              : referral.status === 'rejected'
                ? 'border-red-400/30 bg-red-500/10'
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
                      ? 'bg-red-500/15 text-red-300'
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
                <p className="font-serif text-2xl tracking-tight text-primary-container">
                  {t('Referral')} {t(referral.status)}
                </p>
                <p className="max-w-2xl text-sm font-medium leading-relaxed text-on-surface-variant/80">
                  {referral.status === 'approved'
                    ? t('Your party invite was approved. Your Reward Credit has been added to your balance.')
                    : referral.status === 'rejected'
                      ? t('This referral was not approved. Ask staff if you think this needs another look.')
                      : t('Your party invite is pending staff approval. Your Reward Credit will appear after approval.')}
                </p>
              </div>
            </div>
            <Badge
              variant="accent"
              className={
                referral.status === 'approved'
                  ? 'bg-success/10 text-success border-success/20'
                  : referral.status === 'rejected'
                    ? 'bg-red-500/10 text-red-300 border-red-400/30'
                    : 'bg-warning/10 text-warning border-warning/20'
              }
            >
              {t(referral.status)}
            </Badge>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            icon: Flame,
            title: t('Daily Streak'),
            body: t('Visit, scan, or order to keep momentum and earn faster.'),
            stat: '3x',
          },
          {
            icon: Swords,
            title: t('Side Quest'),
            body: t('Try a new partner business to discover more reward options.'),
            stat: '+120 XP',
          },
          {
            icon: Trophy,
            title: t('Boss Reward'),
            body: t('Reach the next tier and unlock higher-value perks.'),
            stat: `L${level + 1}`,
          },
        ].map((quest) => (
          <div key={quest.title} className="glass-panel p-6">
            <div className="flex items-center justify-between">
              <div className="flex size-12 items-center justify-center rounded border border-primary-container/35 bg-primary-container/10 text-primary-container">
                <quest.icon className="size-6" />
              </div>
              <span className="rounded border border-secondary-container/45 bg-secondary-container/15 px-4 py-1 text-sm font-black text-secondary-container">
                {quest.stat}
              </span>
            </div>
            <h3 className="mt-5 font-serif text-2xl font-semibold uppercase tracking-[0.03em] text-primary-container">{quest.title}</h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-on-surface-variant/80">{quest.body}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-20 lg:grid-cols-[1fr_400px]">
        {/* Featured Rewards */}
        <div className="space-y-10">
          <div className="flex items-end justify-between border-b border-outline-variant/10 pb-6">
            <div className="space-y-2">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">{t('Featured')}</span>
              <h2 className="font-serif text-4xl font-semibold uppercase tracking-[0.03em] text-primary-container">{t('Featured Rewards')}</h2>
            </div>
            <Button asChild variant="ghost">
              <Link to="/rewards">{t('Full Catalog')}</Link>
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
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">{t('Limited Time')}</span>
              <h2 className="font-serif text-4xl font-semibold uppercase tracking-[0.03em] text-primary-container">{t('Promotions')}</h2>
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
      <section className="glass-panel -mx-5 space-y-10 px-5 py-16 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
        <div className="mx-auto max-w-5xl space-y-10">
          <div className="flex items-end justify-between border-b border-outline-variant/10 pb-6">
            <div className="space-y-2">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">{t('Activity')}</span>
              <h2 className="font-serif text-4xl font-semibold uppercase tracking-[0.03em] text-primary-container">{t('Recent Activity')}</h2>
            </div>
            <Button asChild variant="ghost">
              <Link to="/activity">{t('History')}</Link>
            </Button>
          </div>
          <div className="overflow-hidden rounded border border-primary-container/15 bg-surface-lowest/80 p-2 shadow-sm">
            <ActivityList items={recentActivity} />
          </div>
        </div>
      </section>
    </div>
  )
}
