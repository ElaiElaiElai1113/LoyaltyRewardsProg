import { describe, expect, it } from 'vitest'

import {
  getRoleScopedScreenshotRoutes,
  isRoleScopedGuideProgram,
  resolveRoleScopedGuideAudience,
} from './guide-role-scope'

describe('role-scoped platform guides', () => {
  it('limits role-scoped behavior to RewardMe and Wondertown', () => {
    expect(isRoleScopedGuideProgram('pinas')).toBe(true)
    expect(isRoleScopedGuideProgram('wondertown')).toBe(true)
    expect(isRoleScopedGuideProgram('pinasrewards')).toBe(false)
    expect(isRoleScopedGuideProgram('medellin')).toBe(false)
  })

  it('maps every authenticated role to one guide audience', () => {
    expect(resolveRoleScopedGuideAudience(null)).toBe('public')
    expect(resolveRoleScopedGuideAudience('customer')).toBe('customer')
    expect(resolveRoleScopedGuideAudience('business-owner')).toBe('business')
    expect(resolveRoleScopedGuideAudience('business-staff')).toBe('business')
    expect(resolveRoleScopedGuideAudience('platform-admin')).toBe('admin')
  })

  it('never exposes another portal through authenticated screenshot guidance', () => {
    expect(getRoleScopedScreenshotRoutes('public')).toEqual(['/shop', '/business'])
    expect(getRoleScopedScreenshotRoutes('customer')).toEqual(['/shop'])
    expect(getRoleScopedScreenshotRoutes('business')).toEqual([])
    expect(getRoleScopedScreenshotRoutes('admin')).toEqual([])
  })
})
