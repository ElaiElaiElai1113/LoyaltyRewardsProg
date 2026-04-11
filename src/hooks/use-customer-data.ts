import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { activityService } from '@/integrations/supabase/services/activity-service'
import { businessService } from '@/integrations/supabase/services/business-service'
import { cartService } from '@/integrations/supabase/services/cart-service'
import { ordersService } from '@/integrations/supabase/services/orders-service'
import { productsService } from '@/integrations/supabase/services/products-service'
import { profileService } from '@/integrations/supabase/services/profile-service'
import { promotionsService } from '@/integrations/supabase/services/promotions-service'
import { rewardsService } from '@/integrations/supabase/services/rewards-service'
import type { ProfileFormValues, RedeemFormValues } from '@/types/forms'

const customerKeys = {
  businesses: ['businesses'] as const,
  rewardBalance: (profileId: string) => ['reward-balance', profileId] as const,
  rewards: (businessId?: string) => ['rewards', businessId ?? 'all'] as const,
  reward: (rewardId: string) => ['reward', rewardId] as const,
  products: (businessId?: string) => ['products', businessId ?? 'all'] as const,
  product: (productId: string) => ['product', productId] as const,
  promotions: (businessId?: string) => ['promotions', businessId ?? 'all'] as const,
  activities: (profileId: string) => ['activities', profileId] as const,
  profile: (profileId: string) => ['profile', profileId] as const,
  cart: ['cart'] as const,
  orders: (profileId: string) => ['orders', profileId] as const,
}

export function useBusinesses() {
  return useQuery({
    queryKey: customerKeys.businesses,
    queryFn: () => businessService.getBusinesses(),
  })
}

export function useRewardBalance(profileId?: string) {
  return useQuery({
    queryKey: profileId ? customerKeys.rewardBalance(profileId) : ['reward-balance', 'guest'],
    queryFn: () => profileService.getRewardBalance(profileId!),
    enabled: Boolean(profileId),
  })
}

export function useRewards(businessId?: string) {
  return useQuery({
    queryKey: customerKeys.rewards(businessId),
    queryFn: () => rewardsService.getRewards(businessId),
  })
}

export function useReward(rewardId?: string) {
  return useQuery({
    queryKey: rewardId ? customerKeys.reward(rewardId) : ['reward', 'missing'],
    queryFn: () => rewardsService.getRewardById(rewardId!),
    enabled: Boolean(rewardId),
  })
}

export function useProducts(businessId?: string) {
  return useQuery({
    queryKey: customerKeys.products(businessId),
    queryFn: () => productsService.getProducts(businessId),
  })
}

export function useProduct(productId?: string) {
  return useQuery({
    queryKey: productId ? customerKeys.product(productId) : ['product', 'missing'],
    queryFn: () => productsService.getProductById(productId!),
    enabled: Boolean(productId),
  })
}

export function usePromotions(businessId?: string) {
  return useQuery({
    queryKey: customerKeys.promotions(businessId),
    queryFn: () => promotionsService.getPromotions(businessId),
  })
}

export function useActivities(profileId?: string) {
  return useQuery({
    queryKey: profileId ? customerKeys.activities(profileId) : ['activities', 'guest'],
    queryFn: () => activityService.getActivities(profileId!),
    enabled: Boolean(profileId),
  })
}

export function useProfile(profileId?: string) {
  return useQuery({
    queryKey: profileId ? customerKeys.profile(profileId) : ['profile', 'guest'],
    queryFn: () => profileService.getProfile(profileId!),
    enabled: Boolean(profileId),
  })
}

export function useCart() {
  return useQuery({
    queryKey: customerKeys.cart,
    queryFn: () => cartService.getCart(),
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity?: number }) =>
      cartService.addItem(productId, quantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.cart })
    },
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartService.updateQuantity(productId, quantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.cart })
    },
  })
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) => cartService.removeItem(productId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.cart })
    },
  })
}

export function usePlaceOrder(profileId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ businessId, paymentMethod }: { businessId: string; paymentMethod: string }) =>
      ordersService.placeOrder(profileId!, businessId, paymentMethod),
    onSuccess: () => {
      if (!profileId) return
      void queryClient.invalidateQueries({ queryKey: customerKeys.cart })
      void queryClient.invalidateQueries({ queryKey: customerKeys.orders(profileId) })
      void queryClient.invalidateQueries({ queryKey: customerKeys.rewardBalance(profileId) })
      void queryClient.invalidateQueries({ queryKey: customerKeys.activities(profileId) })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useOrders(profileId?: string) {
  return useQuery({
    queryKey: profileId ? customerKeys.orders(profileId) : ['orders', 'guest'],
    queryFn: () => ordersService.getOrders(profileId!),
    enabled: Boolean(profileId),
  })
}

export function useOrder(orderId?: string | null) {
  return useQuery({
    queryKey: orderId ? ['order', orderId] : ['order', 'missing'],
    queryFn: () => ordersService.getOrderById(orderId!),
    enabled: Boolean(orderId),
  })
}

export function useRedeemReward(profileId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: RedeemFormValues & { rewardId: string }) =>
      rewardsService.redeemReward({
        ...values,
        profileId: profileId!,
      }),
    onSuccess: (_, variables) => {
      if (!profileId) return
      void queryClient.invalidateQueries({ queryKey: customerKeys.rewardBalance(profileId) })
      void queryClient.invalidateQueries({ queryKey: customerKeys.activities(profileId) })
      void queryClient.invalidateQueries({ queryKey: ['rewards'] })
      void queryClient.invalidateQueries({ queryKey: customerKeys.reward(variables.rewardId) })
    },
  })
}

export function useUpdateProfile(profileId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: ProfileFormValues) => profileService.updateProfile(profileId!, values),
    onSuccess: () => {
      if (!profileId) return
      void queryClient.invalidateQueries({ queryKey: customerKeys.profile(profileId) })
    },
  })
}
