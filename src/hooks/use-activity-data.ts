import { useQuery } from '@tanstack/react-query'

import { activityService } from '@/integrations/supabase/services/activity-service'
import { profileService } from '@/integrations/supabase/services/profile-service'

export function useActivityTimeline(profileId?: string) {
  return useQuery({
    queryKey: profileId ? ['activities', profileId] : ['activities', 'guest'],
    queryFn: () => activityService.getActivities(profileId!),
    enabled: Boolean(profileId),
  })
}

export function useActivityRewardBalance(profileId?: string) {
  return useQuery({
    queryKey: profileId ? ['reward-balance', profileId] : ['reward-balance', 'guest'],
    queryFn: () => profileService.getRewardBalance(profileId!),
    enabled: Boolean(profileId),
  })
}
