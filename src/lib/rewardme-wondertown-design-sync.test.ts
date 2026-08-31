import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) { return readFileSync(path, 'utf8') }

describe('RewardMe and Wondertown design synchronization', () => {
  it('routes both tenants through one RewardMe experience boundary', () => {
    const home = source('src/features/home/pages/home-page.tsx')
    const business = source('src/features/business/pages/for-businesses-page.tsx')
    const join = source('src/features/join/pages/join-rewards-page.tsx')
    const applications = source('src/features/business/pages/business-application-page.tsx')
    const sharedExperience = source('src/lib/rewardme-experience.ts')
    const theme = source('src/reference-design-systems.css')
    const migration = source('supabase/migrations/20260831154128_align_wondertown_with_rewardme_theme.sql')
    const databaseWorkflow = source('.github/workflows/rewards-database-maintenance.yml')
    const router = source('src/routes/router.tsx')

    for (const page of [home, business, join, applications]) {
      expect(page).toContain('isRewardMeExperience(program.slug)')
    }
    expect(home).not.toContain('WondertownHomePage')
    expect(business).not.toContain('WondertownBusinessPage')
    expect(sharedExperience).toContain("['pinas', 'rewardme', 'wondertown']")
    expect(theme).toContain('Wondertown intentionally inherits the RewardMe system')
    expect(theme).not.toContain('Wondertown assigned storybook theme')
    expect(migration).toContain("where slug = 'wondertown'")
    expect(migration).toContain("primary_color = '#173f32'")
    expect(databaseWorkflow).toContain('apply-wondertown-theme')
    expect(databaseWorkflow).toContain('wondertown-theme-verification.sql')
    expect(router).toContain("path: '/business/apply/commission'")
    expect(router).toContain("path: '/business/apply/credit'")
  })

  it('keeps applications server-only and stores consented submissions', () => {
    const api = source('api/business-applications.ts')
    const migration = source('supabase/migrations/20260827161436_rewardme_business_applications.sql')
    const page = source('src/features/business/pages/business-application-page.tsx')

    expect(api).toContain('SUPABASE_SERVICE_ROLE_KEY')
    expect(api).toContain(".from('business_applications').insert")
    expect(migration).toContain('alter table public.business_applications enable row level security')
    expect(migration).toContain('revoke all on table public.business_applications from public, anon, authenticated')
    expect(page).toContain('this is an application, not the final commercial agreement')
    expect(page).toContain('Sandbox business application')
    expect(page).toContain("disclosureVersion: 'business-application-v1'")
    expect(existsSync('.github/workflows/rewards-database-maintenance.yml')).toBe(true)
  })
})
