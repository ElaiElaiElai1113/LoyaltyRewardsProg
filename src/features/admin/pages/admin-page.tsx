import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { ActivityList } from '@/features/activity/components/activity-list'
import { PromotionCard } from '@/features/rewards/components/promotion-card'
import { RewardCard } from '@/features/rewards/components/reward-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useAdjustRewards,
  useAdminOverview,
  useAdminUsers,
  useCreatePromotion,
  useCreateReward,
} from '@/hooks/use-admin-data'
import { useAuth } from '@/hooks/use-auth'
import { usePromotions, useRewards } from '@/hooks/use-customer-data'
import {
  promotionDraftSchema,
  rewardAdjustmentSchema,
  rewardDraftSchema,
  type PromotionDraftFormValues,
  type RewardAdjustmentFormValues,
  type RewardDraftFormValues,
} from '@/types/forms'
import { formatDate } from '@/lib/utils'

export function AdminPage() {
  const { profile } = useAuth()
  const users = useAdminUsers()
  const overview = useAdminOverview()
  const rewards = useRewards()
  const promotions = usePromotions()
  const adjustRewards = useAdjustRewards(profile)
  const createReward = useCreateReward()
  const createPromotion = useCreatePromotion()

  const adjustmentForm = useForm<RewardAdjustmentFormValues>({
    resolver: zodResolver(rewardAdjustmentSchema),
    defaultValues: {
      profileId: '',
      delta: 50,
      reason: '',
    },
  })

  const rewardForm = useForm<RewardDraftFormValues>({
    resolver: zodResolver(rewardDraftSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'Drink',
      pointsCost: 220,
      highlight: '',
    },
  })

  const promotionForm = useForm<PromotionDraftFormValues>({
    resolver: zodResolver(promotionDraftSchema),
    defaultValues: {
      title: '',
      description: '',
      badge: '',
      cta: '',
      audience: '',
    },
  })

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 bg-surface-low rounded-3xl p-16 border border-outline-variant/10">
        <Badge variant="accent" className="bg-primary/10 text-primary">
          Staff Authentication Required
        </Badge>
        <div className="space-y-4 max-w-2xl">
          <h1 className="font-serif text-5xl tracking-tight text-primary leading-tight">
            Admin access requires staff credentials.
          </h1>
          <p className="text-lg font-medium leading-relaxed text-on-surface-variant/85">
            Please use the staff demo credentials or sign in with a verified admin account to manage rewards, promotions, and member data.
          </p>
        </div>
        <Button
          variant="tertiary"
          size="lg"
          onClick={() => window.location.href = '/'}
          className="rounded-full px-12"
        >
          Return to Home
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-16 pb-20">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between border-b border-outline-variant/10 pb-12">
        <div className="space-y-4 max-w-2xl">
          <Badge variant="accent" className="bg-primary/10 text-primary">
            Operations Portal
          </Badge>
          <h1 className="font-serif text-5xl tracking-tight text-primary md:text-7xl leading-[1.1]">
            Admin Dashboard
          </h1>
          <p className="text-lg leading-relaxed text-on-surface-variant/85 font-medium">
            Manage members, rewards, promotions, and monitor activity across the platform.
          </p>
        </div>

        <div className="flex flex-col items-start gap-4 lg:items-end">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Overview</span>
          <div className="rounded-2xl bg-surface-low px-8 py-5 text-primary shadow-sm flex items-center gap-6 border border-outline-variant/10">
             <div className="flex flex-col">
                <span className="font-serif text-3xl leading-none">{(users.data ?? []).length}</span>
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-on-surface-variant/80">Total Members</span>
             </div>
             <div className="w-px h-8 bg-outline-variant/20" />
             <div className="flex flex-col">
                <span className="font-serif text-3xl leading-none">{(rewards.data ?? []).length}</span>
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-on-surface-variant/80">Catalog Items</span>
             </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-12">
        <div className="sticky top-24 z-40 -mx-6 bg-surface/80 px-6 py-4 backdrop-blur-md flex justify-center">
          <TabsList className="w-full max-w-4xl">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="catalog">Rewards</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="members" className="space-y-12 outline-none">
          <div className="grid gap-16 xl:grid-cols-[450px_1fr]">
            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Quick Action</span>
                <h2 className="font-serif text-3xl text-primary">Reward Adjustment</h2>
              </div>

              <div className="rounded-2xl bg-surface-low p-8 border border-outline-variant/10">
                <form
                  className="space-y-8"
                  onSubmit={adjustmentForm.handleSubmit(async (values) => {
                    await adjustRewards.mutateAsync(values)
                    adjustmentForm.reset({
                      profileId: '',
                      delta: 50,
                      reason: '',
                    })
                  })}
                >
                  <div className="grid gap-3">
                    <Label htmlFor="profileId">Member ID</Label>
                    <Input
                      id="profileId"
                      list="member-id-options"
                      placeholder="Paste a member id"
                      {...adjustmentForm.register('profileId')}
                    />
                    <datalist id="member-id-options">
                      {(users.data ?? []).map(({ profile: member }) => (
                        <option key={member.id} value={member.id}>
                          {member.fullName}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="delta">Points Adjustment</Label>
                    <Input id="delta" type="number" {...adjustmentForm.register('delta', { valueAsNumber: true })} />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="reason">Reason</Label>
                    <Input id="reason" placeholder="e.g., Service recovery" {...adjustmentForm.register('reason')} />
                  </div>
                  <Button type="submit" size="lg" className="w-full rounded-full h-14" disabled={adjustRewards.isPending}>
                    {adjustRewards.isPending ? 'Processing...' : 'Adjust Points'}
                  </Button>
                </form>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10 flex items-end justify-between">
                <div>
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Active Members</span>
                  <h2 className="font-serif text-3xl text-primary">Members</h2>
                </div>
                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70 italic">Showing Latest 50</span>
              </div>

              <div className="grid gap-3 pointer-events-auto">
                {(users.data ?? []).map(({ profile: member, balance }) => (
                  <div
                    key={member.id}
                    className="group flex flex-col gap-6 rounded-2xl bg-surface-lowest p-6 transition-all hover:bg-surface-low md:flex-row md:items-center md:justify-between border border-transparent hover:border-outline-variant/10"
                  >
                    <div className="flex items-center gap-6">
                       <div className="size-14 rounded-full bg-surface-highest flex items-center justify-center font-serif text-xl text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          {member.fullName.charAt(0)}
                       </div>
                      <div>
                        <p className="font-serif text-xl tracking-tight text-primary leading-tight">{member.fullName}</p>
                        <p className="text-sm font-medium text-on-surface-variant/80">{member.email}</p>
                        <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-on-surface-variant/70 italic">
                          ID: {member.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="accent" className="bg-primary/5 text-primary border-none">{member.role}</Badge>
                      <Badge variant="accent" className="bg-secondary-container/10 text-secondary-container border-none">{balance?.points ?? 0} Points</Badge>
                      <Badge variant="accent" className="bg-tertiary/10 text-primary border-none">{member.tier}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-12 outline-none">
          <div className="grid gap-16 xl:grid-cols-[1fr_450px]">
            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Catalog</span>
                <h2 className="font-serif text-3xl text-primary">Rewards</h2>
              </div>
              <div className="grid gap-8 sm:grid-cols-2">
                {(rewards.data ?? []).map((reward) => (
                  <RewardCard key={reward.id} reward={reward} balancePoints={9999} onRedeem={() => {}} />
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Create</span>
                <h2 className="font-serif text-3xl text-primary">Add Reward</h2>
              </div>
              <div className="rounded-2xl bg-surface-low p-8 border border-outline-variant/10">
                <form
                  className="space-y-6"
                  onSubmit={rewardForm.handleSubmit(async (values) => {
                    await createReward.mutateAsync(values)
                    rewardForm.reset({
                      title: '',
                      description: '',
                      category: 'Drink',
                      pointsCost: 220,
                      highlight: '',
                    })
                  })}
                >
                  <div className="grid gap-3">
                    <Label htmlFor="reward-title">Reward Title</Label>
                    <Input id="reward-title" placeholder="e.g., Midnight Espresso" {...rewardForm.register('title')} />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="reward-description">Description</Label>
                    <Input id="reward-description" placeholder="Describe the reward..." {...rewardForm.register('description')} />
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-3">
                      <Label htmlFor="reward-category">Category</Label>
                      <Input id="reward-category" list="reward-category-options" {...rewardForm.register('category')} />
                      <datalist id="reward-category-options">
                        <option value="Drink" />
                        <option value="Pastry" />
                        <option value="Merch" />
                        <option value="Experience" />
                      </datalist>
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="reward-cost">Points Cost</Label>
                      <Input id="reward-cost" type="number" {...rewardForm.register('pointsCost', { valueAsNumber: true })} />
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="reward-highlight">Highlight Tag</Label>
                    <Input id="reward-highlight" placeholder="Seasonal / Popular / New" {...rewardForm.register('highlight')} />
                  </div>
                  <Button type="submit" size="lg" className="w-full rounded-full h-14" disabled={createReward.isPending}>
                    {createReward.isPending ? 'Creating...' : 'Add Reward'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="promotions" className="space-y-12 outline-none">
          <div className="grid gap-16 xl:grid-cols-[1fr_450px]">
            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Active</span>
                <h2 className="font-serif text-3xl text-primary">Live Promotions</h2>
              </div>
              <div className="grid gap-8">
                {(promotions.data ?? []).map((promotion) => (
                  <PromotionCard key={promotion.id} promotion={promotion} />
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Create</span>
                <h2 className="font-serif text-3xl text-primary">New Promotion</h2>
              </div>
              <div className="rounded-2xl bg-surface-low p-8 border border-outline-variant/10">
                <form
                  className="space-y-6"
                  onSubmit={promotionForm.handleSubmit(async (values) => {
                    await createPromotion.mutateAsync(values)
                    promotionForm.reset({
                      title: '',
                      description: '',
                      badge: '',
                      cta: '',
                      audience: '',
                    })
                  })}
                >
                  <div className="grid gap-3">
                    <Label htmlFor="promotion-title">Promotion Title</Label>
                    <Input id="promotion-title" {...promotionForm.register('title')} />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="promotion-description">Description</Label>
                    <Input id="promotion-description" {...promotionForm.register('description')} />
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-3">
                      <Label htmlFor="promotion-badge">Badge Label</Label>
                      <Input id="promotion-badge" placeholder="e.g., New Offer" {...promotionForm.register('badge')} />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="promotion-cta">Action Label</Label>
                      <Input id="promotion-cta" placeholder="Unlock Now" {...promotionForm.register('cta')} />
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="promotion-audience">Target Audience</Label>
                    <Input id="promotion-audience" placeholder="All / Bronze / Gold" {...promotionForm.register('audience')} />
                  </div>
                  <Button type="submit" size="lg" className="w-full rounded-full h-14" disabled={createPromotion.isPending}>
                    {createPromotion.isPending ? 'Creating...' : 'Launch Promotion'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-12 outline-none">
          <div className="grid gap-16 xl:grid-cols-2">
            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Fulfillment</span>
                <h2 className="font-serif text-3xl text-primary">Recent Redemptions</h2>
              </div>
              <div className="rounded-2xl bg-surface-low p-2 border border-outline-variant/10">
                <ScrollArea className="h-[500px] px-6">
                  <div className="space-y-4 py-6">
                    {(overview.data?.redemptions ?? []).map((redemption) => (
                      <div key={redemption.id} className="rounded-xl bg-surface-lowest p-6 border border-outline-variant/5 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <p className="font-serif text-lg tracking-tight text-primary">{redemption.rewardTitle}</p>
                            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/75 italic">{redemption.profileId}</p>
                          </div>
                          <Badge variant="accent" className="bg-success/10 text-success border-none">{redemption.status}</Badge>
                        </div>
                        <div className="mt-4 pt-4 border-t border-outline-variant/5 flex items-center justify-between">
                           <span className="text-sm font-bold text-primary">{redemption.pointsCost} Points</span>
                           <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/80">{formatDate(redemption.redeemedAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Audit Log</span>
                <h2 className="font-serif text-3xl text-primary">Admin Logs</h2>
              </div>
               <div className="rounded-2xl bg-surface-low p-2 border border-outline-variant/10">
                <ScrollArea className="h-[500px] px-6">
                  <div className="space-y-4 py-6">
                    {(overview.data?.adminLogs ?? []).map((log) => (
                      <div key={log.id} className="rounded-xl bg-surface-lowest p-6 border border-outline-variant/5 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-serif text-lg tracking-tight text-primary leading-tight">{log.action}</p>
                          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/75">{formatDate(log.createdAt)}</span>
                        </div>
                        <p className="mt-2 text-sm font-medium leading-relaxed text-on-surface-variant/85">{log.details}</p>
                        <div className="mt-4 pt-4 border-t border-outline-variant/5">
                           <span className="text-[0.65rem] font-bold uppercase tracking-widest text-primary italic">By {log.actorName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2 pb-4 border-b border-outline-variant/10 flex items-end justify-between">
              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">All Activity</span>
                <h2 className="font-serif text-3xl text-primary">Recent Activity</h2>
              </div>
              <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70 italic">Latest 6</span>
            </div>
            <ActivityList items={overview.data?.activities.slice(0, 6) ?? []} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
