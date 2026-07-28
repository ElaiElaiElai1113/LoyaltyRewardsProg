import { describe, expect, it } from 'vitest'

import { analyzeTenantImport } from '@/lib/tenant-import'

describe('tenant import analysis', () => {
  it('summarizes valid imports and financial totals', () => {
    const result = analyzeTenantImport({
      users: [{ id: 'u1', email: 'member@example.com' }],
      businesses: [{ id: 'b1', slug: 'coffee' }],
      balances: [{ id: 'r1', userId: 'u1', points: 125 }],
      transactions: [{ id: 't1', userId: 'u1', businessId: 'b1', total: 42.5 }],
      giftCards: [{ status: 'active', remainingValue: 20 }],
      agreements: [{}],
      referrals: [],
    })
    expect(result.valid).toBe(true)
    expect(result.totals).toEqual({ balancePoints: 125, transactionValue: 42.5, giftCardOutstanding: 20 })
  })

  it('rejects cross-reference and duplicate identity errors', () => {
    const result = analyzeTenantImport({
      users: [{ id: 'u1', email: 'same@example.com' }, { id: 'u2', email: 'SAME@example.com' }],
      businesses: [],
      balances: [{ id: 'r1', userId: 'missing', points: -1 }],
      transactions: [],
      giftCards: [],
      agreements: [],
      referrals: [],
    })
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toContain('duplicate user')
    expect(result.errors.join(' ')).toContain('unknown user')
  })
})
