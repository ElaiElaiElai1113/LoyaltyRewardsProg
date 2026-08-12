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

  it('keeps manually administered plans informational', () => {
    const page = source('src/features/program/pages/program-billing-page.tsx')

    expect(page).toContain('Managed by operations')
    expect(page).toContain('RewardMe does not collect payments online.')
    expect(page).toContain('No card or payment details are collected from this page.')
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
    expect(home).toContain('const homepageValueItems = isRewardMe ? valueItems : tenantManagedValueItems')
    expect(home).toContain('const homepageProcessSteps = isRewardMe ? processSteps : tenantManagedProcessSteps')
    expect(home).toContain('const homepageFaqs = isRewardMe ? rewardMeFaqs : tenantManagedFaqs')
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

  it('keeps operational empty and failure states recoverable', () => {
    const errorBoundary = source('src/components/error-boundary.tsx')
    const notFound = source('src/features/not-found/pages/not-found-page.tsx')
    const programTeam = source('src/features/program/pages/program-team-page.tsx')
    const platformPrograms = source('src/features/platform/pages/platform-programs-page.tsx')
    const shop = source('src/features/shop/pages/shop-page.tsx')

    expect(errorBoundary).toContain("homeAction={t('Back to home')}")
    expect(notFound).toContain('to="/guide"')
    expect(programTeam).toContain('Program team could not be loaded')
    expect(programTeam).toContain('Try again')
    expect(programTeam).toContain('Invite first administrator')
    expect(platformPrograms).toContain('Clear filters')
    expect(shop).toContain("t('Browse other partners')")
  })

  it('registers the protected launch dashboard and keeps approvals explicit', () => {
    const router = source('src/routes/router.tsx')
    const layout = source('src/layouts/admin-layout.tsx')
    const dashboard = source('src/features/platform/pages/launch-readiness-page.tsx')
    const register = source('src/features/platform/launch-readiness.ts')

    expect(router).toContain("path: '/admin/readiness'")
    expect(layout).toContain("to: '/admin/readiness'")
    expect(dashboard).toContain('data-launch-readiness-dashboard')
    expect(dashboard).toContain('Approval boundary')
    expect(register).toContain("status: 'approval-required'")
    expect(register).toContain("status: 'external-required'")
  })
})
