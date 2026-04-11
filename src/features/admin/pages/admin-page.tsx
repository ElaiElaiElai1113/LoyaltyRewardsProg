import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { TrendingUp, Users, Gift, Activity } from 'lucide-react'

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
  useAdminBusinesses,
  useAdminOverview,
  useAdminProducts,
  useAdminUsers,
  useCreateProduct,
  useCreatePromotion,
  useCreateReward,
  useUpdateBusinessSettings,
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
import type { Business } from '@/types/domain'
import { formatCurrency, formatDate } from '@/lib/utils'

export function AdminPage() {
  const { profile } = useAuth()
  const users = useAdminUsers()
  const overview = useAdminOverview()
  const rewards = useRewards()
  const promotions = usePromotions()
  const businesses = useAdminBusinesses()
  const adminProducts = useAdminProducts()
  const adjustRewards = useAdjustRewards(profile)
  const createReward = useCreateReward()
  const createPromotion = useCreatePromotion()
  const createProduct = useCreateProduct()
  const updateSettings = useUpdateBusinessSettings()

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
      businessId: businesses.data?.[0]?.id ?? '',
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
      businessId: businesses.data?.[0]?.id ?? '',
      title: '',
      description: '',
      category: 'Coffee',
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

  const [promoBusinessId, setPromoBusinessId] = useState(businesses.data?.[0]?.id ?? '')

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
                  <span className="font-serif text-3xl leading-none">{(rewards.data ?? []).length}</span>
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white/80">Rewards</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-12">
        <div className="sticky top-24 z-40 -mx-6 bg-surface/95 px-6 py-4 backdrop-blur-md flex justify-center border-b border-outline-variant/10 shadow-sm">
          <TabsList className="w-full max-w-4xl bg-surface-low p-1.5 rounded-2xl border border-outline-variant/10">
            <TabsTrigger value="members" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">Members</TabsTrigger>
            <TabsTrigger value="catalog" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">Rewards</TabsTrigger>
            <TabsTrigger value="products" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">Products</TabsTrigger>
            <TabsTrigger value="businesses" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">Businesses</TabsTrigger>
            <TabsTrigger value="promotions" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">Promotions</TabsTrigger>
            <TabsTrigger value="activity" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">Activity</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="members" className="space-y-12 outline-none">
          <div className="grid gap-16 xl:grid-cols-[450px_1fr]">
            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Quick Action</span>
                <h2 className="font-serif text-3xl text-primary">Reward Adjustment</h2>
              </div>

              <div className="rounded-3xl bg-white border border-outline-variant/5 shadow-sm p-8">
                <form
                  className="space-y-6"
                  onSubmit={adjustmentForm.handleSubmit(async (values) => {
                    await adjustRewards.mutateAsync(values)
                    adjustmentForm.reset({
                      profileId: '',
                      delta: 50,
                      reason: '',
                    })
                  })}
                >
                  <div className="grid gap-4">
                    <Label htmlFor="profileId" className="text-sm font-semibold">Member ID</Label>
                    <Input
                      id="profileId"
                      list="member-id-options"
                      placeholder="Paste a member id"
                      className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30"
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
                  <div className="grid gap-4">
                    <Label htmlFor="delta" className="text-sm font-semibold">Points Adjustment</Label>
                    <Input id="delta" type="number" className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30" {...adjustmentForm.register('delta', { valueAsNumber: true })} />
                  </div>
                  <div className="grid gap-4">
                    <Label htmlFor="reason" className="text-sm font-semibold">Reason</Label>
                    <Input id="reason" placeholder="e.g., Service recovery" className="rounded-2xl h-12 border-outline-variant/20 focus:border-primary/30" {...adjustmentForm.register('reason')} />
                  </div>
                  <Button type="submit" size="lg" className="w-full rounded-full h-14 font-semibold" disabled={adjustRewards.isPending}>
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

              <div className="grid gap-4 pointer-events-auto">
                {(users.data ?? []).map(({ profile: member, balance }) => (
                  <div
                    key={member.id}
                    className="group flex flex-col gap-6 rounded-3xl bg-white p-6 transition-all hover:shadow-xl hover:scale-[1.01] md:flex-row md:items-center md:justify-between border border-outline-variant/5 hover:border-primary/10"
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
                        {balance?.points ?? 0} Points
                      </Badge>
                      <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/5">
                        View Details
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
                    <div className="grid gap-3 mb-4">
                      <Label>Business</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {(businesses.data ?? []).map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => rewardForm.setValue('businessId', b.id)}
                            className={`rounded-2xl border p-3 text-sm font-medium transition-all ${
                              rewardForm.watch('businessId') === b.id
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40'
                            }`}
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    </div>
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

        <TabsContent value="products" className="space-y-12 outline-none">
          <div className="grid gap-16 xl:grid-cols-[1fr_450px]">
            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Inventory</span>
                <h2 className="font-serif text-3xl text-primary">Products</h2>
              </div>
              <div className="grid gap-3">
                {(adminProducts.data ?? []).map((product) => (
                  <div
                    key={product.id}
                    className="group flex items-center justify-between rounded-3xl bg-white hover:bg-surface-low p-6 border border-outline-variant/5 hover:border-primary/10 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`size-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold ${
                        product.businessId === 'biz-velvet-brew'
                          ? 'bg-gradient-to-br from-[#8B4513] to-[#654321]'
                          : 'bg-gradient-to-br from-[#D4A574] to-[#C19A6B]'
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
                    <div className="text-right">
                      <p className="font-serif text-2xl text-primary">{formatCurrency(product.price)}</p>
                      <Badge variant="outline" className="text-[0.65rem] border-outline-variant/20 mt-1">
                        {businesses.data?.find((b) => b.id === product.businessId)?.name ?? 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Create</span>
                <h2 className="font-serif text-3xl text-primary">Add Product</h2>
              </div>
              <div className="rounded-2xl bg-surface-low p-8 border border-outline-variant/10">
                <form
                  className="space-y-6"
                  onSubmit={productForm.handleSubmit(async (values) => {
                    await createProduct.mutateAsync(values)
                    productForm.reset({
                      businessId: businesses.data?.[0]?.id ?? '',
                      title: '',
                      description: '',
                      category: 'Coffee',
                      price: 5,
                      highlight: '',
                      inventory: 50,
                    })
                  })}
                >
                  <div className="grid gap-3">
                    <Label>Business</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {(businesses.data ?? []).map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => productForm.setValue('businessId', b.id)}
                          className={`rounded-2xl border p-3 text-sm font-medium transition-all ${
                            productForm.watch('businessId') === b.id
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40'
                          }`}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="product-title">Product Title</Label>
                    <Input id="product-title" placeholder="e.g., House Blend" {...productForm.register('title')} />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="product-description">Description</Label>
                    <Input id="product-description" placeholder="Describe the product..." {...productForm.register('description')} />
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-3">
                      <Label htmlFor="product-category">Category</Label>
                      <Input id="product-category" list="product-category-options" {...productForm.register('category')} />
                      <datalist id="product-category-options">
                        <option value="Coffee" />
                        <option value="Pastry" />
                        <option value="Merch" />
                        <option value="Equipment" />
                      </datalist>
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="product-price">Price ($)</Label>
                      <Input id="product-price" type="number" step="0.01" {...productForm.register('price', { valueAsNumber: true })} />
                    </div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-3">
                      <Label htmlFor="product-highlight">Highlight Tag</Label>
                      <Input id="product-highlight" placeholder="Popular / New" {...productForm.register('highlight')} />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="product-inventory">Inventory</Label>
                      <Input id="product-inventory" type="number" {...productForm.register('inventory', { valueAsNumber: true })} />
                    </div>
                  </div>
                  <Button type="submit" size="lg" className="w-full rounded-full h-14" disabled={createProduct.isPending}>
                    {createProduct.isPending ? 'Creating...' : 'Add Product'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="businesses" className="space-y-12 outline-none">
          <div className="grid gap-16 xl:grid-cols-[1fr_450px]">
            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Partners</span>
                <h2 className="font-serif text-3xl text-primary">Businesses</h2>
              </div>
              <div className="grid gap-6">
                {(businesses.data ?? []).map((biz) => (
                  <div
                    key={biz.id}
                    className={`group rounded-3xl p-8 border border-outline-variant/5 hover:shadow-xl transition-all overflow-hidden ${
                      biz.id === 'biz-velvet-brew'
                        ? 'bg-gradient-to-br from-[#8B4513]/5 to-[#654321]/5 hover:from-[#8B4513]/10 hover:to-[#654321]/10'
                        : 'bg-gradient-to-br from-[#D4A574]/5 to-[#C19A6B]/5 hover:from-[#D4A574]/10 hover:to-[#C19A6B]/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className={`size-12 rounded-xl flex items-center justify-center text-white text-lg font-bold ${
                            biz.id === 'biz-velvet-brew'
                              ? 'bg-gradient-to-br from-[#8B4513] to-[#654321]'
                              : 'bg-gradient-to-br from-[#D4A574] to-[#C19A6B]'
                          }`}>
                            {biz.name.charAt(0)}
                          </div>
                          <Badge variant={biz.active ? 'success' : 'outline'} className="text-[0.65rem] font-medium px-3 py-1">
                            {biz.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="font-serif text-3xl text-primary mt-4">{biz.name}</p>
                        <p className="text-sm leading-relaxed text-on-surface-variant/80 max-w-md">{biz.description}</p>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-outline-variant/10 flex items-center gap-8">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="size-4 text-secondary" />
                        <span className="text-sm text-on-surface-variant/80">
                          Earn Rate: <strong className="text-primary">{biz.earnRate} pts/$1</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="size-4 text-secondary" />
                        <span className="text-sm text-on-surface-variant/80">
                          Tax Rate: <strong className="text-primary">{(biz.taxRate * 100).toFixed(1)}%</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2 pb-4 border-b border-outline-variant/10">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Settings</span>
                <h2 className="font-serif text-3xl text-primary">Update Settings</h2>
              </div>
              {(businesses.data ?? []).map((biz) => (
                <BusinessSettingsCard key={biz.id} business={biz} updateSettings={updateSettings} />
              ))}
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
                    await createPromotion.mutateAsync({ ...values, businessId: promoBusinessId })
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
                    <Label>Business</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {(businesses.data ?? []).map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setPromoBusinessId(b.id)}
                          className={`rounded-2xl border p-3 text-sm font-medium transition-all ${
                            promoBusinessId === b.id
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40'
                          }`}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>
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
                                Member: {redemption.profileId}
                              </p>
                            </div>
                          </div>
                          <Badge variant={redemption.status === 'ready' ? 'outline' : 'accent'} className={
                            redemption.status === 'ready'
                              ? 'border-warning/50 text-warning bg-warning/10'
                              : 'bg-success/10 text-success border-success/20'
                          }>
                            {redemption.status}
                          </Badge>
                        </div>
                        <div className="mt-4 pt-4 border-t border-outline-variant/5 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <TrendingUp className="size-4 text-secondary" />
                             <span className="text-sm font-bold text-primary">{redemption.pointsCost} Points</span>
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

function BusinessSettingsCard({
  business,
  updateSettings,
}: {
  business: Business
  updateSettings: ReturnType<typeof useUpdateBusinessSettings>
}) {
  const [earnRate, setEarnRate] = useState(business.earnRate)
  const [taxRate, setTaxRate] = useState(business.taxRate)

  return (
    <div className="rounded-3xl bg-white border border-outline-variant/5 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className={`size-10 rounded-xl flex items-center justify-center text-white text-lg font-bold ${
          business.id === 'biz-velvet-brew'
            ? 'bg-gradient-to-br from-[#8B4513] to-[#654321]'
            : 'bg-gradient-to-br from-[#D4A574] to-[#C19A6B]'
        }`}>
          {business.name.charAt(0)}
        </div>
        <h3 className="font-serif text-xl text-primary">{business.name}</h3>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label className="text-sm font-semibold">Earn Rate (pts/$1)</Label>
          <Input
            type="number"
            value={earnRate}
            onChange={(e) => setEarnRate(Number(e.target.value))}
            className="rounded-xl h-11 border-outline-variant/20 focus:border-primary/30"
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-sm font-semibold">Tax Rate (e.g. 0.09 for 9%)</Label>
          <Input
            type="number"
            step="0.001"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            className="rounded-xl h-11 border-outline-variant/20 focus:border-primary/30"
          />
        </div>
      </div>
      <Button
        size="sm"
        className="w-full rounded-xl h-11 font-semibold"
        disabled={updateSettings.isPending}
        onClick={() => updateSettings.mutate({ businessId: business.id, values: { earnRate, taxRate } })}
      >
        {updateSettings.isPending ? 'Saving...' : `Save ${business.name} Settings`}
      </Button>
    </div>
  )
}
