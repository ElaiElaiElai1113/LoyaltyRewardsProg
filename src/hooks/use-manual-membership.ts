import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getActiveProgram } from '@/features/tenant/tenant-service'
import { useAuth } from '@/hooks/use-auth'
import { membershipKeys } from '@/hooks/use-membership'
import { manualMembershipService } from '@/integrations/supabase/services/manual-membership-service'
import type { ManualMembershipTier } from '@/types/domain'

export const manualMembershipKeys = {
  requests: (profileId?: string) => ['manual-membership-requests', getActiveProgram().id, profileId ?? 'guest'] as const,
  events: (profileId?: string) => ['manual-membership-events', getActiveProgram().id, profileId ?? 'guest'] as const,
  operations: ['manual-membership-operations'] as const,
  operationsEvents: ['manual-membership-operations-events'] as const,
}

function requireCompleteMember(profile: { id?: string | null; fullName?: string | null; email?: string | null; phone?: string | null } | null | undefined) {
  if (!profile?.id) throw new Error('Sign in before requesting membership access.')
  if (!profile.fullName?.trim() || !profile.email?.trim() || !profile.phone?.trim()) {
    throw new Error('Add your full name, email, and WhatsApp or phone in your profile first.')
  }
}

export function useManualMembership() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const requests = useQuery({
    queryKey: manualMembershipKeys.requests(profile?.id),
    queryFn: () => manualMembershipService.getMyRequests(),
    enabled: Boolean(profile?.id),
  })
  const events = useQuery({
    queryKey: manualMembershipKeys.events(profile?.id),
    queryFn: () => manualMembershipService.getMyEvents(),
    enabled: Boolean(profile?.id),
  })

  function refresh() {
    if (!profile?.id) return
    void queryClient.invalidateQueries({ queryKey: manualMembershipKeys.requests(profile.id) })
    void queryClient.invalidateQueries({ queryKey: manualMembershipKeys.events(profile.id) })
    void queryClient.invalidateQueries({ queryKey: membershipKeys.mine(profile.id) })
  }

  const requestMembership = useMutation({
    mutationFn: ({ tier, note }: { tier: ManualMembershipTier; note: string }) => {
      requireCompleteMember(profile)
      return manualMembershipService.requestMembership(tier, note)
    },
    onSuccess: () => {
      refresh()
      toast.success('Membership request sent for review.')
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const requestCancellation = useMutation({
    mutationFn: (reason: string) => manualMembershipService.requestCancellation(reason),
    onSuccess: () => {
      refresh()
      toast.success('Cancellation request sent for review.')
    },
    onError: (error: Error) => toast.error(error.message),
  })
  const cancelPendingRequest = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason: string }) =>
      manualMembershipService.cancelPendingRequest(requestId, reason),
    onSuccess: () => {
      refresh()
      toast.success('Pending request canceled.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return { requests, events, requestMembership, requestCancellation, cancelPendingRequest }
}
