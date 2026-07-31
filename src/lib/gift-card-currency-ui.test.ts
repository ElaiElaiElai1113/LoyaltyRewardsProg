import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('gift-card currency UI', () => {
  it('formats member wallet and shared public balances with card or program currency', () => {
    const wallet = source('src/features/gift-cards/pages/wallet-gift-cards-page.tsx')
    const display = source('src/features/gift-cards/components/gift-card-display.tsx')

    expect(wallet).toContain('formatTenantCurrency(remainingBalance')
    expect(wallet).toContain('card.business?.currency ?? programCurrency')
    expect(wallet).not.toContain('remainingBalance.toLocaleString')

    expect(display).toContain('formatTenantCurrency(value, currencyContext)')
    expect(display).toContain('giftCard.business?.currency ?? program.currency')
    expect(display).not.toMatch(/function formatBalance[\s\S]*?\.toLocaleString/)
  })

  it('uses the selected card business currency in platform admin balances', () => {
    const admin = source('src/features/gift-cards/pages/admin-gift-cards-page.tsx')

    expect(admin).toContain('card.business?.currency ?? selectedBusiness?.currency')
    expect(admin).toContain('Balance: {formatCardBalance(card)}')
    expect(admin).not.toContain('currency: program.currency')
  })

  it('loads business currency with member gift cards and keeps business defaults tenant-aware', () => {
    const service = source('src/integrations/supabase/services/gift-cards-service.ts')
    const business = source('src/features/gift-cards/pages/business-gift-cards-page.tsx')

    expect(service).toContain('businesses(id, name, logo_url, currency)')
    expect(service).toContain(".select('id, name, logo_url, currency')")
    expect(business).toContain('business?.currency ?? program.currency')
    expect(business).toContain('getDefaultGiftCardValueLabel({')
  })
})
