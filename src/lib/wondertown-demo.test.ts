import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(path, 'utf8')

describe('Wondertown demo tenant', () => {
  it('has a neutral fictional identity before and after React starts', () => {
    const tenantService = source('src/features/tenant/tenant-service.ts')
    const bootstrap = source('public/tenant-bootstrap.js')
    const home = source('src/features/home/pages/wondertown-home.tsx')

    for (const file of [tenantService, bootstrap]) {
      expect(file).toContain('Wondertown Rewards')
      expect(file).toContain('wondertown-rewards.vercel.app')
      expect(file).toContain('#4f3b78')
    }
    expect(home).toContain('A fictional city built for testing')
    expect(home).toContain('Moonbeam Café')
    expect(home).toContain('wondertown-hero.webp')
    expect(home).toContain('wondertown-hero-768.webp')
    expect(home).not.toContain('wondertown-hero.jpg')
    expect(home).not.toContain('Medellin Rewards')
    expect(home).not.toContain('Pinas Rewards')
    expect(home).not.toContain('Guatemala Rewards')
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
