import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { adminService } from '@/integrations/supabase/services/admin-service'
import { promotionsService } from '@/integrations/supabase/services/promotions-service'
import { rewardsService } from '@/integrations/supabase/services/rewards-service'
import type {
  PromotionDraftFormValues,
  RewardAdjustmentFormValues,
  RewardDraftFormValues,
} from '@/types/forms'
import type { Profile } from '@/types/domain'

const adminKeys = {
  users: ['admin-users'] as const,
  overview: ['admin-overview'] as const,
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

export function useCreatePromotion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: PromotionDraftFormValues) => promotionsService.createPromotion(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['promotions'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview })
    },
  })
}
