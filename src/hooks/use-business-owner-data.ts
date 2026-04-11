import { useQuery } from '@tanstack/react-query'

import { readStore } from '@/lib/mock-store'
import { useAuth } from './use-auth'

export function useBusinessOwnerData() {
  const { session } = useAuth()

  const businessId = session?.businessId

  // Get the business details
  const businessQuery = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      if (!businessId) return null
      const store = readStore()
      return store.businesses.find((b) => b.id === businessId) ?? null
    },
    enabled: !!businessId,
  })

  // Get products for this business only
  const productsQuery = useQuery({
    queryKey: ['products', businessId],
    queryFn: async () => {
      if (!businessId) return []
      const store = readStore()
      return store.products.filter((p) => p.businessId === businessId)
    },
    enabled: !!businessId,
  })

  // Get rewards for this business only
  const rewardsQuery = useQuery({
    queryKey: ['rewards', businessId],
    queryFn: async () => {
      if (!businessId) return []
      const store = readStore()
      return store.rewards.filter((r) => r.businessId === businessId)
    },
    enabled: !!businessId,
  })

  // Get promotions for this business only
  const promotionsQuery = useQuery({
    queryKey: ['promotions', businessId],
    queryFn: async () => {
      if (!businessId) return []
      const store = readStore()
      return store.promotions.filter((p) => p.businessId === businessId)
    },
    enabled: !!businessId,
  })

  // Get orders for this business only
  const ordersQuery = useQuery({
    queryKey: ['orders', businessId],
    queryFn: async () => {
      if (!businessId) return []
      const store = readStore()
      return store.orders.filter((o) => o.businessId === businessId)
    },
    enabled: !!businessId,
  })

  // Calculate business metrics
  const metricsQuery = useQuery({
    queryKey: ['metrics', businessId],
    queryFn: async () => {
      if (!businessId) return null
      const store = readStore()
      const orders = store.orders.filter((o) => o.businessId === businessId)
      const promotions = store.promotions.filter((p) => p.businessId === businessId)

      // Activities where points were earned (not just any activity)
      const earnedPoints = store.activities
        .filter((a) => a.type === 'earned')
        .reduce((sum, a) => sum + a.points, 0)

      const redeemedPoints = store.activities
        .filter((a) => a.type === 'redeemed')
        .reduce((sum, a) => sum + Math.abs(a.points), 0)

      return {
        totalMembers: store.profiles.filter((p) => p.role === 'customer').length,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
        pointsIssued: earnedPoints,
        pointsRedeemed: redeemedPoints,
        activePromotions: promotions.filter((p) => new Date(p.expiresAt) > new Date()).length,
      }
    },
    enabled: !!businessId,
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
