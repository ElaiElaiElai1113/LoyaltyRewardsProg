import type { UserRole } from '@/types/domain'

export function getSignOutRedirectPath(role: UserRole | null | undefined) {
  if (role === 'platform-admin') return '/signin?portal=admin'
  if (role === 'business-owner' || role === 'business-staff') return '/signin?portal=business'
  return '/signin'
}
