import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { TrendingUp, Users, Gift, Activity, Trash2, CheckCircle, Store, Package, Sparkles, Hotel } from 'lucide-react'
import { toast } from 'sonner'

import { ActivityList } from '@/features/activity/components/activity-list'
import { PromotionCard } from '@/features/rewards/components/promotion-card'
import { RewardCard } from '@/features/rewards/components/reward-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  OwnerNotFoundError,
  StaffNotFoundError,
  useAdjustRewards,
  useAllReferrals,
  useAdminApproveReferral,
  useAdminAllBusinesses,
  useAdminBusinesses,
  useAdminOverview,
  useAdminPartnerPerformance,
  useAdminPartnerReferrals,
  useAdminProducts,
  useAdminUsers,
  useAdminRejectReferral,
  useAssignBusinessOwner,
  useAssignBusinessStaff,
  useCreateBusiness,
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
import { useLanguage } from '@/lib/language'
import {
  assignBusinessOwnerSchema,
  createBusinessSchema,
  productDraftSchema,
  promotionDraftSchema,
  rewardAdjustmentSchema,
  rewardDraftSchema,
  type AssignBusinessOwnerFormValues,
  type CreateBusinessFormValues,
  type ProductDraftFormValues,
  type PromotionDraftFormValues,
  type RewardAdjustmentFormValues,
  type RewardDraftFormValues,
} from '@/types/forms'
import { formatCurrency, formatDate } from '@/lib/utils'

function slugifyBusinessName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function isUniqueSlugError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
}

export function AdminPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [actionError, setActionError] = useState<string | null>(null)
  const users = useAdminUsers()
  const overview = useAdminOverview()
  const businesses = useAdminBusinesses()
  const allBusinesses = useAdminAllBusinesses()
  const allReferrals = useAllReferrals()
  const partnerPerformance = useAdminPartnerPerformance()
  const partnerReferrals = useAdminPartnerReferrals()
  const [rewardBusinessId, setRewardBusinessId] = useState('')
  const [productBusinessId, setProductBusinessId] = useState('')
  const [promotionBusinessId, setPromotionBusinessId] = useState('')
  const allRewards = useRewards()
  const rewards = useRewards(rewardBusinessId || undefined)
  const promotions = usePromotions(promotionBusinessId || undefined)
  const adminProducts = useAdminProducts(productBusinessId || undefined)
  const [editingBusinessId, setEditingBusinessId] = useState<string | null>(null)
  const [verificationBusinessId, setVerificationBusinessId] = useState('all')
  const [createBusinessError, setCreateBusinessError] = useState<string | null>(null)
  const [partnerActionError, setPartnerActionError] = useState<string | null>(null)
  const [businessAccessDialog, setBusinessAccessDialog] = useState<{
    businessId: string
    role: 'business-owner' | 'business-staff'
  } | null>(null)
  const [isCreateSlugManual, setIsCreateSlugManual] = useState(false)
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
  const createBusiness = useCreateBusiness()
  const assignBusinessOwner = useAssignBusinessOwner()
  const assignBusinessOwnerFromList = useAssignBusinessOwner()
  const assignBusinessStaffFromList = useAssignBusinessStaff()
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
      ? 'bg-gradient-to-br from-primary to-primary-container'
      : 'bg-gradient-to-br from-tertiary to-primary-container'
  }
  const adminNativeSelectClass =
    'h-12 rounded-2xl border border-outline-variant/20 bg-surface-highest px-4 text-sm font-medium text-on-surface shadow-sm outline-none transition focus:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/15'
  const adminTextareaClass =
    'min-h-28 rounded-2xl border-outline-variant/20 bg-surface-highest text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/15'

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

  const createBusinessForm = useForm<CreateBusinessFormValues>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      logoUrl: '',
      earnRate: 1,
      taxRate: 0,
      currency: 'USD',
      active: true,
      ownerEmail: '',
    },
  })

  const assignOwnerForm = useForm<AssignBusinessOwnerFormValues>({
    resolver: zodResolver(assignBusinessOwnerSchema),
    defaultValues: {
      email: '',
    },
  })
  const createBusinessName = createBusinessForm.watch('name')

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

  useEffect(() => {
    if (isCreateSlugManual) return

    createBusinessForm.setValue('slug', slugifyBusinessName(createBusinessName), {
      shouldDirty: false,
      shouldValidate: true,
    })
  }, [createBusinessForm, createBusinessName, isCreateSlugManual])

  useEffect(() => {
    if (!businessAccessDialog) {
      assignOwnerForm.reset({ email: '' })
    }
  }, [businessAccessDialog, assignOwnerForm])

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
  const accessDialogBusiness =
    allBusinesses.data?.find((business) => business.id === businessAccessDialog?.businessId) ?? null
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
          {t('Staff Authentication Required')}
        </Badge>
        <div className="space-y-4 max-w-2xl">
          <h1 className="font-serif text-5xl tracking-tight text-primary leading-tight">
            {t('Admin access requires staff credentials.')}
          </h1>
          <p className="text-lg font-medium leading-relaxed text-on-surface-variant/85">
            {t('Please use the staff demo credentials or sign in with a verified admin account to manage rewards, promotions, and member data.')}
          </p>
        </div>
        <Button
          variant="tertiary"
          size="lg"
          onClick={() => window.location.href = '/'}
          className="rounded-full px-12"
        >
          {t('Return to Home')}
        </Button>
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-10 pb-20 xl:space-y-16">
      {/* Enhanced Header with Gradient Accent */}
      <div className="warm-hero-muted relative min-w-0 overflow-hidden rounded-[2rem] px-5 py-8 shadow-2xl sm:px-6 xl:px-8 xl:py-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative">
          <div className="flex min-w-0 flex-col gap-6 2xl:flex-row 2xl:items-end 2xl:justify-between">
            <div className="max-w-2xl min-w-0 space-y-4">
              <Badge variant="accent" className="bg-white/10 text-white border border-white/20 ">
                {t('Operations Portal')}
              </Badge>
              <h1 className="font-serif text-[clamp(3rem,6vw,5rem)] tracking-tight text-white leading-[1.1]">
                {t('Admin Dashboard')}
              </h1>
              <p className="text-lg leading-relaxed text-white/80 font-medium">
                {t('Manage members, rewards, promotions, and monitor activity across the platform.')}
              </p>
            </div>

            {/* Enhanced Overview Cards */}
            <div className="grid w-full min-w-0 gap-3 sm:grid-cols-2 2xl:w-auto 2xl:gap-4">
              <div className="min-w-0 rounded-2xl bg-white/10 px-4 py-4 text-white border border-white/10 flex items-center gap-3 xl:px-6 xl:py-5 xl:gap-4">
                <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="size-6" />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-3xl leading-none">{(users.data ?? []).length}</span>
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white/80">{t('Members')}</span>
                </div>
              </div>
              <div className="min-w-0 rounded-2xl bg-white/10 px-4 py-4 text-white border border-white/10 flex items-center gap-3 xl:px-6 xl:py-5 xl:gap-4">
                <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Gift className="size-6" />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-3xl leading-none">{(allRewards.data ?? []).length}</span>
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white/80">{t('Rewards')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="members" className="min-w-0 space-y-12">
        <div className="fixed left-3 top-24 z-50 w-14 xl:left-4 xl:w-64">
          <TabsList className="flex h-auto w-full flex-col items-stretch gap-1 rounded-[1rem] border-0 bg-transparent p-0 shadow-none backdrop-blur-none">
            <TabsTrigger value="members" title={t('Members')} className="min-w-0 justify-center rounded-[0.9rem] px-0 py-2 text-xs text-[var(--muted-foreground)] shadow-none data-[state=active]:bg-[var(--muted)] data-[state=active]:text-[var(--foreground)] xl:justify-start xl:px-3">
              <Users className="size-5 xl:mr-3" /><span className="hidden xl:inline">{t('Members')}</span>
            </TabsTrigger>
            <TabsTrigger value="catalog" title={t('Rewards')} className="min-w-0 justify-center rounded-[0.9rem] px-0 py-2 text-xs text-[var(--muted-foreground)] shadow-none data-[state=active]:bg-[var(--muted)] data-[state=active]:text-[var(--foreground)] xl:justify-start xl:px-3">
              <Gift className="size-5 xl:mr-3" /><span className="hidden xl:inline">{t('Rewards')}</span>
            </TabsTrigger>
            <TabsTrigger value="products" title={t('Products')} className="min-w-0 justify-center rounded-[0.9rem] px-0 py-2 text-xs text-[var(--muted-foreground)] shadow-none data-[state=active]:bg-[var(--muted)] data-[state=active]:text-[var(--foreground)] xl:justify-start xl:px-3">
              <Package className="size-5 xl:mr-3" /><span className="hidden xl:inline">{t('Products')}</span>
            </TabsTrigger>
            <TabsTrigger value="promotions" title={t('Promotions')} className="min-w-0 justify-center rounded-[0.9rem] px-0 py-2 text-xs text-[var(--muted-foreground)] shadow-none data-[state=active]:bg-[var(--muted)] data-[state=active]:text-[var(--foreground)] xl:justify-start xl:px-3">
              <Sparkles className="size-5 xl:mr-3" /><span className="hidden xl:inline">{t('Promotions')}</span>
            </TabsTrigger>
            <TabsTrigger value="partners" title={t('Partners')} className="min-w-0 justify-center rounded-[0.9rem] px-0 py-2 text-xs text-[var(--muted-foreground)] shadow-none data-[state=active]:bg-[var(--muted)] data-[state=active]:text-[var(--foreground)] xl:justify-start xl:px-3">
              <Hotel className="size-5 xl:mr-3" /><span className="hidden xl:inline">{t('Partners')}</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" title={t('Referrals')} className="min-w-0 justify-center rounded-[0.9rem] px-0 py-2 text-xs text-[var(--muted-foreground)] shadow-none data-[state=active]:bg-[var(--muted)] data-[state=active]:text-[var(--foreground)] xl:justify-start xl:px-3">
              <TrendingUp className="size-5 xl:mr-3" /><span className="hidden xl:inline">{t('Referrals')}</span>
            </TabsTrigger>
            <TabsTrigger value="activity" title={t('Activity')} className="min-w-0 justify-center rounded-[0.9rem] px-0 py-2 text-xs text-[var(--muted-foreground)] shadow-none data-[state=active]:bg-[var(--muted)] data-[state=active]:text-[var(--foreground)] xl:justify-start xl:px-3">
              <Activity className="size-5 xl:mr-3" /><span className="hidden xl:inline">{t('Activity')}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="members" className="space-y-12 outline-none">
          <div className="grid min-w-0 gap-8 2xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">{t('Member Profile')}</span>
                <h2 className="font-serif text-3xl text-primary">{t('Adjust Points')}</h2>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-card text-card-foreground shadow-sm rounded-[2rem] p-5 space-y-6 xl:p-8">
                {selectedMember ? (
                  <div className="rounded-[2rem] border border-primary-container/15 bg-[var(--muted)] p-5 shadow-sm sm:p-6">
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-container font-serif text-xl text-primary-foreground shadow-lg">
                        {selectedMember.profile.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0 space-y-2">
                        <div>
                          <p className="font-serif text-2xl tracking-tight text-primary">
                            {selectedMember.profile.fullName}
                          </p>
                          <p className="break-all text-sm font-medium text-on-surface-variant/90">
                            {selectedMember.profile.email}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="accent" className="border-primary/25 bg-primary/12 text-primary">
                            <Gift className="size-3 mr-1" />
                            {selectedMember.balance?.points ?? 0} {t('points')}
                          </Badge>
                          <Badge variant="accent" className="border-primary-container/25 bg-primary-container/15 text-primary">
                            {selectedMember.balance?.availableCredits ?? 0} {t('Reward Credits')}
                          </Badge>
                          <Badge variant="outline" className="border-primary-container/20 bg-[var(--card)] text-on-surface-variant">
                            {t('Joined')} {formatDate(selectedMember.profile.joinedAt)}
                          </Badge>
                        </div>
                        {(selectedMember.balance?.availableCredits ?? 0) > 0 ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-full border-success/25 bg-success/10 text-success hover:bg-success/15"
                            disabled={useCredit.isPending}
                            onClick={() =>
                              useCredit.mutate({
                                profileId: selectedMember.profile.id,
                                actorName: profile?.fullName ?? 'Admin',
                              })
                            }
                          >
                            {useCredit.isPending ? t('Using...') : t('Use Reward Credit')}
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 text-sm text-on-surface-variant/90">
                      <div className="grid gap-1">
                        <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">{t('Phone')}</span>
                        <span>{selectedMember.profile.phone || t('Not provided')}</span>
                      </div>
                      <div className="grid gap-1">
                        <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">{t('Location')}</span>
                        <span>{selectedMember.profile.location || t('Not provided')}</span>
                      </div>
                      <div className="grid gap-1">
                        <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">{t('Favorite Order')}</span>
                        <span>{selectedMember.profile.favoriteOrder || t('Not provided')}</span>
                      </div>
                      <div className="grid gap-1">
                        <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">{t('Member ID')}</span>
                        <span className="break-all">{selectedMember.profile.id}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[2rem] border border-dashed border-primary-container/20 bg-[var(--muted)] p-6 text-sm text-on-surface-variant/85">
                    {t('Select a member to view the profile and update points.')}
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
                        setActionError(error instanceof Error ? error.message : t('Failed to adjust points.'))
                      }
                    },
                    () => {
                      setActionError(t('Please fix the highlighted member adjustment fields.'))
                    },
                  )}
                >
                  <div className="grid gap-4">
                    <Label htmlFor="profileId" className="text-sm font-semibold">{t('Member')}</Label>
                    <Input
                      id="profileId"
                      list="member-id-options"
                      placeholder={t('Select from the customer list or paste a member id')}
                      className="h-12 rounded-2xl border border-primary-container/15 bg-[var(--card)] text-primary placeholder:text-on-surface-variant/55 focus-visible:ring-primary-container/25"
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
                      <p className="text-xs text-on-surface-variant/80">
                        {t('Selected')}: {selectedMember.profile.fullName} - {t('Current balance')}: {selectedMember.balance?.points ?? 0} {t('points')}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-4">
                    <Label htmlFor="delta" className="text-sm font-semibold">{t('Points Adjustment')}</Label>
                    <Input id="delta" type="number" className="h-12 rounded-2xl border border-primary-container/15 bg-[var(--card)] text-primary focus-visible:ring-primary-container/25" {...adjustmentForm.register('delta', { valueAsNumber: true })} />
                    <p className="text-xs text-on-surface-variant/80">{t('Use a positive number to add points and a negative number to deduct them.')}</p>
                    {adjustmentForm.formState.errors.delta ? (
                      <p className="text-xs text-red-500">{adjustmentForm.formState.errors.delta.message}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-4">
                    <Label htmlFor="reason" className="text-sm font-semibold">{t('Reason')}</Label>
                    <Input id="reason" placeholder={t('e.g., Service recovery')} className="h-12 rounded-2xl border border-primary-container/15 bg-[var(--card)] text-primary placeholder:text-on-surface-variant/55 focus-visible:ring-primary-container/25" {...adjustmentForm.register('reason')} />
                    {adjustmentForm.formState.errors.reason ? (
                      <p className="text-xs text-red-500">{adjustmentForm.formState.errors.reason.message}</p>
                    ) : null}
                  </div>
                  <Button type="submit" size="lg" variant="secondary" className="h-14 w-full rounded-full font-semibold" disabled={adjustRewards.isPending}>
                    {adjustRewards.isPending ? t('Processing...') : t('Update Points')}
                  </Button>
                  {actionError ? <p className="text-sm font-bold text-red-500">{actionError}</p> : null}
                </form>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">{t('Active Members')}</span>
                  <h2 className="font-serif text-3xl text-primary">{t('Members')}</h2>
                </div>
                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/70 italic">
                  {customerMembers.length} {t('customers')}
                </span>
              </div>

              <div className="grid min-w-0 gap-4 pointer-events-auto">
                {customerMembers.map(({ profile: member, balance }) => (
                  <div
                    key={member.id}
                    className={`rounded-xl border border-[var(--border)] bg-card text-card-foreground shadow-sm group flex min-w-0 flex-col gap-5 rounded-[2rem] p-5 transition-all sm:p-6 xl:flex-row xl:items-center xl:justify-between ${
                      selectedProfileId === member.id
                        ? 'border-primary-container/35 bg-primary-container/[0.08] shadow-sm'
                        : 'hover:border-primary-container/35 hover:bg-[var(--muted)] hover:shadow-sm'
                    }`}
                  >
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                       <div className="size-14 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center font-serif text-2xl text-primary-foreground shadow-lg transition-transform group-hover:scale-105 sm:size-16">
                          {member.fullName.charAt(0)}
                       </div>
                      <div className="min-w-0">
                        <p className="font-serif text-2xl tracking-tight text-primary leading-tight">{member.fullName}</p>
                        <p className="mt-1 break-all text-sm font-medium text-on-surface-variant/90">{member.email}</p>
                        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="break-all text-[0.6rem] font-bold uppercase tracking-[0.15em] text-on-surface-variant/75 italic">
                            ID: {member.id}
                          </span>
                          <span className="size-1 rounded-full bg-outline-variant/30"></span>
                          <span className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-on-surface-variant/75 italic">
                            {member.location || t('Unknown')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 xl:w-auto xl:justify-end">
                      <Badge variant="accent" className="border-primary-container/25 bg-primary-container/12 px-3 py-1.5 font-semibold text-primary">{member.role}</Badge>
                      <Badge variant="accent" className="flex items-center gap-1.5 border-primary/25 bg-primary/12 px-3 py-1.5 font-semibold text-primary">
                        <Gift className="size-3" />
                        {balance?.points ?? 0} {t('points')}
                      </Badge>
                      <Badge variant="accent" className="border-primary-container/25 bg-primary-container/15 px-3 py-1.5 font-semibold text-primary">
                        {balance?.availableCredits ?? 0} {t('Reward Credits')}
                      </Badge>
                      <Button
                        variant={selectedProfileId === member.id ? 'default' : 'outline'}
                        size="sm"
                        className={
                          selectedProfileId === member.id
                            ? 'rounded-full'
                            : 'rounded-full border-primary-container/30 bg-[var(--card)] text-primary hover:border-primary-container/60 hover:bg-primary-container/10 hover:text-primary'
                        }
                        onClick={() => {
                          adjustmentForm.setValue('profileId', member.id, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                          setActionError(null)
                        }}
                      >
                        {selectedProfileId === member.id ? t('Selected') : t('View Profile')}
                      </Button>
                    </div>
                  </div>
                ))}
                {customerMembers.length === 0 ? (
                  <EmptyState
                    icon={<Users className="size-8" />}
                    title={t('No customers yet')}
                    description={t('Customer accounts will appear here after signup.')}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-12 outline-none">
          <div className="grid min-w-0 gap-8 2xl:grid-cols-[minmax(0,1fr)_420px]">
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
                    className={adminNativeSelectClass}
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
                {!rewards.isLoading && (rewards.data ?? []).length === 0 ? (
                  <EmptyState
                    className="col-span-full"
                    icon={<Gift className="size-8" />}
                    title={t('No rewards yet')}
                    description={t('Create a reward for the selected partner.')}
                  />
                ) : null}
              </div>
              {!rewardBusinessId ? (
                <div className="rounded-3xl bg-card p-6 border border-outline-variant/20 shadow-sm text-on-surface-variant">
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
                      className={adminNativeSelectClass}
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
                      <Label htmlFor="reward-cost">{t('Points Cost')}</Label>
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
          <div className="grid min-w-0 gap-8 2xl:grid-cols-[minmax(0,1fr)_420px]">
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
                    className={adminNativeSelectClass}
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
                    className="group flex items-center justify-between rounded-3xl bg-card hover:bg-surface-low p-6 border border-outline-variant/20 hover:border-primary/30 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`size-14 rounded-2xl flex items-center justify-center text-primary-foreground text-lg font-bold ${
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
                {!adminProducts.isLoading && (adminProducts.data ?? []).length === 0 ? (
                  <EmptyState
                    icon={<Store className="size-8" />}
                    title={t('No products yet')}
                    description={t('Create a product for the selected partner.')}
                  />
                ) : null}
              </div>
              {!productBusinessId ? (
                <div className="rounded-3xl bg-card p-6 border border-outline-variant/20 shadow-sm text-on-surface-variant">
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
                      className={adminNativeSelectClass}
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
          <div className="grid min-w-0 gap-8 2xl:grid-cols-[minmax(0,1fr)_420px]">
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
                    className={adminNativeSelectClass}
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
                {!promotions.isLoading && (promotions.data ?? []).length === 0 ? (
                  <EmptyState
                    icon={<TrendingUp className="size-8" />}
                    title={t('No promotions yet')}
                    description={t('Create a promotion for the selected partner.')}
                  />
                ) : null}
              </div>
              {!promotionBusinessId ? (
                <div className="rounded-3xl bg-card p-6 border border-outline-variant/20 shadow-sm text-on-surface-variant">
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
                      className={adminNativeSelectClass}
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
                    <Input
                      id="promotion-title"
                      className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30"
                      placeholder="Weekend espresso flight"
                      {...promotionForm.register('title')}
                    />
                    {promotionForm.formState.errors.title ? (
                      <p className="text-xs text-red-500">{promotionForm.formState.errors.title.message}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="promotion-description">Description</Label>
                    <Textarea
                      id="promotion-description"
                      className={adminTextareaClass}
                      placeholder="Offer a limited-time bundle, perk, or campaign members can redeem this week."
                      {...promotionForm.register('description')}
                    />
                    {promotionForm.formState.errors.description ? (
                      <p className="text-xs text-red-500">{promotionForm.formState.errors.description.message}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-3">
                      <Label htmlFor="promotion-badge">Badge Label</Label>
                      <Input
                        id="promotion-badge"
                        className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30"
                        placeholder="e.g., New Offer"
                        {...promotionForm.register('badge')}
                      />
                      {promotionForm.formState.errors.badge ? (
                        <p className="text-xs text-red-500">{promotionForm.formState.errors.badge.message}</p>
                      ) : null}
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="promotion-cta">Action Label</Label>
                      <Input
                        id="promotion-cta"
                        className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30"
                        placeholder="Redeem Now"
                        {...promotionForm.register('cta')}
                      />
                      {promotionForm.formState.errors.cta ? (
                        <p className="text-xs text-red-500">{promotionForm.formState.errors.cta.message}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="promotion-audience">Target Audience</Label>
                    <Input
                      id="promotion-audience"
                      className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30"
                      placeholder="All / Bronze / Gold"
                      {...promotionForm.register('audience')}
                    />
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
          <div className="grid min-w-0 gap-8 2xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Partner Setup</span>
                <h2 className="font-serif text-3xl text-primary">Create Business</h2>
              </div>

              <div className="rounded-3xl border border-primary-container/20 bg-[var(--card)] p-8 shadow-card  space-y-6">
                <div className="rounded-[2rem] border border-primary-container/20 bg-primary-container/10 p-5">
                  <p className="text-sm font-semibold text-on-surface">Create a business and assign its owner in one flow.</p>
                  <p className="mt-2 text-sm text-on-surface-variant/80">
                    If the owner email is missing, the business will still be created and you can finish setup from the partner card.
                  </p>
                </div>

                <form
                  className="space-y-5"
                  onSubmit={createBusinessForm.handleSubmit(
                    async (values) => {
                      try {
                        setCreateBusinessError(null)
                        const business = await createBusiness.mutateAsync(values)

                        try {
                          await assignBusinessOwner.mutateAsync({
                            email: values.ownerEmail,
                            businessId: business.id as string,
                          })

                          createBusinessForm.reset({
                            name: '',
                            slug: '',
                            description: '',
                            logoUrl: '',
                            earnRate: 1,
                            taxRate: 0,
                            currency: 'USD',
                            active: true,
                            ownerEmail: '',
                          })
                          setIsCreateSlugManual(false)
                          toast.success('Business created and owner assigned.')
                        } catch (ownerError) {
                          if (ownerError instanceof OwnerNotFoundError) {
                            toast.warning('Business created, but the owner email was not found. Use Assign Owner on the new partner card to finish setup.')
                          } else {
                            toast.warning('Business created, but owner assignment failed. Use Assign Owner on the new partner card to retry.')
                          }
                        }
                      } catch (error) {
                        if (isUniqueSlugError(error)) {
                          createBusinessForm.setError('slug', {
                            type: 'server',
                            message: 'That slug is already in use. Choose a different one.',
                          })
                          return
                        }

                        setCreateBusinessError(
                          error instanceof Error ? error.message : 'Failed to create business.',
                        )
                      }
                    },
                    () => {
                      setCreateBusinessError('Please fix the highlighted business fields.')
                    },
                  )}
                >
                  <div className="grid gap-3">
                    <Label htmlFor="create-business-name">Name</Label>
                    <Input
                      id="create-business-name"
                      className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30"
                      placeholder="Harbor Roast"
                      {...createBusinessForm.register('name')}
                    />
                    {createBusinessForm.formState.errors.name ? (
                      <p className="text-xs text-red-500">{createBusinessForm.formState.errors.name.message}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="create-business-slug">Slug</Label>
                    <Input
                      id="create-business-slug"
                      className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30"
                      placeholder="harbor-roast"
                      {...createBusinessForm.register('slug', {
                        onChange: () => {
                          setIsCreateSlugManual(true)
                        },
                      })}
                    />
                    {createBusinessForm.formState.errors.slug ? (
                      <p className="text-xs text-red-500">{createBusinessForm.formState.errors.slug.message}</p>
                    ) : (
                      <p className="text-xs text-on-surface-variant/70">Lowercase letters, numbers, and single hyphens only.</p>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="create-business-description">Description</Label>
                    <Textarea
                      id="create-business-description"
                      className="min-h-28 rounded-2xl border-outline-variant/20 focus:border-primary/30"
                      placeholder="Neighborhood espresso bar with all-day pastries."
                      {...createBusinessForm.register('description')}
                    />
                    {createBusinessForm.formState.errors.description ? (
                      <p className="text-xs text-red-500">{createBusinessForm.formState.errors.description.message}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="create-business-logo-url">Logo URL</Label>
                    <Input
                      id="create-business-logo-url"
                      className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30"
                      placeholder="https://example.com/logo.png"
                      {...createBusinessForm.register('logoUrl')}
                    />
                    {createBusinessForm.formState.errors.logoUrl ? (
                      <p className="text-xs text-red-500">{createBusinessForm.formState.errors.logoUrl.message}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-3">
                      <Label htmlFor="create-business-earn-rate">Earn Rate</Label>
                      <Input
                        id="create-business-earn-rate"
                        type="number"
                        step="0.01"
                        className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30"
                        {...createBusinessForm.register('earnRate', { valueAsNumber: true })}
                      />
                      {createBusinessForm.formState.errors.earnRate ? (
                        <p className="text-xs text-red-500">{createBusinessForm.formState.errors.earnRate.message}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="create-business-tax-rate">Tax Rate</Label>
                      <Input
                        id="create-business-tax-rate"
                        type="number"
                        step="0.001"
                        className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30"
                        {...createBusinessForm.register('taxRate', { valueAsNumber: true })}
                      />
                      {createBusinessForm.formState.errors.taxRate ? (
                        <p className="text-xs text-red-500">{createBusinessForm.formState.errors.taxRate.message}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                    <div className="grid gap-3">
                      <Label htmlFor="create-business-currency">Currency</Label>
                      <Input
                        id="create-business-currency"
                        maxLength={3}
                        className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30 uppercase"
                        {...createBusinessForm.register('currency', {
                          onChange: (event) => {
                            createBusinessForm.setValue('currency', event.target.value.toUpperCase(), {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          },
                        })}
                      />
                      {createBusinessForm.formState.errors.currency ? (
                        <p className="text-xs text-red-500">{createBusinessForm.formState.errors.currency.message}</p>
                      ) : null}
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl border border-primary-container/20 bg-[var(--muted)] px-4 py-3 text-sm font-semibold text-on-surface">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-outline-variant/30"
                        {...createBusinessForm.register('active')}
                      />
                      Active
                    </label>
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="create-business-owner-email">Owner Email</Label>
                    <Input
                      id="create-business-owner-email"
                      type="email"
                      className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30"
                      placeholder="owner@harborroast.com"
                      {...createBusinessForm.register('ownerEmail')}
                    />
                    {createBusinessForm.formState.errors.ownerEmail ? (
                      <p className="text-xs text-red-500">{createBusinessForm.formState.errors.ownerEmail.message}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="submit"
                      className="rounded-full"
                      disabled={createBusiness.isPending || assignBusinessOwner.isPending}
                    >
                      {createBusiness.isPending || assignBusinessOwner.isPending ? 'Creating...' : 'Create Business'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        createBusinessForm.reset({
                          name: '',
                          slug: '',
                          description: '',
                          logoUrl: '',
                          earnRate: 1,
                          taxRate: 0,
                          currency: 'USD',
                          active: true,
                          ownerEmail: '',
                        })
                        setCreateBusinessError(null)
                        setIsCreateSlugManual(false)
                      }}
                      disabled={createBusiness.isPending || assignBusinessOwner.isPending}
                    >
                      Reset
                    </Button>
                  </div>
                  {createBusinessError ? <p className="text-sm font-bold text-red-500">{createBusinessError}</p> : null}
                </form>
              </div>
            </div>

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

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-primary-container/16 bg-[var(--muted)] p-5">
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Receptionist Codes</p>
                  <p className="mt-3 font-serif text-[2rem] leading-none text-primary">{partnerPerformance.data?.length ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-primary-container/16 bg-[var(--muted)] p-5">
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Attributed Customers</p>
                  <p className="mt-3 font-serif text-[2rem] leading-none text-primary">
                    {partnerReferrals.data?.length ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-primary-container/16 bg-[var(--muted)] p-5">
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Partner Credits Earned</p>
                  <p className="mt-3 font-serif text-[2rem] leading-none text-primary">
                    {partnerPerformance.data?.reduce((sum, entry) => sum + entry.creditsEarned, 0) ?? 0}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-primary-container/18 bg-[var(--card)] shadow-card overflow-hidden">
                <div className="border-b border-outline-variant/10 px-6 py-5">
                  <h3 className="font-serif text-2xl text-primary">Recent Partner Referrals</h3>
                  <p className="mt-1 text-sm text-on-surface-variant/75">
                    Receptionist-level attribution across all businesses.
                  </p>
                </div>
                <div className="divide-y divide-outline-variant/10">
                  {(partnerReferrals.data ?? []).slice(0, 8).map((referral) => (
                    <div key={referral.id} className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-serif text-xl text-primary">{referral.partnerReferrer.contactName}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-primary">{referral.customer.fullName}</p>
                        <p className="text-sm text-on-surface-variant/80">{referral.customer.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="accent"
                          className={
                            referral.status === 'credited'
                              ? 'bg-success/10 text-success border-success/20'
                              : 'border-primary-container/20 bg-primary-container/12 text-primary'
                          }
                        >
                          {referral.status}
                        </Badge>
                        <span className="text-xs uppercase tracking-[0.18em] text-on-surface-variant/70">
                          {formatDate(referral.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {partnerReferrals.isLoading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="px-6 py-5">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="mt-3 h-4 w-64" />
                      </div>
                    ))
                  ) : null}
                  {!partnerReferrals.isLoading && (partnerReferrals.data?.length ?? 0) === 0 ? (
                    <EmptyState
                      className="border-0 shadow-none"
                      icon={<Users className="size-8" />}
                      title={t('No partner referrals yet')}
                      description={t('Partner referral records will appear here after attribution.')}
                    />
                  ) : null}
                </div>
              </div>

              <div className="grid min-w-0 gap-4 2xl:grid-cols-2">
                {(allBusinesses.data ?? []).map((business) => (
                  <div key={business.id} className="rounded-3xl border border-primary-container/18 bg-[var(--card)] p-7 shadow-card  space-y-7">
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-5">
                        <div className="flex min-w-0 items-start gap-4">
                        {business.logoUrl ? (
                          <img
                            src={business.logoUrl}
                            alt={business.name}
                            className="size-16 shrink-0 rounded-2xl object-cover border border-outline-variant/10"
                          />
                        ) : (
                          <div className={`size-16 shrink-0 rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg ${bizColorClass(business.id)}`}>
                            <Store className="size-7" />
                          </div>
                        )}
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-serif text-3xl leading-tight tracking-tight text-primary break-words">{business.name}</p>
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
                          <p className="max-w-md text-base leading-8 font-medium text-on-surface-variant/85">
                            {business.description || 'No description provided yet.'}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
                            <span>{business.earnRate} pts / $1</span>
                            <span>{business.currency}</span>
                            <span>{business.slug}</span>
                          </div>
                          <div className="rounded-2xl border border-primary-container/16 bg-[var(--muted)] p-4 text-sm">
                            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Owner</p>
                            <p className="mt-2 font-semibold text-primary">
                              {business.ownerName || business.ownerEmail || 'Unassigned'}
                            </p>
                            <p className="mt-1 text-on-surface-variant/75">
                              {business.ownerEmail ?? 'Assign an owner to enable business access.'}
                            </p>
                          </div>
                        </div>
                      </div>
                        <div className="grid grid-cols-2 gap-3 sm:flex sm:max-w-[220px] sm:flex-col sm:items-stretch">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full px-4"
                          onClick={() => {
                            setPartnerActionError(null)
                            setBusinessAccessDialog({
                              businessId: business.id,
                              role: 'business-owner',
                            })
                          }}
                        >
                          Assign Owner
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full px-4"
                          onClick={() => {
                            setPartnerActionError(null)
                            setBusinessAccessDialog({
                              businessId: business.id,
                              role: 'business-staff',
                            })
                          }}
                        >
                          Add Staff
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-full px-4"
                          onClick={() =>
                            editingBusinessId === business.id
                              ? setEditingBusinessId(null)
                              : beginBusinessEdit(business)
                          }
                        >
                          {editingBusinessId === business.id ? 'Cancel' : 'Edit'}
                        </Button>
                      </div>
                    </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-primary-container/16 bg-[var(--muted)] p-5">
                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Customers</p>
                        <p className="mt-3 font-serif text-[2rem] leading-none text-primary">{business.totalMembers}</p>
                      </div>
                      <div className="rounded-2xl border border-primary-container/16 bg-[var(--muted)] p-5">
                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Revenue</p>
                        <p className="mt-3 font-serif text-[2rem] leading-none text-primary">{moneyFormatter(business.totalRevenue, business.currency)}</p>
                      </div>
                      <div className="rounded-2xl border border-primary-container/16 bg-[var(--muted)] p-5">
                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">{t('Points Issued')}</p>
                        <p className="mt-3 font-serif text-[2rem] leading-none text-primary">{business.pointsIssued}</p>
                      </div>
                      <div className="rounded-2xl border border-primary-container/16 bg-[var(--muted)] p-5">
                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Staff Accounts</p>
                        <p className="mt-3 font-serif text-[2rem] leading-none text-primary">{business.staffCount}</p>
                      </div>
                    </div>

                    {editingBusinessId === business.id ? (
                      <form
                        className="space-y-4 rounded-[2rem] border border-primary-container/20 bg-primary-container/10 p-6"
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
                            toast.success('Business updated.')
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
                <div className="grid gap-6 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-40 rounded-3xl" />
                  ))}
                </div>
              ) : null}

              {!allBusinesses.isLoading && (allBusinesses.data?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={<Store className="size-8" />}
                  title={t('No partners yet')}
                  description={t('Create a partner business before assigning owners or reviewing metrics.')}
                />
              ) : null}
            </div>
          </div>

          <Dialog
            open={Boolean(businessAccessDialog)}
            onOpenChange={(open) => {
              if (!open) {
                setBusinessAccessDialog(null)
              }
            }}
          >
            <DialogContent className="max-w-lg rounded-3xl border border-primary-container/20 bg-[var(--card)] text-on-surface shadow-card">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl text-primary">
                  {businessAccessDialog?.role === 'business-staff' ? 'Add Staff' : 'Assign Owner'}
                </DialogTitle>
                <DialogDescription className="text-sm text-on-surface-variant/80">
                  {accessDialogBusiness
                    ? businessAccessDialog?.role === 'business-staff'
                      ? `Add a staff account to ${accessDialogBusiness.name}.`
                      : `Assign the canonical owner for ${accessDialogBusiness.name}.`
                    : 'Manage business access.'}
                </DialogDescription>
              </DialogHeader>

              <form
                className="space-y-5 pt-2"
                onSubmit={assignOwnerForm.handleSubmit(async (values) => {
                  if (!businessAccessDialog) return

                  try {
                    if (businessAccessDialog.role === 'business-staff') {
                      await assignBusinessStaffFromList.mutateAsync({
                        email: values.email,
                        businessId: businessAccessDialog.businessId,
                      })
                    } else {
                      await assignBusinessOwnerFromList.mutateAsync({
                        email: values.email,
                        businessId: businessAccessDialog.businessId,
                      })
                    }
                    toast.success(
                      businessAccessDialog.role === 'business-staff'
                        ? 'Business staff assigned.'
                        : 'Business owner assigned.',
                    )
                    setBusinessAccessDialog(null)
                    assignOwnerForm.reset({ email: '' })
                  } catch (error) {
                    if (error instanceof OwnerNotFoundError || error instanceof StaffNotFoundError) {
                      toast.error('No user account matches that email.')
                      return
                    }

                    toast.error(
                      error instanceof Error
                        ? error.message
                        : businessAccessDialog.role === 'business-staff'
                          ? 'Failed to assign staff.'
                          : 'Failed to assign business owner.',
                    )
                  }
                })}
              >
                <div className="grid gap-3">
                  <Label htmlFor="assign-owner-email">
                    {businessAccessDialog?.role === 'business-staff' ? 'Staff Email' : 'Owner Email'}
                  </Label>
                  <Input
                    id="assign-owner-email"
                    type="email"
                    className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30"
                    placeholder={
                      businessAccessDialog?.role === 'business-staff'
                        ? 'staff@partner.com'
                        : 'owner@partner.com'
                    }
                    {...assignOwnerForm.register('email')}
                  />
                  {assignOwnerForm.formState.errors.email ? (
                    <p className="text-xs text-red-500">{assignOwnerForm.formState.errors.email.message}</p>
                  ) : null}
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setBusinessAccessDialog(null)}
                    disabled={assignBusinessOwnerFromList.isPending || assignBusinessStaffFromList.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-full"
                    disabled={assignBusinessOwnerFromList.isPending || assignBusinessStaffFromList.isPending}
                  >
                    {assignBusinessOwnerFromList.isPending || assignBusinessStaffFromList.isPending
                      ? 'Saving...'
                      : businessAccessDialog?.role === 'business-staff'
                        ? 'Add Staff'
                        : 'Assign Owner'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <div className="space-y-8">
            <div className="space-y-2 pb-4 border-b border-outline-variant/10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Audit</span>
                <h2 className="font-serif text-3xl text-primary">Credit Verification — Recent Orders</h2>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="verification-business" className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/80">
                  Filter Partner
                </Label>
                <select
                  id="verification-business"
                  value={verificationBusinessId}
                  onChange={(event) => setVerificationBusinessId(event.target.value)}
                  className="h-12 min-w-56 rounded-2xl border border-primary-container/20 bg-[var(--muted)] px-4 text-sm text-on-surface shadow-sm outline-none transition focus:border-primary/30"
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

            <div className="rounded-3xl border border-primary-container/18 bg-[var(--card)] shadow-card overflow-hidden">
              <ScrollArea className="h-[520px]">
                <div className="min-w-[900px]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--muted)] text-left">
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
                          <tr key={order.id} className="border-b border-outline-variant/5 bg-transparent">
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
                    Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="px-6 py-4">
                        <Skeleton className="h-5 w-full" />
                      </div>
                    ))
                  ) : null}

                  {!verificationOrders.isLoading && (verificationOrders.data?.length ?? 0) === 0 ? (
                    <EmptyState
                      className="border-0 shadow-none"
                      icon={<Activity className="size-8" />}
                      title={t('No orders found')}
                      description={t('Orders matching this filter will appear here.')}
                    />
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

            <div className="rounded-3xl border border-primary-container/18 bg-[var(--card)] shadow-card overflow-hidden">
              <ScrollArea className="h-[620px]">
                <div className="min-w-[760px]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--muted)] text-left">
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
                        <tr key={referral.id} className="border-b border-outline-variant/5 bg-transparent">
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
                              <span className="text-xs font-medium text-on-surface-variant/70">No action</span>
                            )}
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {allReferrals.isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="px-6 py-4">
                        <Skeleton className="h-5 w-full" />
                      </div>
                    ))
                  ) : null}

                  {!allReferrals.isLoading && (allReferrals.data?.length ?? 0) === 0 ? (
                    <EmptyState
                      className="border-0 shadow-none"
                      icon={<Users className="size-8" />}
                      title={t('No referrals found')}
                      description={t('Customer referral records will appear here.')}
                    />
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-12 outline-none">
          <div className="grid min-w-0 gap-8 2xl:grid-cols-2">
            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Fulfillment</span>
                <h2 className="font-serif text-3xl text-primary">Fulfillment Queue</h2>
              </div>
              <div className="rounded-3xl bg-card border border-outline-variant/20 shadow-sm overflow-hidden">
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
                             <span className="text-sm font-bold text-primary">{redemption.pointsCost} {t('points')}</span>
                           </div>
                           <span className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/80 flex items-center gap-1">
                             {formatDate(redemption.redeemedAt)}
                           </span>
                        </div>
                      </div>
                    ))}
                    {(overview.data?.redemptions?.length ?? 0) === 0 && (
                      <EmptyState
                        className="border-0 shadow-none"
                        icon={<Gift className="size-8" />}
                        title={t('No redemptions yet')}
                        description={t('Reward fulfillment requests will appear here.')}
                      />
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
               <div className="rounded-3xl bg-card border border-outline-variant/20 shadow-sm overflow-hidden">
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
                    {(overview.data?.adminLogs?.length ?? 0) === 0 ? (
                      <EmptyState
                        className="border-0 shadow-none"
                        icon={<Activity className="size-8" />}
                        title={t('No admin logs yet')}
                        description={t('Administrative changes will appear here.')}
                      />
                    ) : null}
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
