import { useQuery } from '@tanstack/react-query'

import { businessService } from '@/integrations/supabase/services/business-service'
import { productsService } from '@/integrations/supabase/services/products-service'
import { promotionsService } from '@/integrations/supabase/services/promotions-service'
import { rewardsService } from '@/integrations/supabase/services/rewards-service'
import { ordersService } from '@/integrations/supabase/services/orders-service'
import { activityService } from '@/integrations/supabase/services/activity-service'
import { adminService } from '@/integrations/supabase/services/admin-service'
import { useAuth } from './use-auth'

export function useBusinessOwnerData() {
  const { session, profile } = useAuth()

  const businessId = session?.businessId

  // Get the business details
  const businessQuery = useQuery({
    queryKey: ['business', businessId],
    queryFn: () => businessService.getBusinessById(businessId!),
    enabled: !!businessId,
  })

  // Get products for this business only
  const productsQuery = useQuery({
    queryKey: ['products', businessId],
    queryFn: () => productsService.getProducts(businessId!),
    enabled: !!businessId,
  })

  // Get rewards for this business only
  const rewardsQuery = useQuery({
    queryKey: ['rewards', businessId],
    queryFn: () => rewardsService.getRewards(businessId!),
    enabled: !!businessId,
  })

  // Get promotions for this business only
  const promotionsQuery = useQuery({
    queryKey: ['promotions', businessId],
    queryFn: () => promotionsService.getPromotions(businessId!),
    enabled: !!businessId,
  })

  // Get orders for this business only (admin/biz owner can see all orders)
  const ordersQuery = useQuery({
    queryKey: ['businessOrders', businessId],
    queryFn: async () => {
      if (!businessId) return []
      // Business owners see all orders for their business
      // We need a separate query for business-scoped orders
      const { requireSupabase } = await import('@/integrations/supabase/services/shared')
      const sb = requireSupabase()
      const { data, error } = await sb
        .from('orders')
        .select('*, order_line_items(*)')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (error) throw new Error('Failed to load orders.')

      return (data as Record<string, unknown>[]).map((orderRow) => {
        const { camelCaseRow } = require('@/integrations/supabase/services/shared')
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
    enabled: !!businessId,
  })

  // Calculate business metrics
  const metricsQuery = useQuery({
    queryKey: ['metrics', businessId],
    queryFn: async () => {
      if (!businessId || !profile?.id) return null

      const users = await adminService.getUsers()
      const activities = await activityService.getActivities(profile.id)

      const orders = ordersQuery.data ?? []
      const promotions = promotionsQuery.data ?? []

      const earnedPoints = activities
        .filter((a) => a.type === 'earned')
        .reduce((sum, a) => sum + a.points, 0)

      const redeemedPoints = activities
        .filter((a) => a.type === 'redeemed')
        .reduce((sum, a) => sum + Math.abs(a.points), 0)

      return {
        totalMembers: users.length,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
        pointsIssued: earnedPoints,
        pointsRedeemed: redeemedPoints,
        activePromotions: promotions.filter((p) => new Date(p.expiresAt) > new Date()).length,
      }
    },
    enabled: !!businessId && !!profile?.id,
  })

  return {
    business: businessQuery.data ?? null,
    products: productsQuery.data ?? [],
    rewards: rewardsQuery.data ?? [],
    promotions: promotionsQuery.data ?? [],
    orders: ordersQuery.data ?? [],
    metrics: metricsQuery.data ?? null,
    isLoading:
      businessQuery.isLoading ||
      productsQuery.isLoading ||
      rewardsQuery.isLoading ||
      promotionsQuery.isLoading ||
      metricsQuery.isLoading,
  }
}
