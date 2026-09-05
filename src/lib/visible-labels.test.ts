import { describe, expect, it } from 'vitest'

import { removeRetiredInternalLabels, sanitizeVisibleData } from './visible-labels'

describe('visible production labels', () => {
  it('preserves identifiers, email delivery addresses, links, and audit notes', () => {
    const record = {
      id: 'qa-record-1',
      email: 'qa@example.com',
      website: 'https://example.com/qa',
      token: 'opaque-qa-token',
      reference: 'QA-001',
      notes: 'QA-001 approved by administrator',
      nested: { email: 'user+qa@example.com' },
      business_name: 'QA Partner',
    }
    expect(sanitizeVisibleData(record)).toEqual({ ...record, business_name: 'Partner' })
  })
  it('removes retired testing labels without changing normal customer copy', () => {
    expect(removeRetiredInternalLabels('Pinas QA Customer')).toBe('Pinas Customer')
    expect(removeRetiredInternalLabels('QA Welcome Reward')).toBe('Welcome Reward')
    expect(removeRetiredInternalLabels('Quality assurance')).toBe('')
    expect(removeRetiredInternalLabels('Rewards Platform Administrator')).toBe(
      'Rewards Platform Administrator',
    )
  })

  it('sanitizes nested service data and preserves clean values', () => {
    const clean = { member: { fullName: 'RewardMe Member' }, rewards: [] }
    expect(sanitizeVisibleData(clean)).toBe(clean)
    expect(
      sanitizeVisibleData({
        member: { fullName: 'Pinas QA Customer' },
        rewards: [{ title: 'QA Welcome Reward' }],
      }),
    ).toEqual({
      member: { fullName: 'Pinas Customer' },
      rewards: [{ title: 'Welcome Reward' }],
    })
  })
})
