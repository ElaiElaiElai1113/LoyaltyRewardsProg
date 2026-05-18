import assert from 'node:assert/strict'

import {
  earlyAccessMessageLines,
  earlyAccessSubscribeButtonLabel,
  earlyAccessSubscribeFields,
} from '../src/features/early-access/early-access-content.js'
import { isPickupWindow, normalizeCheckoutItems } from '../src/features/critical-flows/critical-flow.js'

function runTest(name: string, fn: () => void) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

runTest('normalizeCheckoutItems aggregates duplicate products for one business', () => {
  const result = normalizeCheckoutItems([
    { productId: 'prod-1', businessId: 'biz-1', quantity: 1 },
    { productId: 'prod-1', businessId: 'biz-1', quantity: 2 },
    { productId: 'prod-2', businessId: 'biz-1', quantity: 1 },
  ])

  assert.equal(result.businessId, 'biz-1')
  assert.deepEqual(result.items, [
    { productId: 'prod-1', quantity: 3 },
    { productId: 'prod-2', quantity: 1 },
  ])
})

runTest('normalizeCheckoutItems rejects mixed-business carts', () => {
  assert.throws(
    () =>
      normalizeCheckoutItems([
        { productId: 'prod-1', businessId: 'biz-1', quantity: 1 },
        { productId: 'prod-2', businessId: 'biz-2', quantity: 1 },
      ]),
    /one business at a time/i,
  )
})

runTest('normalizeCheckoutItems rejects invalid quantities', () => {
  assert.throws(
    () =>
      normalizeCheckoutItems([
        { productId: 'prod-1', businessId: 'biz-1', quantity: 0 },
      ]),
    /invalid item/i,
  )
})

runTest('isPickupWindow only accepts supported redemption windows', () => {
  assert.equal(isPickupWindow('Now'), true)
  assert.equal(isPickupWindow('Within 30 mins'), true)
  assert.equal(isPickupWindow('Tonight'), false)
})

runTest('early access content preserves the approved conversion copy', () => {
  assert.deepEqual(earlyAccessMessageLines, [
    'Hey,',
    'We’re tired of watching people work hard but still struggle to afford the life they want — vacations, freedom, extras.',
    'That’s why we’re building Medellin Rewards: the highest-paying rewards program. Earn 20-100% back on almost everything you already buy daily.',
    'No extra spending. Just real money back to help you do more of what you love.',
    'As an early adopter, you’ll get exclusive benefits before anyone else.',
    'Ready to earn more?',
    '[Subscribe button: Enter your WhatsApp number and/or email]',
    'Let’s make this happen together.',
    'Medellin Rewards Team"',
  ])
})

runTest('early access subscribe form only exposes WhatsApp and email contact fields', () => {
  assert.deepEqual(earlyAccessSubscribeFields.map((field) => field.name), ['whatsapp', 'email'])
  assert.equal(earlyAccessSubscribeButtonLabel, 'Subscribe')
})
