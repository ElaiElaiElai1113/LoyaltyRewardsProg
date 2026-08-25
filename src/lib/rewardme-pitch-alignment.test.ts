import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('RewardMe pitch alignment', () => {
  it('uses RewardMe as the public identity while preserving the stable pinas tenant key', () => {
    const tenantService = source('src/features/tenant/tenant-service.ts')
    const tenantBootstrap = source('public/tenant-bootstrap.js')
    const installBrand = source('api/_tenant-install-brand.ts')
    const migrationPackage = source('migration-packages/pinas/tenant-config.json')
    const canonicalMigration = source('supabase/migrations/20260811075720_set_rewardme_canonical_contact.sql')

    expect(tenantService).toMatch(/pinas:\s*\{[\s\S]*name: 'RewardMe'[\s\S]*slug: 'pinas'/)
    expect(tenantBootstrap).toMatch(/pinas:\s*\{ name: 'RewardMe'/)
    expect(tenantBootstrap).toContain("logo: '/rewardme-mark.svg'")
    expect(installBrand).toMatch(/pinas:\s*\{[\s\S]*name: 'RewardMe'[\s\S]*shortName: 'RewardMe'/)
    expect(migrationPackage).toContain('"programName": "RewardMe"')
    expect(migrationPackage).toContain('"sourceSystem": "RewardMe platform"')
    expect(migrationPackage).toContain('"slug": "pinas"')
    expect(migrationPackage).toContain('"primaryDomain": "loyalty-rewards-prog.vercel.app"')
    expect(migrationPackage).toContain('"emailFromAddress": ""')
    expect(canonicalMigration).toContain("hostname = 'loyalty-rewards-prog.vercel.app'")
    expect(canonicalMigration).toContain("support_email = 'support@rewardme.ph'")
    expect(canonicalMigration).toContain("email_from_address = ''")
  })

  it('gives the pinas tenant its supplied RewardMe HTML landing experience', () => {
    const home = source('src/features/home/pages/home-page.tsx')
    const rewardMeHome = source('src/features/home/pages/rewardme-home.tsx')

    expect(home).toContain("if (program.slug === 'pinas') return <RewardMeHomePage />")
    expect(rewardMeHome).toContain('Get rewarded')
    expect(rewardMeHome).toContain('for spending where')
    expect(rewardMeHome).toContain('you already love.')
    expect(rewardMeHome).toContain('Three steps. Zero cost.')
    expect(rewardMeHome).toContain('Built to feel like a win, every visit.')
    expect(rewardMeHome).toContain('Free to join. Easy to love.')
    expect(rewardMeHome).toContain('2,340 PTS')
    expect(rewardMeHome).toContain('4-week streak')
    expect(rewardMeHome).toContain('to="/join"')
    expect(rewardMeHome).toContain('to="/signin"')
    expect(rewardMeHome).toContain('to="/business"')
    expect(rewardMeHome).not.toContain('Pinas Rewards')
    expect(rewardMeHome).not.toContain('Every plan starts with 3 months of Gold')
  })

  it('keeps trial and manual-enrollment claims honest across signup and membership', () => {
    const join = source('src/features/join/pages/join-rewards-page.tsx')
    const membership = source('src/features/membership/pages/rewardme-membership-page.tsx')

    expect(join).toContain('Three-month free access')
    expect(join).toContain('the RewardMe team activates an eligible Regular or Gold membership')
    expect(membership).toContain('RewardMe membership')
    expect(membership).toContain('Manual enrollment')
    expect(membership).toContain('does not collect online payments or card details')
    expect(membership).toContain('Request Regular or Gold access')
    expect(membership).toContain('Free')
    expect(membership).toContain('Regular')
    expect(membership).toContain('Gold')
    expect(membership).not.toContain('Get $10 credit instantly')
  })

  it('aligns business acquisition and protects anonymous discovery from QA fixtures', () => {
    const businessPage = source('src/features/business/pages/for-businesses-page.tsx')
    const shopPage = source('src/features/shop/pages/shop-page.tsx')

    expect(businessPage).toContain('Commission model')
    expect(businessPage).toContain('Business-credit model')
    expect(businessPage).toContain('25% commission')
    expect(shopPage).toContain('isQaReleaseFixture')
    expect(shopPage).toContain('profile ? allBusinesses : allBusinesses.filter')
    expect(shopPage).toContain("['Davao City', 'Matina', 'Bajada', 'Lanang']")
  })
})
