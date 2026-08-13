import type { UserRole } from '@/types/domain'
import type { AuthFormValues } from '@/types/forms'

export type SignInPortal = 'admin' | 'business' | 'customer'

export const SIGN_IN_PORTALS: ReadonlyArray<{
  id: SignInPortal
  label: string
  description: string
}> = [
  { id: 'admin', label: 'Admin', description: 'Platform administration' },
  { id: 'business', label: 'Business', description: 'Owners and staff' },
  { id: 'customer', label: 'Customer', description: 'Rewards members' },
]

export function getSignInPortal(value: string | null | undefined): SignInPortal {
  if (value === 'admin' || value === 'business' || value === 'customer') return value
  if (value === 'member') return 'customer'
  return 'customer'
}

export function getRequestedRoleForPortal(portal: SignInPortal): AuthFormValues['role'] {
  if (portal === 'admin') return 'platform-admin'
  if (portal === 'business') return 'business-owner'
  return 'customer'
}

export function getSignInPortalForRole(role: UserRole): SignInPortal {
  if (role === 'platform-admin') return 'admin'
  if (role === 'business-owner' || role === 'business-staff') return 'business'
  return 'customer'
}

export function profileRoleMatchesRequestedRole(
  profileRole: UserRole,
  requestedRole: AuthFormValues['role'],
) {
  if (requestedRole === 'platform-admin') return profileRole === 'platform-admin'
  if (requestedRole === 'business-owner' || requestedRole === 'business-staff') {
    return profileRole === 'business-owner' || profileRole === 'business-staff'
  }
  return profileRole === 'customer'
}

export function getUnifiedSignInPath(
  portal?: SignInPortal,
  redirect?: string | null,
) {
  const search = new URLSearchParams()
  if (portal) search.set('portal', portal)
  if (redirect) search.set('redirect', redirect)
  const query = search.toString()
  return `/signin${query ? `?${query}` : ''}`
}
