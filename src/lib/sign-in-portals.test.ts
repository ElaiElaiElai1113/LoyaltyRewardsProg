import { describe, expect, it } from 'vitest'

import {
  getRequestedRoleForPortal,
  getSignInPortal,
  getSignInPortalForRole,
  getUnifiedSignInPath,
  profileRoleMatchesRequestedRole,
} from '@/lib/sign-in-portals'

describe('unified sign-in portals', () => {
  it('maps each portal to the role that must be verified after authentication', () => {
    expect(getRequestedRoleForPortal('admin')).toBe('platform-admin')
    expect(getRequestedRoleForPortal('business')).toBe('business-owner')
    expect(getRequestedRoleForPortal('customer')).toBe('customer')
  })

  it('allows both business roles only through the business choice', () => {
    expect(profileRoleMatchesRequestedRole('business-owner', 'business-owner')).toBe(true)
    expect(profileRoleMatchesRequestedRole('business-staff', 'business-owner')).toBe(true)
    expect(profileRoleMatchesRequestedRole('customer', 'business-owner')).toBe(false)
    expect(profileRoleMatchesRequestedRole('platform-admin', 'business-owner')).toBe(false)
  })

  it('keeps admin and customer access isolated', () => {
    expect(profileRoleMatchesRequestedRole('platform-admin', 'platform-admin')).toBe(true)
    expect(profileRoleMatchesRequestedRole('customer', 'platform-admin')).toBe(false)
    expect(profileRoleMatchesRequestedRole('customer', 'customer')).toBe(true)
    expect(profileRoleMatchesRequestedRole('platform-admin', 'customer')).toBe(false)
  })

  it('normalizes old member links and creates one canonical sign-in path', () => {
    expect(getSignInPortal('member')).toBe('customer')
    expect(getSignInPortal('unknown')).toBe('customer')
    expect(getSignInPortalForRole('business-staff')).toBe('business')
    expect(getUnifiedSignInPath('admin', '/admin/portal')).toBe(
      '/signin?portal=admin&redirect=%2Fadmin%2Fportal',
    )
  })
})
