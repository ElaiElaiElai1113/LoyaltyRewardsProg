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
    expect(tenantBootstrap).toContain("logo: '/rewardme-client-logo-132.webp'")
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

  it('routes pinas to its supplied PDF narrative while retaining the existing Wondertown mirror', () => {
    const home = source('src/features/home/pages/home-page.tsx')
    const rewardMeHome = source('src/features/home/pages/rewardme-home.tsx')
    const rewardMeHeader = source('src/features/home/components/rewardme-public-header.tsx')
    const referenceHome = source('src/features/home/pages/rewardme-reference-home.tsx')

    expect(home).toContain('if (isRewardMeExperience(program.slug)) return <RewardMeHomePage />')
    expect(rewardMeHome).toContain("program.slug === 'pinas' ? <RewardMeReferenceHomePage /> : <RewardMeMirrorHomePage />")
    expect(referenceHome).toContain('Get rewarded for spending where you already love.')
    expect(referenceHome).toContain('2,340 PTS')
    expect(referenceHome).toContain('Three steps. Zero cost.')
    expect(referenceHome).toContain('Built to feel like a win, every visit.')
    expect(rewardMeHome).toContain('Earn amazing rewards while supporting local businesses.')
    expect(rewardMeHome).toContain('Example purchase recorded')
    expect(rewardMeHome).toContain('Example reward earned')
    expect(rewardMeHome).toContain('Example voucher selected')
    expect(rewardMeHome).toContain('Illustrative account preview')
    expect(rewardMeHome).toContain("Three steps. That's the whole system.")
    expect(rewardMeHome).toContain('Your rewards are real credit — spendable in one place, made for you.')
    expect(rewardMeHeader).toContain('to="/join"')
    expect(rewardMeHeader).toContain('to="/signin"')
    expect(rewardMeHome).toContain('to="/business"')
    expect(rewardMeHome).not.toContain('Pinas Rewards')
    expect(rewardMeHome).not.toContain('Every plan starts with 3 months of Gold')
  })

  it('keeps trial and manual-enrollment claims honest across signup and membership', () => {
    const join = source('src/features/join/pages/join-rewards-page.tsx')
    const membership = source('src/features/membership/pages/rewardme-membership-page.tsx')

    expect(join).toContain('Free membership for everyone. Earn and redeem eligible rewards.')
    expect(join).toContain('Additional tier planned. Register interest from Membership after signing in.')
    expect(join).toContain("I agree to the Terms of Service and Privacy Policy for my free account.")
    expect(membership).toContain('RewardMe membership')
    expect(membership).toContain('Manual enrollment')
    expect(membership).toContain('Pricing, benefits and activation are pending approval.')
    expect(membership).toContain('Register tier interest')
    expect(membership).toContain('Free')
    expect(membership).toContain('Regular')
    expect(membership).toContain('Gold')
    expect(membership).not.toContain('Get $10 credit instantly')
  })

  it('aligns business acquisition and protects anonymous discovery from QA fixtures', () => {
    const businessPage = source('src/features/business/pages/for-businesses-page.tsx')
    const shopPage = source('src/features/shop/pages/shop-page.tsx')

    expect(businessPage).toContain('Commission Model')
    expect(businessPage).toContain('Credit Model')
    expect(businessPage).toContain('/business/apply/commission')
    expect(businessPage).toContain('/business/apply/credit')
    expect(shopPage).toContain('isQaReleaseFixture')
    expect(shopPage).toContain('profile ? allBusinesses : allBusinesses.filter')
    expect(shopPage).toContain("['Davao City', 'Matina', 'Bajada', 'Lanang']")
  })
})
