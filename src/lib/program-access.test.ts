import { describe, expect, it } from 'vitest'

import { canAccessProgramAdmin } from '@/lib/program-access'
import type { ProgramMembership } from '@/types/domain'

const membership: ProgramMembership = {
  id: 'membership',
  programId: 'program',
  profileId: 'profile',
  role: 'program-admin',
  status: 'active',
  businessId: null,
}

describe('program admin access', () => {
  it('allows an active program administrator', () => {
    expect(canAccessProgramAdmin('customer', membership)).toBe(true)
  })

  it('allows a global platform administrator', () => {
    expect(canAccessProgramAdmin('platform-admin', null)).toBe(true)
  })

  it('rejects invited, suspended, and non-admin memberships', () => {
    expect(canAccessProgramAdmin('customer', { ...membership, status: 'invited' })).toBe(false)
    expect(canAccessProgramAdmin('customer', { ...membership, status: 'suspended' })).toBe(false)
    expect(canAccessProgramAdmin('customer', { ...membership, role: 'member' })).toBe(false)
  })
})
