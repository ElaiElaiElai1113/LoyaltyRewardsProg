import { describe, expect, it } from 'vitest'

import { removeRetiredInternalLabels, sanitizeVisibleData } from './visible-labels'

describe('visible production labels', () => {
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
