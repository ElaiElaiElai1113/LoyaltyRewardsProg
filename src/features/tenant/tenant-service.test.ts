import { describe, expect, it } from 'vitest'

import {
  canUseTenantPreviewOverride,
  getFallbackProgram,
  inferTenantSlugHint,
  seededPrograms,
} from '@/features/tenant/tenant-service'

describe('tenant resolution fallback', () => {
  it('allows this project preview hosts without trusting unrelated Vercel deployments', () => {
    expect(canUseTenantPreviewOverride('loyalty-rewards-prog-7xkl2hro-elaielaielai1113s-projects.vercel.app')).toBe(true)
    expect(canUseTenantPreviewOverride('attacker-project.vercel.app')).toBe(false)
    expect(canUseTenantPreviewOverride('unknown.example.com')).toBe(false)
  })

  it.each([
    ['medellinrewards.com', 'medellin'],
    ['guatemala.rewardsplatform.app', 'guatemala'],
    ['synergize.rewardsplatform.app', 'synergize'],
    ['pinas.localhost', 'pinas'],
    ['pinas-rewards.vercel.app', 'pinas'],
  ])('maps %s to %s', (hostname, slug) => {
    expect(getFallbackProgram(hostname).slug).toBe(slug)
  })

  it('uses Pinas Rewards for an unknown domain', () => {
    expect(getFallbackProgram('localhost').slug).toBe('pinas')
    expect(inferTenantSlugHint('localhost')).toBeNull()
    expect(getFallbackProgram('medellin.attacker.example').slug).toBe('pinas')
    expect(inferTenantSlugHint('medellin.attacker.example')).toBeNull()
    expect(getFallbackProgram('guatemala-rewards.evil.example').slug).toBe('pinas')
    expect(inferTenantSlugHint('guatemala-rewards.evil.example')).toBeNull()
  })

  it('ships four distinct seeded programs', () => {
    expect(new Set(seededPrograms.map((program) => program.id))).toHaveLength(4)
    expect(new Set(seededPrograms.map((program) => program.currency)).size).toBeGreaterThan(1)
  })
})
