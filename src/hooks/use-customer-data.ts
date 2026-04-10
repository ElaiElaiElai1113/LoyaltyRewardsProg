import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { activityService } from '@/integrations/supabase/services/activity-service'
import { profileService } from '@/integrations/supabase/services/profile-service'
import { promotionsService } from '@/integrations/supabase/services/promotions-service'
import { rewardsService } from '@/integrations/supabase/services/rewards-service'
import type { ProfileFormValues, RedeemFormValues } from '@/types/forms'

const customerKeys = {
  rewardBalance: (profileId: string) => ['reward-balance', profileId] as const,
  rewards: ['rewards'] as const,
  reward: (rewardId: string) => ['reward', rewardId] as const,
  promotions: ['promotions'] as const,
  activities: (profileId: string) => ['activities', profileId] as const,
  profile: (profileId: string) => ['profile', profileId] as const,
}

export function useRewardBalance(profileId?: string) {
  return useQuery({
    queryKey: profileId ? customerKeys.rewardBalance(profileId) : ['reward-balance', 'guest'],
    queryFn: () => profileService.getRewardBalance(profileId!),
    enabled: Boolean(profileId),
  })
}

export function useRewards() {
  return useQuery({
    queryKey: customerKeys.rewards,
    queryFn: () => rewardsService.getRewards(),
  })
}

export function useReward(rewardId?: string) {
  return useQuery({
    queryKey: rewardId ? customerKeys.reward(rewardId) : ['reward', 'missing'],
    queryFn: () => rewardsService.getRewardById(rewardId!),
    enabled: Boolean(rewardId),
  })
}

export function usePromotions() {
  return useQuery({
    queryKey: customerKeys.promotions,
    queryFn: () => promotionsService.getPromotions(),
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

export function useRedeemReward(profileId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: RedeemFormValues & { rewardId: string }) =>
      rewardsService.redeemReward({
        ...values,
        profileId: profileId!,
      }),
    onSuccess: (_, variables) => {
      if (!profileId) {
        return
      }

      void queryClient.invalidateQueries({ queryKey: customerKeys.rewardBalance(profileId) })
      void queryClient.invalidateQueries({ queryKey: customerKeys.activities(profileId) })
      void queryClient.invalidateQueries({ queryKey: customerKeys.rewards })
      void queryClient.invalidateQueries({ queryKey: customerKeys.reward(variables.rewardId) })
    },
  })
}

export function useUpdateProfile(profileId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: ProfileFormValues) => profileService.updateProfile(profileId!, values),
    onSuccess: () => {
      if (!profileId) {
        return
      }

      void queryClient.invalidateQueries({ queryKey: customerKeys.profile(profileId) })
    },
  })
}
