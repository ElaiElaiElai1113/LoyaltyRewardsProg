import { describe, expect, it } from 'vitest'

import type { ProgramMembership } from '@/types/domain'
import {
  dedupeAccessiblePrograms,
  selectHighestPriorityMembership,
  type AccessibleProgram,
} from './program-service'

describe('accessible program options', () => {
  it('shows one tenant option when a person has both member and staff roles', () => {
    const memberships: AccessibleProgram[] = [
      {
        id: 'medellin',
        name: 'Medellin Rewards',
        slug: 'medellin',
        role: 'member',
        hostname: 'www.medellinrewards.com',
      },
      {
        id: 'medellin',
        name: 'Medellin Rewards',
        slug: 'medellin',
        role: 'business-staff',
        hostname: 'www.medellinrewards.com',
      },
    ]

    expect(dedupeAccessiblePrograms(memberships)).toEqual([
      expect.objectContaining({ id: 'medellin', role: 'business-staff' }),
    ])
  })

  it('keeps genuinely different tenant programs available', () => {
    const memberships: AccessibleProgram[] = [
      {
        id: 'pinas',
        name: 'Pinas Rewards',
        slug: 'pinas',
        role: 'program-admin',
        hostname: 'pinas-rewards.vercel.app',
      },
      {
        id: 'guatemala',
        name: 'Guatemala Rewards',
        slug: 'guatemala',
        role: 'member',
        hostname: 'guatemalarewards.com',
      },
    ]

    expect(dedupeAccessiblePrograms(memberships)).toHaveLength(2)
  })

  it('selects program-admin access over member and business roles', () => {
    const membership = (id: string, role: ProgramMembership['role']): ProgramMembership => ({
      id,
      programId: 'program-one',
      profileId: 'profile-one',
      role,
      status: 'active',
      businessId: role === 'business-owner' || role === 'business-staff' ? 'business-one' : null,
    })

    expect(selectHighestPriorityMembership([
      membership('member', 'member'),
      membership('staff', 'business-staff'),
      membership('admin', 'program-admin'),
    ])?.id).toBe('admin')
  })
})
