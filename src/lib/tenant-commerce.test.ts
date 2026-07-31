import { describe, expect, it } from 'vitest'

import { formatTenantCurrency, getDefaultGiftCardValueLabel } from '@/lib/tenant-commerce'

describe('tenant commerce formatting', () => {
  it.each([
    [{ locale: 'en-PH', currency: 'PHP' }, /₱|PHP/],
    [{ locale: 'es-GT', currency: 'GTQ' }, /Q|GTQ/],
    [{ locale: 'en-US', currency: 'USD' }, /\$/],
  ] as const)('formats values with the active tenant currency', (program, currencyMarker) => {
    expect(formatTenantCurrency(250, program)).toMatch(currencyMarker)
  })

  it('uses the active tenant currency for new gift-card labels', () => {
    expect(getDefaultGiftCardValueLabel({ locale: 'es-GT', currency: 'GTQ' })).toMatch(/Q|GTQ/)
    expect(getDefaultGiftCardValueLabel({ locale: 'en-PH', currency: 'PHP' })).not.toContain('USD')
  })
})
