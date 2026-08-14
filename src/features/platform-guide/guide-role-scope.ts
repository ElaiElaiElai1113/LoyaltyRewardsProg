import type { UserRole } from '@/types/domain'

export type RoleScopedGuideAudience = 'public' | 'customer' | 'business' | 'admin'

export function isRoleScopedGuideProgram(programSlug: string) {
  return programSlug === 'pinas' || programSlug === 'wondertown'
}

export function resolveRoleScopedGuideAudience(
  role: UserRole | null | undefined,
): RoleScopedGuideAudience {
  if (role === 'customer') return 'customer'
  if (role === 'business-owner' || role === 'business-staff') return 'business'
  if (role === 'platform-admin') return 'admin'
  return 'public'
}

export function getRoleScopedScreenshotRoutes(audience: RoleScopedGuideAudience) {
  if (audience === 'public') return ['/shop', '/business']
  if (audience === 'customer') return ['/shop']
  return []
}
