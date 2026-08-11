import { describe, expect, it } from 'vitest'

import { rewardMeLaunchWorkstreams, summarizeLaunchReadiness } from '@/features/platform/launch-readiness'

describe('RewardMe launch readiness', () => {
  it('keeps every workstream actionable and owned', () => {
    expect(rewardMeLaunchWorkstreams.length).toBeGreaterThanOrEqual(10)
    for (const workstream of rewardMeLaunchWorkstreams) {
      expect(workstream.owner).not.toBe('')
      expect(workstream.nextAction).not.toBe('')
      expect(workstream.description).not.toBe('')
    }
  })

  it('does not misrepresent approval or external work as verified', () => {
    expect(rewardMeLaunchWorkstreams.find((item) => item.id === 'commercial')?.status).toBe('approval-required')
    expect(rewardMeLaunchWorkstreams.find((item) => item.id === 'billing')?.status).toBe('approval-required')
    expect(rewardMeLaunchWorkstreams.find((item) => item.id === 'authenticated-qa')?.status).toBe('external-required')
  })

  it('summarizes the register without losing entries', () => {
    const summary = summarizeLaunchReadiness()
    expect(Object.values(summary).reduce((total, count) => total + count, 0)).toBe(rewardMeLaunchWorkstreams.length)
  })
})
