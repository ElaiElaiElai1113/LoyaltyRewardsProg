import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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
    queryFn: () => businessService.getBusinesses(),
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
    },
  })
}

export function useCreateReward() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: RewardDraftFormValues) => rewardsService.createReward(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rewards'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
    },
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: ProductDraftFormValues) => productsService.createProduct(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
    },
  })
}

export function useCreatePromotion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: PromotionDraftFormValues & { businessId: string }) =>
      promotionsService.createPromotion(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['promotions'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
    },
  })
}
