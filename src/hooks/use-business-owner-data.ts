import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { adminService } from '@/integrations/supabase/services/admin-service'
import { businessService } from '@/integrations/supabase/services/business-service'
import { productsService } from '@/integrations/supabase/services/products-service'
import { promotionsService } from '@/integrations/supabase/services/promotions-service'
import { rewardsService } from '@/integrations/supabase/services/rewards-service'
import { camelCaseRow, requireSupabase } from '@/integrations/supabase/services/shared'
import type { Profile, Redemption } from '@/types/domain'
import type { RewardAdjustmentFormValues } from '@/types/forms'
import { useAuth } from './use-auth'

export function useBusinessOwnerData() {
  useAuth()

  // Get the business details
  const businessQuery = useQuery({
    queryKey: ['business', 'single'],
    queryFn: () => businessService.getSingleBusiness(),
    retry: false,
  })

  const businessId = businessQuery.data?.id
  const sharedQueryOptions = {
    enabled: !!businessId,
    retry: false,
  } as const

  // Get products for this business only
  const productsQuery = useQuery({
    queryKey: ['products', businessId],
    queryFn: () => productsService.getProducts(businessId!),
    ...sharedQueryOptions,
  })

  // Get rewards for this business only
  const rewardsQuery = useQuery({
    queryKey: ['rewards', businessId],
    queryFn: () => rewardsService.getRewards(businessId!),
    ...sharedQueryOptions,
  })

  // Get promotions for this business only
  const promotionsQuery = useQuery({
    queryKey: ['promotions', businessId],
    queryFn: () => promotionsService.getPromotions(businessId!),
    ...sharedQueryOptions,
  })

  // Get orders for this business only (admin/biz owner can see all orders)
  const ordersQuery = useQuery({
    queryKey: ['businessOrders', businessId],
    queryFn: async () => {
      if (!businessId) return []
      const sb = requireSupabase()
      const { data, error } = await sb
        .from('orders')
        .select('*, order_line_items(*)')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (error) throw new Error('Failed to load orders.')

      return (data as Record<string, unknown>[]).map((orderRow) => {
        const o = camelCaseRow(orderRow)
        const lineItems = ((orderRow).order_line_items ?? []) as Record<string, unknown>[]
        const items = lineItems.map((li) => {
          const l = camelCaseRow(li)
          return {
            productId: l.productId as string,
            productTitle: l.productTitle as string,
            unitPrice: Number(l.unitPrice),
            quantity: l.quantity as number,
            subtotal: Number(l.subtotal),
          }
        })
        return {
          id: o.id as string,
          profileId: o.profileId as string,
          businessId: o.businessId as string,
          items,
          subtotal: Number(o.subtotal),
          tax: Number(o.tax),
          total: Number(o.total),
          pointsEarned: o.pointsEarned as number,
          pointsStatus: o.pointsStatus as 'pending' | 'posted',
          paymentMethod: o.paymentMethod as string,
          status: o.status as 'confirmed' | 'processing' | 'delivered',
          createdAt: o.createdAt as string,
        }
      })
    },
    ...sharedQueryOptions,
  })

  // Get redemptions for this business only (via join with rewards)
  const redemptionsQuery = useQuery({
    queryKey: ['businessRedemptions', businessId],
    queryFn: async () => {
      if (!businessId) return []
      const sb = requireSupabase()
      
      const { data, error } = await sb
        .from('redemptions')
        .select('*, rewards!inner(business_id)')
        .eq('rewards.business_id', businessId)
        .order('redeemed_at', { ascending: false })

      if (error) throw new Error('Failed to load redemptions.')

      return (data as Record<string, unknown>[]).map((redemptionRow) => {
        const redemption = camelCaseRow(redemptionRow)
        return {
          id: redemption.id as string,
          profileId: redemption.profileId as string,
          rewardId: redemption.rewardId as string,
          rewardTitle: redemption.rewardTitle as string,
          pointsCost: redemption.pointsCost as number,
          notes: redemption.notes as string | undefined,
          redeemedAt: redemption.redeemedAt as string,
          status: redemption.status as Redemption['status'],
        }
      })
    },
    ...sharedQueryOptions,
  })

  // Calculate business metrics
  const metricsQuery = useQuery({
    queryKey: ['metrics', businessId],
    queryFn: async () => {
      if (!businessId) return null

      const sb = requireSupabase()
      const [ordersResult, activitiesResult, promotionsResult] = await Promise.all([
        sb
          .from('orders')
          .select('profile_id, total')
          .eq('business_id', businessId),
        sb
          .from('activities')
          .select('type, points, business_id')
          .eq('business_id', businessId),
        sb
          .from('promotions')
          .select('expires_at')
          .eq('business_id', businessId),
      ])

      if (ordersResult.error) throw new Error('Failed to load order metrics.')
      if (activitiesResult.error) throw new Error('Failed to load activity metrics.')
      if (promotionsResult.error) throw new Error('Failed to load promotion metrics.')

      const orders = ordersResult.data ?? []
      const activities = activitiesResult.data ?? []
      const promotions = promotionsResult.data ?? []

      const earnedPoints = activities
        .filter((a) => a.type === 'earned')
        .reduce((sum, a) => sum + a.points, 0)

      const redeemedPoints = activities
        .filter((a) => a.type === 'redeemed')
        .reduce((sum, a) => sum + Math.abs(a.points), 0)

      return {
        totalMembers: new Set(orders.map((o) => o.profile_id)).size,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
        pointsIssued: earnedPoints,
        pointsRedeemed: redeemedPoints,
        activePromotions: promotions.filter((p) => new Date(p.expires_at) > new Date()).length,
      }
    },
    ...sharedQueryOptions,
  })

  return {
    business: businessQuery.data ?? null,
    products: productsQuery.data ?? [],
    rewards: rewardsQuery.data ?? [],
    promotions: promotionsQuery.data ?? [],
    orders: ordersQuery.data ?? [],
    redemptions: redemptionsQuery.data ?? [],
    metrics: metricsQuery.data ?? null,
    isBusinessLoading: businessQuery.isLoading,
    isLoading:
      businessQuery.isLoading ||
      productsQuery.isLoading ||
      rewardsQuery.isLoading ||
      promotionsQuery.isLoading ||
      ordersQuery.isLoading ||
      redemptionsQuery.isLoading ||
      metricsQuery.isLoading,
    error:
      businessQuery.error ??
      productsQuery.error ??
      rewardsQuery.error ??
      promotionsQuery.error ??
      ordersQuery.error ??
      redemptionsQuery.error ??
      metricsQuery.error ??
      null,
  }
}

export function useBusinessMembers(businessId?: string) {
  return useQuery({
    queryKey: ['businessMembers', businessId],
    queryFn: async () => {
      if (!businessId) return []

      const sb = requireSupabase()
      const { data: profileRows, error: profError } = await sb
        .from('profiles')
        .select('*')
        .eq('role', 'customer')

      if (profError) throw new Error('Failed to load customers.')

      const { data: balanceRows, error: balError } = await sb
        .from('reward_balances')
        .select('*')

      if (balError) throw new Error('Failed to load balances.')

      const balanceMap = new Map(
        (balanceRows ?? []).map((balance) => [balance.profile_id as string, balance.points as number]),
      )

      return (profileRows ?? []).map((profile) => ({
        id: profile.id as string,
        fullName: profile.full_name as string,
        email: profile.email as string,
        points: balanceMap.get(profile.id as string) ?? 0,
      }))
    },
    enabled: !!businessId,
  })
}

export function useAwardPoints(actor?: Profile | null, businessId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: RewardAdjustmentFormValues) =>
      adminService.adjustRewardsForBusiness(values, actor!, businessId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['businessMembers', businessId] })
      void queryClient.invalidateQueries({ queryKey: ['reward-balance'] })
      void queryClient.invalidateQueries({ queryKey: ['activities'] })
      void queryClient.invalidateQueries({ queryKey: ['metrics', businessId] })
      toast.success('Points awarded successfully')
    },
    onError: (error: Error) => {
      toast.error(`Award failed: ${error.message}`)
    },
  })
}
