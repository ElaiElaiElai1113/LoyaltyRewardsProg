import type { ProgramMembership, UserRole } from '@/types/domain'

export function canAccessProgramAdmin(
  globalRole: UserRole | null | undefined,
  membership: ProgramMembership | null | undefined,
) {
  return globalRole === 'platform-admin' || (
    membership?.role === 'program-admin' &&
    membership.status === 'active'
  )
}
