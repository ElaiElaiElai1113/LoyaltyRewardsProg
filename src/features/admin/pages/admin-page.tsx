import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { TrendingUp, Users, Gift, Activity, Trash2, CheckCircle, Store } from 'lucide-react'

import { ActivityList } from '@/features/activity/components/activity-list'
import { PromotionCard } from '@/features/rewards/components/promotion-card'
import { RewardCard } from '@/features/rewards/components/reward-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  useAdjustRewards,
  useAllReferrals,
  useAdminApproveReferral,
  useAdminAllBusinesses,
  useAdminBusinesses,
  useAdminOverview,
  useAdminProducts,
  useAdminUsers,
  useAdminRejectReferral,
  useCreateProduct,
  useCreatePromotion,
  useCreateReward,
  useDeleteProduct,
  useDeletePromotion,
  useDeleteReward,
  useFulfillRedemption,
  useOrdersForVerification,
  useUpdateBusiness,
  useUseCredit,
} from '@/hooks/use-admin-data'
import { useAuth } from '@/hooks/use-auth'
import { usePromotions, useRewards } from '@/hooks/use-customer-data'
import {
  productDraftSchema,
  promotionDraftSchema,
  rewardAdjustmentSchema,
  rewardDraftSchema,
  type ProductDraftFormValues,
  type PromotionDraftFormValues,
  type RewardAdjustmentFormValues,
  type RewardDraftFormValues,
} from '@/types/forms'
import { formatCurrency, formatDate } from '@/lib/utils'

export function AdminPage() {
  const { profile } = useAuth()
  const [actionError, setActionError] = useState<string | null>(null)
  const users = useAdminUsers()
  const overview = useAdminOverview()
  const businesses = useAdminBusinesses()
  const allBusinesses = useAdminAllBusinesses()
  const allReferrals = useAllReferrals()
  const [rewardBusinessId, setRewardBusinessId] = useState('')
  const [productBusinessId, setProductBusinessId] = useState('')
  const [promotionBusinessId, setPromotionBusinessId] = useState('')
  const allRewards = useRewards()
  const rewards = useRewards(rewardBusinessId || undefined)
  const promotions = usePromotions(promotionBusinessId || undefined)
  const adminProducts = useAdminProducts(productBusinessId || undefined)
  const [editingBusinessId, setEditingBusinessId] = useState<string | null>(null)
  const [verificationBusinessId, setVerificationBusinessId] = useState('all')
  const [partnerActionError, setPartnerActionError] = useState<string | null>(null)
  const [businessPatch, setBusinessPatch] = useState({
    name: '',
    description: '',
    logoUrl: '',
  })
  
  const adjustRewards = useAdjustRewards(profile)
  const createReward = useCreateReward(profile)
  const createPromotion = useCreatePromotion(profile)
  const createProduct = useCreateProduct(profile)
  const fulfillRedemption = useFulfillRedemption(profile)
  const updateBusiness = useUpdateBusiness()
  const deleteReward = useDeleteReward(profile?.fullName)
  const deleteProduct = useDeleteProduct(profile?.fullName)
  const deletePromotion = useDeletePromotion(profile?.fullName)
  const useCredit = useUseCredit()
  const approveReferral = useAdminApproveReferral()
  const rejectReferral = useAdminRejectReferral()
  const verificationOrders = useOrdersForVerification(
    verificationBusinessId === 'all' ? undefined : verificationBusinessId,
  )

  const currentBusiness = businesses.data?.[0] ?? null
  const currentBusinessId = currentBusiness?.id ?? ''
  const availableBusinessId = allBusinesses.data?.[0]?.id ?? currentBusinessId
  const moneyFormatter = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)

  const bizColorClass = (bizId: string) => {
    return bizId === currentBusinessId
      ? 'bg-gradient-to-br from-[#8B4513] to-[#654321]'
      : 'bg-gradient-to-br from-[#5B2C6F] to-[#4A235A]'
  }

  const adjustmentForm = useForm<RewardAdjustmentFormValues>({
    resolver: zodResolver(rewardAdjustmentSchema),
    defaultValues: {
      profileId: '',
      delta: 50,
      reason: '',
    },
  })
  const customerMembers = (users.data ?? []).filter(({ profile: member }) => member.role === 'customer')
  const selectedProfileId = adjustmentForm.watch('profileId')
  const selectedMember = customerMembers.find(({ profile: member }) => member.id === selectedProfileId) ?? null

  const rewardForm = useForm<RewardDraftFormValues>({
    resolver: zodResolver(rewardDraftSchema),
    defaultValues: {
      businessId: currentBusinessId,
      title: '',
      description: '',
      category: 'Drink',
      pointsCost: 220,
      highlight: '',
    },
  })

  const productForm = useForm<ProductDraftFormValues>({
    resolver: zodResolver(productDraftSchema),
    defaultValues: {
      businessId: currentBusinessId,
      title: '',
      description: '',
      category: 'Merch',
      price: 5,
      highlight: '',
      inventory: 50,
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

  useEffect(() => {
    if (!availableBusinessId) return

    if (!rewardForm.getValues('businessId')) {
      rewardForm.setValue('businessId', availableBusinessId)
    }

    if (!productForm.getValues('businessId')) {
      productForm.setValue('businessId', availableBusinessId)
    }
  }, [availableBusinessId, productForm, rewardForm])

  useEffect(() => {
    if (!availableBusinessId) return

    if (!rewardBusinessId) {
      setRewardBusinessId(availableBusinessId)
    }

    if (!productBusinessId) {
      setProductBusinessId(availableBusinessId)
    }

    if (!promotionBusinessId) {
      setPromotionBusinessId(availableBusinessId)
    }
  }, [availableBusinessId, productBusinessId, promotionBusinessId, rewardBusinessId])

  useEffect(() => {
    if (selectedProfileId || customerMembers.length === 0) return

    adjustmentForm.setValue('profileId', customerMembers[0].profile.id, {
      shouldDirty: false,
      shouldValidate: true,
    })
  }, [adjustmentForm, customerMembers, selectedProfileId])

  const beginBusinessEdit = (business: {
    id: string
    name: string
    description: string | null
    logoUrl: string | null
  }) => {
    setPartnerActionError(null)
    setEditingBusinessId(business.id)
    setBusinessPatch({
      name: business.name,
      description: business.description ?? '',
      logoUrl: business.logoUrl ?? '',
    })
  }

  const businessNameById = new Map(
    (allBusinesses.data ?? []).map((business) => [business.id, business.name]),
  )
  const memberById = new Map(
    (users.data ?? []).map(({ profile: member }) => [member.id, member]),
  )
  const referralProfileLabel = (profileId: string, fallback: { fullName: string; email: string }) => {
    const member = memberById.get(profileId)
    return {
      fullName:
        fallback.fullName && fallback.fullName !== 'Unknown member'
          ? fallback.fullName
          : (member?.fullName ?? `Member ${profileId.slice(0, 8)}`),
      email: fallback.email || member?.email || profileId,
    }
  }

  if (profile?.role !== 'platform-admin') {
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
      {/* Enhanced Header with Gradient Accent */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-[#4b3621] to-[#33210d] px-8 py-12 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4 max-w-2xl">
              <Badge variant="accent" className="bg-white/10 text-white border border-white/20 backdrop-blur-sm">
                Operations Portal
              </Badge>
              <h1 className="font-serif text-5xl tracking-tight text-white md:text-7xl leading-[1.1]">
                Admin Dashboard
              </h1>
              <p className="text-lg leading-relaxed text-white/80 font-medium">
                Manage members, rewards, promotions, and monitor activity across the platform.
              </p>
            </div>

            {/* Enhanced Overview Cards */}
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm px-6 py-5 text-white border border-white/10 flex items-center gap-4">
                <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="size-6" />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-3xl leading-none">{(users.data ?? []).length}</span>
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white/80">Members</span>
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm px-6 py-5 text-white border border-white/10 flex items-center gap-4">
                <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Gift className="size-6" />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-3xl leading-none">{(allRewards.data ?? []).length}</span>
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white/80">Rewards</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-12">
        <div className="sticky top-0 z-40 -mx-10 bg-surface/95 px-10 py-4 backdrop-blur-md flex justify-center border-b border-outline-variant/10 shadow-sm">
          <TabsList className="w-full max-w-5xl bg-surface-low p-1.5 rounded-2xl border border-outline-variant/10">
            <TabsTrigger value="members" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Members</TabsTrigger>
            <TabsTrigger value="catalog" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Rewards</TabsTrigger>
            <TabsTrigger value="products" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Products</TabsTrigger>
            <TabsTrigger value="promotions" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Promotions</TabsTrigger>
            <TabsTrigger value="partners" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Partners</TabsTrigger>
            <TabsTrigger value="referrals" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Referrals</TabsTrigger>
            <TabsTrigger value="activity" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Activity</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="members" className="space-y-12 outline-none">
          <div className="grid gap-16 xl:grid-cols-[450px_1fr]">
            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Member Profile</span>
                <h2 className="font-serif text-3xl text-primary">Adjust XP</h2>
              </div>

              <div className="rounded-3xl bg-white border border-outline-variant/5 shadow-sm p-8 space-y-6">
                {selectedMember ? (
                  <div className="rounded-[2rem] border border-primary/10 bg-primary/[0.03] p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#4b3621] font-serif text-xl text-white shadow-lg">
                        {selectedMember.profile.fullName.charAt(0)}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="font-serif text-2xl tracking-tight text-primary">
                            {selectedMember.profile.fullName}
                          </p>
                          <p className="text-sm font-medium text-on-surface-variant/80">
                            {selectedMember.profile.email}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="accent" className="bg-secondary-container/10 text-secondary-container border border-secondary-container/20">
                            <Gift className="size-3 mr-1" />
                            {selectedMember.balance?.points ?? 0} XP
                          </Badge>
                          <Badge variant="accent" className="bg-success/10 text-success border border-success/20">
                            {selectedMember.balance?.availableCredits ?? 0} Credits
                          </Badge>
                          <Badge variant="outline" className="border-outline-variant/20">
                            Joined {formatDate(selectedMember.profile.joinedAt)}
                          </Badge>
                        </div>
                        {(selectedMember.balance?.availableCredits ?? 0) > 0 ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-full border-success/20 bg-success/5 text-success hover:bg-success/10"
                            disabled={useCredit.isPending}
                            onClick={() =>
                              useCredit.mutate({
                                profileId: selectedMember.profile.id,
                                actorName: profile?.fullName ?? 'Admin',
                              })
                            }
                          >
                            {useCredit.isPending ? 'Using...' : 'Use Credit'}
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 text-sm text-on-surface-variant/80">
                      <div className="grid gap-1">
                        <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/60">Phone</span>
                        <span>{selectedMember.profile.phone || 'Not provided'}</span>
                      </div>
                      <div className="grid gap-1">
                        <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/60">Location</span>
                        <span>{selectedMember.profile.location || 'Not provided'}</span>
                      </div>
                      <div className="grid gap-1">
                        <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/60">Favorite Order</span>
                        <span>{selectedMember.profile.favoriteOrder || 'Not provided'}</span>
                      </div>
                      <div className="grid gap-1">
                        <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/60">Member ID</span>
                        <span className="break-all">{selectedMember.profile.id}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[2rem] border border-dashed border-outline-variant/20 bg-surface-low p-6 text-sm text-on-surface-variant/75">
                    Select a member to view the profile and update XP.
                  </div>
                )}

                <form
                  className="space-y-6"
                  onSubmit={adjustmentForm.handleSubmit(
                    async (values) => {
                      try {
                        setActionError(null)
                        await adjustRewards.mutateAsync(values)
                        adjustmentForm.reset({
                          profileId: values.profileId,
                          delta: 50,
                          reason: '',
                        })
                      } catch (error) {
                        setActionError(error instanceof Error ? error.message : 'Failed to adjust XP.')
                      }
                    },
                    () => {
                      setActionError('Please fix the highlighted member adjustment fields.')
                    },
                  )}
                >
                  <div className="grid gap-4">
                    <Label htmlFor="profileId" className="text-sm font-semibold">Member</Label>
                    <Input
                      id="profileId"
                      list="member-id-options"
                      placeholder="Select from the customer list or paste a member id"
                      className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30"
                      {...adjustmentForm.register('profileId')}
                    />
                    <datalist id="member-id-options">
                      {customerMembers.map(({ profile: member }) => (
                        <option key={member.id} value={member.id}>
                          {member.fullName} • {member.email}
                        </option>
                      ))}
                    </datalist>
                    {adjustmentForm.formState.errors.profileId ? (
                      <p className="text-xs text-red-500">{adjustmentForm.formState.errors.profileId.message}</p>
                    ) : null}
                    {selectedMember ? (
                      <p className="text-xs text-on-surface-variant/70">
                        Selected: {selectedMember.profile.fullName} • Current balance: {selectedMember.balance?.points ?? 0} XP
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-4">
                    <Label htmlFor="delta" className="text-sm font-semibold">XP Adjustment</Label>
                    <Input id="delta" type="number" className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30" {...adjustmentForm.register('delta', { valueAsNumber: true })} />
                    <p className="text-xs text-on-surface-variant/70">Use a positive number to add XP and a negative number to deduct it.</p>
                    {adjustmentForm.formState.errors.delta ? (
                      <p className="text-xs text-red-500">{adjustmentForm.formState.errors.delta.message}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-4">
                    <Label htmlFor="reason" className="text-sm font-semibold">Reason</Label>
                    <Input id="reason" placeholder="e.g., Service recovery" className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30" {...adjustmentForm.register('reason')} />
                    {adjustmentForm.formState.errors.reason ? (
                      <p className="text-xs text-red-500">{adjustmentForm.formState.errors.reason.message}</p>
                    ) : null}
                  </div>
                  <Button type="submit" size="lg" className="w-full rounded-full h-14 font-semibold" disabled={adjustRewards.isPending}>
                    {adjustRewards.isPending ? 'Processing...' : 'Update XP'}
                  </Button>
                  {actionError ? <p className="text-sm font-bold text-red-500">{actionError}</p> : null}
                </form>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10 flex items-end justify-between">
                <div>
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Active Members</span>
                  <h2 className="font-serif text-3xl text-primary">Members</h2>
                </div>
                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70 italic">
                  {customerMembers.length} customers
                </span>
              </div>

              <div className="grid gap-4 pointer-events-auto">
                {customerMembers.map(({ profile: member, balance }) => (
                  <div
                    key={member.id}
                    className={`group flex flex-col gap-6 rounded-3xl bg-white p-6 transition-all hover:shadow-xl hover:scale-[1.01] md:flex-row md:items-center md:justify-between border ${
                      selectedProfileId === member.id
                        ? 'border-primary/30 shadow-lg ring-1 ring-primary/10'
                        : 'border-outline-variant/5 hover:border-primary/10'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                       <div className="size-16 rounded-2xl bg-gradient-to-br from-primary to-[#4b3621] flex items-center justify-center font-serif text-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                          {member.fullName.charAt(0)}
                       </div>
                      <div>
                        <p className="font-serif text-2xl tracking-tight text-primary leading-tight">{member.fullName}</p>
                        <p className="text-sm font-medium text-on-surface-variant/80 mt-1">{member.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-on-surface-variant/70 italic">
                            ID: {member.id}
                          </span>
                          <span className="size-1 rounded-full bg-outline-variant/30"></span>
                          <span className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-on-surface-variant/70 italic">
                            {member.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="accent" className="bg-primary/5 text-primary border border-primary/10 font-medium px-3 py-1.5">{member.role}</Badge>
                      <Badge variant="accent" className="bg-secondary-container/10 text-secondary-container border border-secondary-container/20 font-medium px-3 py-1.5 flex items-center gap-1.5">
                        <Gift className="size-3" />
                        {balance?.points ?? 0} XP
                      </Badge>
                      <Badge variant="accent" className="bg-success/10 text-success border border-success/20 font-medium px-3 py-1.5">
                        {balance?.availableCredits ?? 0} Credits
                      </Badge>
                      <Button
                        variant={selectedProfileId === member.id ? 'secondary' : 'ghost'}
                        size="sm"
                        className="rounded-full hover:bg-primary/5"
                        onClick={() => {
                          adjustmentForm.setValue('profileId', member.id, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                          setActionError(null)
                        }}
                      >
                        {selectedProfileId === member.id ? 'Selected' : 'View Profile'}
                      </Button>
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
              <div className="space-y-4 pb-4 border-b border-outline-variant/10">
                <div className="space-y-2">
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Catalog</span>
                  <h2 className="font-serif text-3xl text-primary">Rewards</h2>
                </div>
                <div className="grid gap-2 max-w-sm">
                  <Label htmlFor="reward-business-filter" className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
                    Partner
                  </Label>
                  <select
                    id="reward-business-filter"
                    value={rewardBusinessId}
                    onChange={(event) => {
                      const nextBusinessId = event.target.value
                      setRewardBusinessId(nextBusinessId)
                      rewardForm.setValue('businessId', nextBusinessId, { shouldDirty: true })
                    }}
                    className="h-12 rounded-2xl border border-outline-variant/20 bg-white px-4 text-sm text-primary shadow-sm outline-none transition focus:border-primary/30"
                  >
                    {(allBusinesses.data ?? []).map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-8 sm:grid-cols-2">
                {(rewards.data ?? []).map((reward) => (
                  <div key={reward.id} className="relative group">
                    <RewardCard reward={reward} balancePoints={9999} onRedeem={() => {}} />
                    <Badge variant="outline" className="absolute top-2 left-2 border-outline-variant/20 bg-white/90">
                      {businessNameById.get(reward.businessId) ?? 'Unknown partner'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 size-8 rounded-full text-red-500 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this reward?')) {
                          deleteReward.mutate(reward.id)
                        }
                      }}
                      disabled={deleteReward.isPending}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {!rewardBusinessId ? (
                <div className="rounded-3xl bg-white p-6 border border-outline-variant/5 shadow-sm text-on-surface-variant/70">
                  No partner is available for reward management yet.
                </div>
              ) : null}
            </div>

            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Create</span>
                <h2 className="font-serif text-3xl text-primary">Add Reward</h2>
              </div>
              <div className="rounded-2xl bg-surface-low p-8 border border-outline-variant/10">
                <form
                  className="space-y-6"
                  onSubmit={rewardForm.handleSubmit(
                    async (values) => {
                      try {
                        setActionError(null)
                        const businessId = values.businessId || rewardBusinessId || availableBusinessId
                        if (!businessId) {
                          throw new Error('No business is configured yet.')
                        }

                        await createReward.mutateAsync({ ...values, businessId })
                        setRewardBusinessId(businessId)
                        rewardForm.reset({
                          businessId,
                          title: '',
                          description: '',
                          category: 'Drink',
                          pointsCost: 220,
                          highlight: '',
                        })
                      } catch (error) {
                        setActionError(error instanceof Error ? error.message : 'Failed to create reward.')
                      }
                    },
                    () => {
                      setActionError('Please fix the highlighted reward fields.')
                    },
                  )}
                >
                  <div className="grid gap-3">
                    <Label htmlFor="reward-business">Partner</Label>
                    <select
                      id="reward-business"
                      value={rewardForm.watch('businessId') ?? ''}
                      onChange={(event) => {
                        const nextBusinessId = event.target.value
                        rewardForm.setValue('businessId', nextBusinessId, { shouldDirty: true })
                        setRewardBusinessId(nextBusinessId)
                      }}
                      className="h-12 rounded-2xl border border-outline-variant/20 bg-white px-4 text-sm text-primary shadow-sm outline-none transition focus:border-primary/30"
                    >
                      {(allBusinesses.data ?? []).map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="reward-title">Reward Title</Label>
                    <Input id="reward-title" placeholder="e.g., Midnight Espresso" {...rewardForm.register('title')} />
                    {rewardForm.formState.errors.title ? (
                      <p className="text-xs text-red-500">{rewardForm.formState.errors.title.message}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="reward-description">Description</Label>
                    <Input id="reward-description" placeholder="Describe the reward..." {...rewardForm.register('description')} />
                    {rewardForm.formState.errors.description ? (
                      <p className="text-xs text-red-500">{rewardForm.formState.errors.description.message}</p>
                    ) : null}
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
                      {rewardForm.formState.errors.category ? (
                        <p className="text-xs text-red-500">{rewardForm.formState.errors.category.message}</p>
                      ) : null}
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="reward-cost">XP Cost</Label>
                      <Input id="reward-cost" type="number" {...rewardForm.register('pointsCost', { valueAsNumber: true })} />
                      {rewardForm.formState.errors.pointsCost ? (
                        <p className="text-xs text-red-500">{rewardForm.formState.errors.pointsCost.message}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="reward-highlight">Highlight Tag</Label>
                    <Input id="reward-highlight" placeholder="Seasonal / Popular / New" {...rewardForm.register('highlight')} />
                    {rewardForm.formState.errors.highlight ? (
                      <p className="text-xs text-red-500">{rewardForm.formState.errors.highlight.message}</p>
                    ) : null}
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-full h-14"
                    disabled={createReward.isPending || allBusinesses.isLoading || !availableBusinessId}
                  >
                    {createReward.isPending ? 'Creating...' : 'Add Reward'}
                  </Button>
                  {!allBusinesses.isLoading && !availableBusinessId ? (
                    <p className="text-sm font-medium text-on-surface-variant/75">
                      Setup is incomplete. Reward creation is disabled until the site is connected to its store record.
                    </p>
                  ) : null}
                  {actionError ? <p className="text-sm font-bold text-red-500">{actionError}</p> : null}
                </form>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-12 outline-none">
          <div className="grid gap-16 xl:grid-cols-[1fr_450px]">
            <div className="space-y-8">
              <div className="space-y-4 pb-4 border-b border-outline-variant/10">
                <div className="space-y-2">
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Inventory</span>
                  <h2 className="font-serif text-3xl text-primary">Products</h2>
                </div>
                <div className="grid gap-2 max-w-sm">
                  <Label htmlFor="product-business-filter" className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
                    Partner
                  </Label>
                  <select
                    id="product-business-filter"
                    value={productBusinessId}
                    onChange={(event) => {
                      const nextBusinessId = event.target.value
                      setProductBusinessId(nextBusinessId)
                      productForm.setValue('businessId', nextBusinessId, { shouldDirty: true })
                    }}
                    className="h-12 rounded-2xl border border-outline-variant/20 bg-white px-4 text-sm text-primary shadow-sm outline-none transition focus:border-primary/30"
                  >
                    {(allBusinesses.data ?? []).map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-3">
                {(adminProducts.data ?? []).map((product) => (
                  <div
                    key={product.id}
                    className="group flex items-center justify-between rounded-3xl bg-white hover:bg-surface-low p-6 border border-outline-variant/5 hover:border-primary/10 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`size-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold ${
                        bizColorClass(product.businessId)
                      }`}>
                        {product.title.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <p className="font-serif text-xl text-primary">{product.title}</p>
                        <div className="flex items-center gap-3 text-sm text-on-surface-variant/70">
                           <span>{product.category}</span>
                           <span className="size-1 rounded-full bg-outline-variant/30"></span>
                           <span>{product.inventory} in stock</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="font-serif text-2xl text-primary">{formatCurrency(product.price)}</p>
                        <Badge variant="outline" className="text-[0.65rem] border-outline-variant/20 mt-1">
                          {businessNameById.get(product.businessId) ?? 'Unknown partner'}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this product?')) {
                            deleteProduct.mutate(product.id)
                          }
                        }}
                        disabled={deleteProduct.isPending}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {!productBusinessId ? (
                <div className="rounded-3xl bg-white p-6 border border-outline-variant/5 shadow-sm text-on-surface-variant/70">
                  No partner is available for product management yet.
                </div>
              ) : null}
            </div>

            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Create</span>
                <h2 className="font-serif text-3xl text-primary">Add Product</h2>
              </div>
              <div className="rounded-2xl bg-surface-low p-8 border border-outline-variant/10">
                <form
                  className="space-y-6"
                  onSubmit={productForm.handleSubmit(
                    async (values) => {
                      try {
                        setActionError(null)
                        const businessId = values.businessId || productBusinessId || availableBusinessId
                        if (!businessId) {
                          throw new Error('No business is configured yet.')
                        }

                        await createProduct.mutateAsync({ ...values, businessId })
                        setProductBusinessId(businessId)
                        productForm.reset({
                          businessId,
                          title: '',
                          description: '',
                          category: 'Merch',
                          price: 5,
                          highlight: '',
                          inventory: 50,
                        })
                      } catch (error) {
                        setActionError(error instanceof Error ? error.message : 'Failed to create product.')
                      }
                    },
                    () => {
                      setActionError('Please fix the highlighted product fields.')
                    },
                  )}
                >
                  <div className="grid gap-3">
                    <Label htmlFor="product-business">Partner</Label>
                    <select
                      id="product-business"
                      value={productForm.watch('businessId') ?? ''}
                      onChange={(event) => {
                        const nextBusinessId = event.target.value
                        productForm.setValue('businessId', nextBusinessId, { shouldDirty: true })
                        setProductBusinessId(nextBusinessId)
                      }}
                      className="h-12 rounded-2xl border border-outline-variant/20 bg-white px-4 text-sm text-primary shadow-sm outline-none transition focus:border-primary/30"
                    >
                      {(allBusinesses.data ?? []).map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="product-title">Product Title</Label>
                    <Input id="product-title" placeholder="e.g., House Blend" {...productForm.register('title')} />
                    {productForm.formState.errors.title ? (
                      <p className="text-xs text-red-500">{productForm.formState.errors.title.message}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="product-description">Description</Label>
                    <Input id="product-description" placeholder="Describe the product..." {...productForm.register('description')} />
                    {productForm.formState.errors.description ? (
                      <p className="text-xs text-red-500">{productForm.formState.errors.description.message}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-3">
                      <Label htmlFor="product-category">Category</Label>
                      <Input id="product-category" list="product-category-options" {...productForm.register('category')} />
                      <datalist id="product-category-options">
                        <option value="Coffee" label="Drinks" />
                        <option value="Pastry" label="Bites" />
                        <option value="Merch" label="Gear" />
                        <option value="Equipment" label="Tools" />
                      </datalist>
                      {productForm.formState.errors.category ? (
                        <p className="text-xs text-red-500">{productForm.formState.errors.category.message}</p>
                      ) : null}
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="product-price">Price ($)</Label>
                      <Input id="product-price" type="number" step="0.01" {...productForm.register('price', { valueAsNumber: true })} />
                      {productForm.formState.errors.price ? (
                        <p className="text-xs text-red-500">{productForm.formState.errors.price.message}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-3">
                      <Label htmlFor="product-highlight">Highlight Tag</Label>
                      <Input id="product-highlight" placeholder="Popular / New" {...productForm.register('highlight')} />
                      {productForm.formState.errors.highlight ? (
                        <p className="text-xs text-red-500">{productForm.formState.errors.highlight.message}</p>
                      ) : null}
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="product-inventory">Inventory</Label>
                      <Input id="product-inventory" type="number" {...productForm.register('inventory', { valueAsNumber: true })} />
                      {productForm.formState.errors.inventory ? (
                        <p className="text-xs text-red-500">{productForm.formState.errors.inventory.message}</p>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-full h-14"
                    disabled={createProduct.isPending || allBusinesses.isLoading || !availableBusinessId}
                  >
                    {createProduct.isPending ? 'Creating...' : 'Add Product'}
                  </Button>
                  {!allBusinesses.isLoading && !availableBusinessId ? (
                    <p className="text-sm font-medium text-on-surface-variant/75">
                      Setup is incomplete. Product creation is disabled until the site is connected to its store record.
                    </p>
                  ) : null}
                  {actionError ? <p className="text-sm font-bold text-red-500">{actionError}</p> : null}
                </form>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="promotions" className="space-y-12 outline-none">
          <div className="grid gap-16 xl:grid-cols-[1fr_450px]">
            <div className="space-y-8">
              <div className="space-y-4 pb-4 border-b border-outline-variant/10">
                <div className="space-y-2">
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Active</span>
                  <h2 className="font-serif text-3xl text-primary">Live Promotions</h2>
                </div>
                <div className="grid gap-2 max-w-sm">
                  <Label htmlFor="promotion-business-filter" className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
                    Partner
                  </Label>
                  <select
                    id="promotion-business-filter"
                    value={promotionBusinessId}
                    onChange={(event) => setPromotionBusinessId(event.target.value)}
                    className="h-12 rounded-2xl border border-outline-variant/20 bg-white px-4 text-sm text-primary shadow-sm outline-none transition focus:border-primary/30"
                  >
                    {(allBusinesses.data ?? []).map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-8">
                {(promotions.data ?? []).map((promotion) => (
                  <div key={promotion.id} className="relative group">
                    <PromotionCard promotion={promotion} />
                    <Badge variant="outline" className="absolute top-4 left-4 border-outline-variant/20 bg-white/90">
                      {businessNameById.get(promotion.businessId) ?? 'Unknown partner'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 size-10 rounded-full text-red-500 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this promotion?')) {
                          deletePromotion.mutate(promotion.id)
                        }
                      }}
                      disabled={deletePromotion.isPending}
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  </div>
                ))}
              </div>
              {!promotionBusinessId ? (
                <div className="rounded-3xl bg-white p-6 border border-outline-variant/5 shadow-sm text-on-surface-variant/70">
                  No partner is available for promotion management yet.
                </div>
              ) : null}
            </div>

            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Create</span>
                <h2 className="font-serif text-3xl text-primary">New Promotion</h2>
              </div>
              <div className="rounded-2xl bg-surface-low p-8 border border-outline-variant/10">
                <form
                  className="space-y-6"
                  onSubmit={promotionForm.handleSubmit(
                    async (values) => {
                      try {
                        setActionError(null)
                        const businessId = promotionBusinessId || availableBusinessId
                        if (!businessId) {
                          throw new Error('No business is configured yet.')
                        }

                        await createPromotion.mutateAsync({ ...values, businessId })
                        promotionForm.reset({
                          title: '',
                          description: '',
                          badge: '',
                          cta: '',
                          audience: '',
                        })
                      } catch (error) {
                        setActionError(error instanceof Error ? error.message : 'Failed to create promotion.')
                      }
                    },
                    () => {
                      setActionError('Please fix the highlighted promotion fields.')
                    },
                  )}
                >
                  <div className="grid gap-3">
                    <Label htmlFor="promotion-business">Partner</Label>
                    <select
                      id="promotion-business"
                      value={promotionBusinessId}
                      onChange={(event) => setPromotionBusinessId(event.target.value)}
                      className="h-12 rounded-2xl border border-outline-variant/20 bg-white px-4 text-sm text-primary shadow-sm outline-none transition focus:border-primary/30"
                    >
                      {(allBusinesses.data ?? []).map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="promotion-title">Promotion Title</Label>
                    <Input id="promotion-title" {...promotionForm.register('title')} />
                    {promotionForm.formState.errors.title ? (
                      <p className="text-xs text-red-500">{promotionForm.formState.errors.title.message}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="promotion-description">Description</Label>
                    <Input id="promotion-description" {...promotionForm.register('description')} />
                    {promotionForm.formState.errors.description ? (
                      <p className="text-xs text-red-500">{promotionForm.formState.errors.description.message}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-3">
                      <Label htmlFor="promotion-badge">Badge Label</Label>
                      <Input id="promotion-badge" placeholder="e.g., New Offer" {...promotionForm.register('badge')} />
                      {promotionForm.formState.errors.badge ? (
                        <p className="text-xs text-red-500">{promotionForm.formState.errors.badge.message}</p>
                      ) : null}
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="promotion-cta">Action Label</Label>
                      <Input id="promotion-cta" placeholder="Unlock Now" {...promotionForm.register('cta')} />
                      {promotionForm.formState.errors.cta ? (
                        <p className="text-xs text-red-500">{promotionForm.formState.errors.cta.message}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="promotion-audience">Target Audience</Label>
                    <Input id="promotion-audience" placeholder="All / Bronze / Gold" {...promotionForm.register('audience')} />
                    {promotionForm.formState.errors.audience ? (
                      <p className="text-xs text-red-500">{promotionForm.formState.errors.audience.message}</p>
                    ) : null}
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-full h-14"
                    disabled={createPromotion.isPending || allBusinesses.isLoading || !availableBusinessId}
                  >
                    {createPromotion.isPending ? 'Creating...' : 'Launch Promotion'}
                  </Button>
                  {!allBusinesses.isLoading && !availableBusinessId ? (
                    <p className="text-sm font-medium text-on-surface-variant/75">
                      Setup is incomplete. Promotion creation is disabled until the site is connected to its store record.
                    </p>
                  ) : null}
                  {actionError ? <p className="text-sm font-bold text-red-500">{actionError}</p> : null}
                </form>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="partners" className="space-y-12 outline-none">
          <div className="space-y-8">
            <div className="space-y-2 pb-4 border-b border-outline-variant/10 flex items-end justify-between">
              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Partner Network</span>
                <h2 className="font-serif text-3xl text-primary">Partner Cards</h2>
              </div>
              <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70 italic">
                {(allBusinesses.data ?? []).length} partners
              </span>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {(allBusinesses.data ?? []).map((business) => (
                <div key={business.id} className="rounded-3xl bg-white p-6 border border-outline-variant/5 shadow-sm space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {business.logoUrl ? (
                        <img
                          src={business.logoUrl}
                          alt={business.name}
                          className="size-16 rounded-2xl object-cover border border-outline-variant/10"
                        />
                      ) : (
                        <div className={`size-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${bizColorClass(business.id)}`}>
                          <Store className="size-7" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-serif text-2xl tracking-tight text-primary">{business.name}</p>
                          <Badge
                            variant="accent"
                            className={
                              business.active
                                ? 'bg-success/10 text-success border-success/20'
                                : 'bg-outline-variant/10 text-on-surface-variant border-outline-variant/15'
                            }
                          >
                            {business.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-on-surface-variant/80">
                          {business.description || 'No description provided yet.'}
                        </p>
                        <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/65">
                          {business.earnRate} pts / $1
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() =>
                        editingBusinessId === business.id
                          ? setEditingBusinessId(null)
                          : beginBusinessEdit(business)
                      }
                    >
                      {editingBusinessId === business.id ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                    <div className="rounded-2xl bg-surface-lowest p-4 border border-outline-variant/5">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/65">Members</p>
                      <p className="mt-2 font-serif text-2xl text-primary">{business.totalMembers}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-lowest p-4 border border-outline-variant/5">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/65">Revenue</p>
                      <p className="mt-2 font-serif text-2xl text-primary">{moneyFormatter(business.totalRevenue, business.currency)}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-lowest p-4 border border-outline-variant/5">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/65">XP Issued</p>
                      <p className="mt-2 font-serif text-2xl text-primary">{business.pointsIssued}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-lowest p-4 border border-outline-variant/5">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/65">Credits Outstanding</p>
                      <p className="mt-2 font-serif text-2xl text-primary">{business.creditsOutstanding}</p>
                    </div>
                  </div>

                  {editingBusinessId === business.id ? (
                    <form
                      className="space-y-4 rounded-[2rem] border border-primary/10 bg-primary/[0.03] p-6"
                      onSubmit={async (event) => {
                        event.preventDefault()
                        try {
                          setPartnerActionError(null)
                          await updateBusiness.mutateAsync({
                            id: business.id,
                            patch: {
                              name: businessPatch.name.trim(),
                              description: businessPatch.description.trim(),
                              logoUrl: businessPatch.logoUrl.trim(),
                            },
                          })
                          setEditingBusinessId(null)
                        } catch (error) {
                          setPartnerActionError(
                            error instanceof Error ? error.message : 'Failed to update partner info.',
                          )
                        }
                      }}
                    >
                      <div className="grid gap-3">
                        <Label htmlFor={`business-name-${business.id}`}>Name</Label>
                        <Input
                          id={`business-name-${business.id}`}
                          value={businessPatch.name}
                          onChange={(event) =>
                            setBusinessPatch((current) => ({ ...current, name: event.target.value }))
                          }
                        />
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor={`business-description-${business.id}`}>Description</Label>
                        <Textarea
                          id={`business-description-${business.id}`}
                          value={businessPatch.description}
                          onChange={(event) =>
                            setBusinessPatch((current) => ({ ...current, description: event.target.value }))
                          }
                        />
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor={`business-logo-${business.id}`}>Logo URL</Label>
                        <Input
                          id={`business-logo-${business.id}`}
                          value={businessPatch.logoUrl}
                          onChange={(event) =>
                            setBusinessPatch((current) => ({ ...current, logoUrl: event.target.value }))
                          }
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button type="submit" className="rounded-full" disabled={updateBusiness.isPending}>
                          {updateBusiness.isPending ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => setEditingBusinessId(null)}
                          disabled={updateBusiness.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                      {partnerActionError ? (
                        <p className="text-sm font-bold text-red-500">{partnerActionError}</p>
                      ) : null}
                    </form>
                  ) : null}
                </div>
              ))}
            </div>

            {allBusinesses.isLoading ? (
              <div className="rounded-3xl bg-white p-8 border border-outline-variant/5 shadow-sm text-on-surface-variant/70">
                Loading partner metrics...
              </div>
            ) : null}

            {!allBusinesses.isLoading && (allBusinesses.data?.length ?? 0) === 0 ? (
              <div className="rounded-3xl bg-white p-8 border border-outline-variant/5 shadow-sm text-on-surface-variant/70">
                No partners are available yet.
              </div>
            ) : null}
          </div>

          <div className="space-y-8">
            <div className="space-y-2 pb-4 border-b border-outline-variant/10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Audit</span>
                <h2 className="font-serif text-3xl text-primary">Credit Verification — Recent Orders</h2>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="verification-business" className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
                  Filter Partner
                </Label>
                <select
                  id="verification-business"
                  value={verificationBusinessId}
                  onChange={(event) => setVerificationBusinessId(event.target.value)}
                  className="h-12 min-w-56 rounded-2xl border border-outline-variant/20 bg-white px-4 text-sm text-primary shadow-sm outline-none transition focus:border-primary/30"
                >
                  <option value="all">All Partners</option>
                  {(allBusinesses.data ?? []).map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-outline-variant/5 shadow-sm overflow-hidden">
              <ScrollArea className="h-[520px]">
                <div className="min-w-[900px]">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-lowest text-left">
                      <tr className="border-b border-outline-variant/10">
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Date</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Partner</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Member ID</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Order Total</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Expected Pts</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Awarded Pts</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(verificationOrders.data ?? []).map((order) => {
                        const partnerCurrency =
                          allBusinesses.data?.find((business) => business.id === order.businessId)?.currency ?? 'USD'

                        return (
                          <tr key={order.id} className="border-b border-outline-variant/5 bg-white">
                            <td className="px-6 py-4 text-on-surface-variant/85">{formatDate(order.createdAt)}</td>
                            <td className="px-6 py-4 font-semibold text-primary">{order.businessName}</td>
                            <td className="px-6 py-4 font-mono text-xs text-on-surface-variant/85">{order.profileId}</td>
                            <td className="px-6 py-4 text-on-surface-variant/85">
                              {moneyFormatter(order.total, partnerCurrency)}
                            </td>
                            <td className="px-6 py-4 font-semibold text-primary">{order.expectedPoints}</td>
                            <td className="px-6 py-4 font-semibold text-primary">{order.pointsEarned}</td>
                            <td className="px-6 py-4">
                              <Badge
                                variant="accent"
                                className={
                                  order.mismatch
                                    ? 'bg-red-50 text-red-600 border-red-200'
                                    : 'bg-success/10 text-success border-success/20'
                                }
                              >
                                {order.mismatch ? 'Mismatch' : 'Match'}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {verificationOrders.isLoading ? (
                    <div className="px-6 py-8 text-on-surface-variant/70">Loading recent orders...</div>
                  ) : null}

                  {!verificationOrders.isLoading && (verificationOrders.data?.length ?? 0) === 0 ? (
                    <div className="px-6 py-8 text-on-surface-variant/70">No orders found for this filter.</div>
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-12 outline-none">
          <div className="space-y-8">
            <div className="space-y-2 pb-4 border-b border-outline-variant/10 flex items-end justify-between">
              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Referral Program</span>
                <h2 className="font-serif text-3xl text-primary">Referrals</h2>
              </div>
              <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70 italic">
                {(allReferrals.data ?? []).length} records
              </span>
            </div>

            <div className="rounded-3xl bg-white border border-outline-variant/5 shadow-sm overflow-hidden">
              <ScrollArea className="h-[620px]">
                <div className="min-w-[760px]">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-lowest text-left">
                      <tr className="border-b border-outline-variant/10">
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Date</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Referrer</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Referee</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Status</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-[0.16em] text-[0.65rem] text-on-surface-variant/70">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(allReferrals.data ?? []).map((referral) => {
                        const referrer = referralProfileLabel(referral.referrerId, referral.referrer)
                        const referee = referralProfileLabel(referral.refereeId, referral.referee)

                        return (
                        <tr key={referral.id} className="border-b border-outline-variant/5 bg-white">
                          <td className="px-6 py-4 text-on-surface-variant/85">{formatDate(referral.createdAt)}</td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-primary">{referrer.fullName}</p>
                            <p className="text-xs text-on-surface-variant/75">{referrer.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-primary">{referee.fullName}</p>
                            <p className="text-xs text-on-surface-variant/75">{referee.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant="accent"
                              className={
                                referral.status === 'approved'
                                  ? 'bg-success/10 text-success border-success/20'
                                  : referral.status === 'rejected'
                                    ? 'bg-red-50 text-red-600 border-red-200'
                                    : 'bg-warning/10 text-warning border-warning/20'
                              }
                            >
                              {referral.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {referral.status === 'pending' ? (
                              <div className="flex flex-wrap items-center gap-2">
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
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-on-surface-variant/60">No action</span>
                            )}
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {allReferrals.isLoading ? (
                    <div className="px-6 py-8 text-on-surface-variant/70">Loading referrals...</div>
                  ) : null}

                  {!allReferrals.isLoading && (allReferrals.data?.length ?? 0) === 0 ? (
                    <div className="px-6 py-8 text-on-surface-variant/70">No referrals found.</div>
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-12 outline-none">
          <div className="grid gap-16 xl:grid-cols-2">
            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Fulfillment</span>
                <h2 className="font-serif text-3xl text-primary">Fulfillment Queue</h2>
              </div>
              <div className="rounded-3xl bg-white border border-outline-variant/5 shadow-sm overflow-hidden">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2 p-4">
                    {(overview.data?.redemptions ?? []).map((redemption) => (
                      <div key={redemption.id} className="rounded-2xl bg-surface-lowest hover:bg-surface-low p-5 border border-outline-variant/5 hover:border-outline-variant/10 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="size-12 rounded-xl bg-tertiary/30 flex items-center justify-center text-primary shrink-0">
                              <Gift className="size-5" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-serif text-xl tracking-tight text-primary">{redemption.rewardTitle}</p>
                              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/75 italic">
                                Member ID: {redemption.profileId.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <Badge variant={redemption.status === 'ready' ? 'outline' : 'accent'} className={
                              redemption.status === 'ready'
                                ? 'border-warning/50 text-warning bg-warning/10'
                                : 'bg-success/10 text-success border-success/20'
                            }>
                              {redemption.status}
                            </Badge>
                            {redemption.status === 'ready' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full bg-success/5 text-success hover:bg-success/10 border-success/20 h-8 px-3"
                                onClick={() => fulfillRedemption.mutate(redemption.id)}
                                disabled={fulfillRedemption.isPending}
                              >
                                <CheckCircle className="size-4 mr-1.5" />
                                Fulfill
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-outline-variant/5 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <TrendingUp className="size-4 text-secondary" />
                             <span className="text-sm font-bold text-primary">{redemption.pointsCost} XP</span>
                           </div>
                           <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/80 flex items-center gap-1">
                             {formatDate(redemption.redeemedAt)}
                           </span>
                        </div>
                      </div>
                    ))}
                    {(overview.data?.redemptions?.length ?? 0) === 0 && (
                      <div className="text-center py-12">
                        <Gift className="size-12 text-on-surface-variant/20 mx-auto mb-4" />
                        <p className="text-on-surface-variant/60 font-medium">No redemptions yet</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Audit Log</span>
                <h2 className="font-serif text-3xl text-primary">Admin Logs</h2>
              </div>
               <div className="rounded-3xl bg-white border border-outline-variant/5 shadow-sm overflow-hidden">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2 p-4">
                    {(overview.data?.adminLogs ?? []).map((log) => (
                      <div key={log.id} className="rounded-2xl bg-surface-lowest hover:bg-surface-low p-5 border border-outline-variant/5 hover:border-outline-variant/10 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <Activity className="size-5" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-serif text-lg tracking-tight text-primary leading-tight">{log.action}</p>
                              <p className="text-sm font-medium leading-relaxed text-on-surface-variant/85 mt-2">{log.details}</p>
                            </div>
                          </div>
                          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/75 whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-outline-variant/5">
                           <div className="flex items-center gap-2">
                             <span className="text-[0.65rem] font-bold uppercase tracking-widest text-primary italic">By {log.actorName}</span>
                           </div>
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
