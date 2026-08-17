import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/lib/language'
import { membershipService } from '@/integrations/supabase/services/membership-service'

export const membershipKeys = {
  mine: (profileId?: string) => ['membership', profileId ?? 'guest'] as const,
}

function isMembershipActive(membership: Awaited<ReturnType<typeof membershipService.getMyMembership>>) {
  return membership?.status === 'active' && new Date(membership.currentPeriodEnd).getTime() > Date.now()
}

function requireLaunchCustomer(profile: { id?: string | null; fullName?: string | null; email?: string | null; phone?: string | null } | null | undefined) {
  if (!profile?.id) {
    throw new Error('Sign in before using reward value actions.')
  }
  if (!profile.fullName?.trim() || !profile.email?.trim() || !profile.phone?.trim()) {
    throw new Error('Add your full name, email, and WhatsApp or phone before using rewards.')
  }
}

export function useMembership() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const localizedMembershipError = (error: Error, fallback: string) => {
    const translated = t(error.message)
    return translated === error.message ? t(fallback) : translated
  }
  const query = useQuery({
    queryKey: membershipKeys.mine(profile?.id),
    queryFn: () => membershipService.getMyMembership(),
    enabled: Boolean(profile?.id),
    initialData: profile?.membership ?? undefined,
  })

  function invalidateMembershipData() {
    if (!profile?.id) return

    void queryClient.invalidateQueries({ queryKey: membershipKeys.mine(profile.id) })
    void queryClient.invalidateQueries({ queryKey: ['reward-balance', profile.id] })
    void queryClient.invalidateQueries({ queryKey: ['activities', profile.id] })
  }

  const subscribe = useMutation({
    mutationFn: () => {
      requireLaunchCustomer(profile)
      return membershipService.mockSubscribe()
    },
    onSuccess: () => {
      invalidateMembershipData()
      toast.success(t('Demo membership activated. $10 credit added.'))
    },
    onError: (error: Error) => toast.error(localizedMembershipError(error, 'Membership could not be activated.')),
  })

  const renew = useMutation({
    mutationFn: () => {
      requireLaunchCustomer(profile)
      return membershipService.mockRenew()
    },
    onSuccess: () => {
      invalidateMembershipData()
      toast.success(t('Demo renewal complete.'))
    },
    onError: (error: Error) => toast.error(localizedMembershipError(error, 'Membership could not be renewed.')),
  })

  const cancel = useMutation({
    mutationFn: () => membershipService.mockCancel(),
    onSuccess: () => {
      invalidateMembershipData()
      toast.success(t('Membership canceled. Your balance is preserved.'))
    },
    onError: (error: Error) => toast.error(localizedMembershipError(error, 'Membership could not be canceled.')),
  })

  const membership = query.data ?? null

  return {
    membership,
    isActive: isMembershipActive(membership),
    isLoading: query.isLoading,
    subscribe,
    renew,
    cancel,
  }
}
