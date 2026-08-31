import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(path, 'utf8')

describe('Wondertown demo tenant', () => {
  it('has a neutral fictional identity before and after React starts', () => {
    const tenantService = source('src/features/tenant/tenant-service.ts')
    const bootstrap = source('public/tenant-bootstrap.js')
    const homeRouter = source('src/features/home/pages/home-page.tsx')
    const sharedHome = source('src/features/home/pages/rewardme-home.tsx')
    const sharedExperience = source('src/lib/rewardme-experience.ts')

    for (const file of [tenantService, bootstrap]) {
      expect(file).toContain('Wondertown Rewards')
      expect(file).toContain('wondertown-rewards.vercel.app')
    }
    expect(homeRouter).toContain('if (isRewardMeExperience(program.slug)) return <RewardMeHomePage />')
    expect(sharedExperience).toContain("['pinas', 'rewardme', 'wondertown']")
    expect(sharedHome).toContain('RewardMe test environment · fictional data')
    expect(sharedHome).toContain('data-wondertown-rewardme-mirror')
    expect(sharedHome).toContain('Sandbox account')
    expect(sharedHome).not.toContain('Medellin Rewards')
    expect(sharedHome).not.toContain('Pinas Rewards')
    expect(sharedHome).not.toContain('Guatemala Rewards')
  })

  it('keeps the tenant, demo fixtures, and live smoke configuration reproducible', () => {
    const migration = source('supabase/migrations/20260803122523_wondertown_demo_tenant.sql')
    const promotionRepair = source('supabase/migrations/20260803123547_fix_promotions_business_tenant_fk.sql')
    const provisioner = source('scripts/provision-wondertown-demo.mjs')
    const smoke = source('scripts/run-wondertown-demo.mjs')

    expect(migration).toContain("'wondertown'")
    expect(migration).toContain("'trialing'::public.program_subscription_status")
    expect(migration).toContain("'{\"demoTenant\":true}'::jsonb")
    expect(promotionRepair).toContain('foreign key (business_id, program_id)')
    expect(promotionRepair).toContain('references public.businesses (id, program_id)')
    expect(provisioner).toContain('member@wondertown.test')
    expect(provisioner).toContain('owner@wondertown.test')
    expect(provisioner).toContain('staff@wondertown.test')
    expect(provisioner).toContain('businessFixtures.length')
    expect(smoke).toContain('https://wondertown-rewards.vercel.app')
    expect(smoke).toContain('Moonbeam Café')
  })
})
