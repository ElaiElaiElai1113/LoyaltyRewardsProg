import { ChartNoAxesColumn, Gift, History, Wallet } from 'lucide-react'

import { MetricCard } from '@/components/metric-card'
import { Badge } from '@/components/ui/badge'
import { ActivityList } from '@/features/activity/components/activity-list'
import { useActivities, useRewardBalance } from '@/hooks/use-customer-data'
import { useAuth } from '@/hooks/use-auth'

export function ActivityPage() {
  const { profile } = useAuth()
  const activities = useActivities(profile?.id)
  const rewardBalance = useRewardBalance(profile?.id)

  const postedCount = activities.data?.filter((item) => item.status === 'posted').length ?? 0
  const earnedThisMonth =
    activities.data?.filter((item) => item.points > 0).reduce((sum, item) => sum + item.points, 0) ?? 0
  const redeemedThisMonth =
    activities.data?.filter((item) => item.points < 0).reduce((sum, item) => sum + Math.abs(item.points), 0) ?? 0

  return (
    <div className="space-y-16 pb-20">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between border-b border-outline-variant/10 pb-12">
        <div className="space-y-4 max-w-2xl">
          <Badge variant="ritual" className="bg-tertiary/20 text-primary">
            Narrative History
          </Badge>
          <h1 className="font-serif text-5xl tracking-tight text-primary md:text-7xl leading-[1.1]">
            Your Chronicle
          </h1>
          <p className="text-lg leading-relaxed text-on-surface-variant/60 font-medium">
            Every visit, bonus, and redemption in one clear timeline. Your journey with Velvet Brew is preserved here.
          </p>
        </div>

        <div className="flex flex-col items-start gap-4 lg:items-end">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">Loyalty Status</span>
          <div className="rounded-2xl bg-surface-low px-6 py-4 text-primary shadow-sm flex items-center gap-4 border border-outline-variant/10">
             <div className="size-10 rounded-full bg-primary flex items-center justify-center">
                <Wallet className="size-5 text-secondary-container" />
             </div>
             <div className="flex flex-col">
                <span className="font-serif text-2xl leading-none">{rewardBalance.data?.points ?? 0}</span>
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-on-surface-variant/40">Total Resonance</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard
          label="Presence"
          value={`${postedCount}`}
          icon={History}
          helper="Verified ritual visits"
        />
        <MetricCard
          label="Resonance"
          value={`${earnedThisMonth}`}
          icon={ChartNoAxesColumn}
          helper="Recent points accumulation"
        />
        <MetricCard
          label="Redemptions"
          value={`${redeemedThisMonth}`}
          icon={Gift}
          helper="Artisanal rewards unlocked"
        />
      </div>

      <div className="space-y-8">
        <div className="flex items-end justify-between border-b border-outline-variant/5 pb-4">
          <h2 className="font-serif text-3xl text-primary">Timeline</h2>
          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/40 italic">Descending Chronicle</span>
        </div>
        <ActivityList items={activities.data ?? []} />
      </div>
    </div>
  )
}
