import { useQuery } from '@tanstack/react-query'

import { programService } from '@/features/program/program-service'
import { useAuth } from '@/hooks/use-auth'
import { getActiveProgram } from '@/features/tenant/tenant-service'

export function useCurrentProgramMembership() {
  const { profile } = useAuth()
  const programId = getActiveProgram().id
  return useQuery({
    queryKey: ['program-membership', programId, profile?.id],
    queryFn: () => programService.getCurrentMembership(profile!.id),
    enabled: Boolean(profile),
  })
}

export function useAccessiblePrograms() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: ['accessible-programs', profile?.id],
    queryFn: () => programService.listAccessiblePrograms(profile!.id),
    enabled: Boolean(profile),
  })
}

export function useProgramInvitations() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: ['program-invitations', profile?.id],
    queryFn: () => programService.listInvitations(profile!.id),
    enabled: Boolean(profile),
  })
}
