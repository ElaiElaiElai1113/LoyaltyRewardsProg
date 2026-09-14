import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.hoisted(() => vi.fn())
vi.mock('@/integrations/supabase/services/shared', () => ({
  camelCaseRow: (row: Record<string, unknown>) => row,
  friendlySupabaseError: (error: { message?: string } | null, fallback: string) => error?.message ?? fallback,
  requireSupabase: () => ({ rpc }),
}))
vi.mock('@/features/tenant/tenant-service', () => ({ getActiveProgram: () => ({ id: 'program-one' }) }))

import { loyalityService } from './loyality-service'

describe('Loyality voucher rejection contract', () => {
  beforeEach(() => { rpc.mockReset() })

  it.each(['Voucher option not found', 'Not enough points'])('preserves definitive no-commit SQLSTATE for %s', async (message) => {
    rpc.mockResolvedValue({ data: null, error: { code: 'LY001', message } })
    await expect(loyalityService.redeemCatalogVoucher('catalog-one', 'request-one')).rejects.toMatchObject({
      name: 'VoucherRequestRejectedError', code: 'LY001', message,
    })
  })

  it.each([
    { code: 'P0001', message: 'Not enough points' },
    { code: '42501', message: 'Membership suspended' },
    { code: 'PGRST301', message: 'Expired token' },
    { message: 'Voucher option not found' },
    { message: 'Network request failed' },
  ])('keeps non-LY001 outcomes uncertain, regardless of message: %j', async (error) => {
    rpc.mockResolvedValue({ data: null, error })
    await expect(loyalityService.redeemCatalogVoucher('catalog-one', 'request-one')).rejects.toMatchObject({ name: 'Error', message: error.message })
  })

  it('keeps a dropped transport response uncertain', async () => {
    rpc.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(loyalityService.redeemCatalogVoucher('catalog-one', 'request-one')).rejects.toBeInstanceOf(TypeError)
  })
})
