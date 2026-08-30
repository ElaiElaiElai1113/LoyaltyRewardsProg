import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) { return readFileSync(path, 'utf8') }

describe('RewardMe and Wondertown design isolation', () => {
  it('routes each tenant through its assigned page implementation', () => {
    const home = source('src/features/home/pages/home-page.tsx')
    const business = source('src/features/business/pages/for-businesses-page.tsx')
    const join = source('src/features/join/pages/join-rewards-page.tsx')
    const router = source('src/routes/router.tsx')

    expect(home).toContain("if (program.slug === 'wondertown') return <WondertownHomePage />")
    expect(business).toContain("if (program.slug === 'wondertown') return <WondertownBusinessPage />")
    expect(business).not.toContain("program.slug === 'pinas' || program.slug === 'rewardme' || program.slug === 'wondertown'")
    expect(join).toContain("program.slug === 'pinas' || program.slug === 'rewardme' || program.slug === 'wondertown'")
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
    expect(page).toContain("disclosureVersion: 'business-application-v1'")
    expect(existsSync('.github/workflows/rewards-database-maintenance.yml')).toBe(true)
  })
})
