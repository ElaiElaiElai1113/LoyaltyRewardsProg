import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('current UI process safeguards', () => {
  it('describes tenant imports as report-only without an inert execution action', () => {
    const page = source('src/features/platform/pages/tenant-import-page.tsx')

    expect(page).toContain('Report only')
    expect(page).toContain('No database changes are made from this page.')
    expect(page).not.toContain('Create import batch')
  })

  it('keeps intentionally disabled billing informational', () => {
    const page = source('src/features/program/pages/program-billing-page.tsx')

    expect(page).toContain('Managed offline')
    expect(page).toContain('Online billing is intentionally disabled.')
    expect(page).not.toContain('Open secure billing')
    expect(page).not.toContain('startCheckout')
  })

  it('does not send platform admins into the customer gift-card route', () => {
    const page = source('src/features/gift-cards/pages/admin-gift-cards-page.tsx')

    expect(page).not.toContain('/wallet/gift-cards/')
    expect(page).toContain('Customer ID:')
    expect(page).toContain('Expires ')
  })

  it('consumes rejected mutation promises at the UI boundary', () => {
    const businessGiftCards = source('src/features/gift-cards/pages/business-gift-cards-page.tsx')
    const adminGiftCards = source('src/features/gift-cards/pages/admin-gift-cards-page.tsx')
    const customerGiftCards = source('src/features/gift-cards/pages/gift-cards-page.tsx')
    const redemptions = source('src/features/gift-cards/pages/redemptions-page.tsx')
    const membershipGate = source('src/features/membership/components/earn-redeem-gate.tsx')

    expect(businessGiftCards).toMatch(/async function issueToCustomer\(\)[\s\S]*?try[\s\S]*?catch/)
    expect(businessGiftCards).toContain('mutateAsync(id).catch(() => undefined)')
    expect(adminGiftCards).toMatch(/async function issueToCustomer\(\)[\s\S]*?try[\s\S]*?catch/)
    expect(customerGiftCards).toMatch(/async function handleIssue\(\)[\s\S]*?try[\s\S]*?catch/)
    expect(redemptions).toMatch(/async function redeem\(\)[\s\S]*?try[\s\S]*?catch/)
    expect(redemptions).toMatch(/async function recordStandardTransaction\(\)[\s\S]*?try[\s\S]*?catch/)
    expect(membershipGate).toContain('.catch(() => undefined)')
  })

  it('uses tenant commerce data instead of cross-tenant currency defaults', () => {
    const businessGiftCards = source('src/features/gift-cards/pages/business-gift-cards-page.tsx')
    const redemptions = source('src/features/gift-cards/pages/redemptions-page.tsx')
    const members = source('src/features/business-owner/pages/members-page.tsx')
    const calculator = source('src/features/business/components/cost-calculator.tsx')
    const home = source('src/features/home/pages/home-page.tsx')

    expect(businessGiftCards).toContain('getDefaultGiftCardValueLabel({')
    expect(businessGiftCards).toContain('business?.currency ?? program.currency')
    expect(businessGiftCards).not.toContain('PHP 250')
    expect(redemptions).toContain("import { formatTenantCurrency } from '@/lib/tenant-commerce'")
    expect(redemptions).toContain('transaction.business?.currency ?? business?.currency ?? program.currency')
    expect(redemptions).not.toContain("?? 'PHP'")
    expect(redemptions).not.toContain('formatBaseCurrency')
    expect(members).toContain('{purchaseCurrencySymbol}')
    expect(members).toContain('formatCurrency(Number.parseFloat(purchaseAmount) || 0, businessCurrency, program.locale)')
    expect(members).not.toContain('pts per $1')
    expect(calculator).toContain('formatTenantCurrency(value, program)')
    expect(calculator).not.toMatch(/currency:\s*'USD'/)
    expect(home).not.toContain('$100,000 COP')
    expect(home).not.toContain('Earn 40,000 COP')
    expect(home).not.toContain('200,000 COP')
    expect(home).toContain('Pricing available on request')
    expect(home).toContain('const homepageValueItems = isPinas ? valueItems : tenantManagedValueItems')
    expect(home).toContain('const homepageProcessSteps = isPinas ? processSteps : tenantManagedProcessSteps')
    expect(home).toContain('const homepageFaqs = isPinas ? pinasFaqs : tenantManagedFaqs')
    expect(home).toContain('within the Medellin Rewards Program - not cash exchange.')
    expect(home).toContain("alt: 'Friends dining together at a local restaurant'")
    expect(home).not.toContain("alt: 'Friends dining together in Medellín'")
  })

  it('keeps the active member signup phone example tenant-aware', () => {
    const join = source('src/features/join/pages/join-rewards-page.tsx')
    const activeJoin = join.slice(join.indexOf('export function CompactJoinRewardsPage'), join.indexOf('export function SplitJoinRewardsPage'))
    expect(activeJoin).toContain('program.countryCode')
    expect(activeJoin).toContain('placeholder={phonePlaceholder}')
  })
})
