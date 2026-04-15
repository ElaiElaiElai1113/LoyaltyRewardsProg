import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { adminService } from '@/integrations/supabase/services/admin-service'
import { businessService } from '@/integrations/supabase/services/business-service'
import { productsService } from '@/integrations/supabase/services/products-service'
import { promotionsService } from '@/integrations/supabase/services/promotions-service'
import { rewardsService } from '@/integrations/supabase/services/rewards-service'
import type {
  BusinessSettingsFormValues,
  ProductDraftFormValues,
  PromotionDraftFormValues,
  RewardAdjustmentFormValues,
  RewardDraftFormValues,
} from '@/types/forms'
import type { Profile } from '@/types/domain'

const adminKeys = {
  users: ['admin-users'] as const,
  overview: ['admin-overview'] as const,
  businesses: ['businesses'] as const,
}

export function useAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users,
    queryFn: () => adminService.getUsers(),
  })
}

export function useAdminOverview() {
  return useQuery({
    queryKey: adminKeys.overview,
    queryFn: () => adminService.getOverview(),
  })
}

export function useAdminProducts(businessId?: string) {
  return useQuery({
    queryKey: ['products', businessId ?? 'all'],
    queryFn: () => productsService.getProducts(businessId),
  })
}

export function useAdminBusinesses() {
  return useQuery({
    queryKey: adminKeys.businesses,
    queryFn: async () => [await businessService.getSingleBusiness()],
  })
}

export function useUpdateBusinessSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ businessId, values }: { businessId: string; values: BusinessSettingsFormValues }) =>
      businessService.updateSettings(businessId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.businesses })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      toast.success('Settings updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Update failed: ${error.message}`)
    },
  })
}

export function useAdjustRewards(actor?: Profile | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: RewardAdjustmentFormValues) => adminService.adjustRewards(values, actor!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      void queryClient.invalidateQueries({ queryKey: ['reward-balance'] })
      void queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast.success('Points adjusted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Adjustment failed: ${error.message}`)
    },
  })
}

export function useCreateReward(actor?: Profile | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: RewardDraftFormValues) =>
      rewardsService.createReward(values, actor?.fullName ?? 'Platform Admin'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rewards'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      toast.success('Reward created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Creation failed: ${error.message}`)
    },
  })
}

export function useCreateProduct(actor?: Profile | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: ProductDraftFormValues) =>
      productsService.createProduct(values, actor?.fullName ?? 'Platform Admin'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      toast.success('Product created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Creation failed: ${error.message}`)
    },
  })
}

export function useCreatePromotion(actor?: Profile | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: PromotionDraftFormValues & { businessId: string }) =>
      promotionsService.createPromotion(values, actor?.fullName ?? 'Platform Admin'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['promotions'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      toast.success('Promotion created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Creation failed: ${error.message}`)
    },
  })
}

export function useFulfillRedemption(actor?: Profile | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (redemptionId: string) => adminService.fulfillRedemption(redemptionId, actor!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      void queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast.success('Redemption fulfilled successfully')
    },
    onError: (error: Error) => {
      toast.error(`Fulfillment failed: ${error.message}`)
    },
  })
}

export function useDeleteReward(actorName = 'Platform Admin') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rewardId: string) => rewardsService.deleteReward(rewardId, actorName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rewards'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      toast.success('Reward deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`)
    },
  })
}

export function useDeleteProduct(actorName = 'Platform Admin') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) => productsService.deleteProduct(productId, actorName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      toast.success('Product deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`)
    },
  })
}

export function useDeletePromotion(actorName = 'Platform Admin') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (promotionId: string) => promotionsService.deletePromotion(promotionId, actorName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['promotions'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
      toast.success('Promotion deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`)
    },
  })
}

export function useUpdateReward(actorName = 'Platform Admin') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ rewardId, values }: { rewardId: string; values: Partial<RewardDraftFormValues> }) =>
      rewardsService.updateReward(rewardId, values, actorName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rewards'] })
      toast.success('Reward updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Update failed: ${error.message}`)
    },
  })
}

export function useUpdateProduct(actorName = 'Platform Admin') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, values }: { productId: string; values: Partial<ProductDraftFormValues> }) =>
      productsService.updateProduct(productId, values, actorName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Update failed: ${error.message}`)
    },
  })
}

export function useUpdatePromotion(actorName = 'Platform Admin') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ promotionId, values }: { promotionId: string; values: Partial<PromotionDraftFormValues> }) =>
      promotionsService.updatePromotion(promotionId, values, actorName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['promotions'] })
      toast.success('Promotion updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Update failed: ${error.message}`)
    },
  })
}
