import { createHmac } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { verifyStripeSignature } from './_stripe-signature.js'

describe('Stripe webhook signature verification', () => {
  it('accepts a current matching signature when Stripe sends multiple v1 values', () => {
    const now = Date.UTC(2026, 7, 11, 9, 0, 0)
    const timestamp = String(now / 1000)
    const payload = '{"id":"evt_rewardme"}'
    const secret = 'whsec_test_rewardme'
    const matching = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')

    expect(verifyStripeSignature(payload, `t=${timestamp},v1=${'0'.repeat(64)},v1=${matching}`, secret, now)).toBe(true)
  })

  it('rejects stale, malformed and mismatched signatures', () => {
    const now = Date.UTC(2026, 7, 11, 9, 0, 0)
    const oldTimestamp = String(now / 1000 - 301)

    expect(verifyStripeSignature('{}', `t=${oldTimestamp},v1=${'0'.repeat(64)}`, 'whsec_test', now)).toBe(false)
    expect(verifyStripeSignature('{}', 't=not-a-number,v1=bad', 'whsec_test', now)).toBe(false)
    expect(verifyStripeSignature('{}', '', 'whsec_test', now)).toBe(false)
  })
})
