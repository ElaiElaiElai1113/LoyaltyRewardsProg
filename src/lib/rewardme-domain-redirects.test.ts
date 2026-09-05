import { describe, expect, it } from 'vitest'
// @ts-expect-error Operational script is a plain JavaScript module.
import { addRewardMeAuthRedirects } from '../../scripts/register-rewardme-auth-domains.mjs'

describe('RewardMe custom-domain auth redirects', () => {
  it('retains every existing tenant redirect and adds only the owned origins', () => {
    const existing = 'https://guatemalarewards.com/auth/confirm,https://rewardme-prod.vercel.app/reset-password'
    const redirects = addRewardMeAuthRedirects(existing).split(',')
    expect(redirects).toEqual(expect.arrayContaining(existing.split(',')))
    expect(redirects).toHaveLength(10)
    for (const host of ['myrewardme.com', 'www.myrewardme.com']) {
      for (const path of ['/', '/auth/confirm', '/reset-password', '/accept-invitation']) expect(redirects).toContain(`https://${host}${path}`)
    }
    expect(addRewardMeAuthRedirects(redirects.join(','))).toBe(redirects.join(','))
  })
})
