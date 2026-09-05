import { describe, expect, it } from 'vitest'

import {
  canUseTenantPreviewOverride,
  getFallbackProgram,
  inferTenantSlugHint,
  seededPrograms,
} from '@/features/tenant/tenant-service'

describe('tenant resolution fallback', () => {
  it('recognizes the exact RewardMe custom domains without trusting lookalikes', () => {
    expect(inferTenantSlugHint('myrewardme.com')).toBe('pinas')
    expect(inferTenantSlugHint('www.myrewardme.com')).toBe('pinas')
    expect(inferTenantSlugHint('myrewardme.com.attacker.example')).toBeNull()
    expect(canUseTenantPreviewOverride('www.myrewardme.com')).toBe(false)
  })
  it('allows this project preview hosts without trusting unrelated Vercel deployments', () => {
    expect(canUseTenantPreviewOverride('loyalty-rewards-prog-7xkl2hro-elaielaielai1113s-projects.vercel.app')).toBe(true)
    expect(canUseTenantPreviewOverride('medellin.localhost')).toBe(true)
    expect(canUseTenantPreviewOverride('attacker-project.vercel.app')).toBe(false)
    expect(canUseTenantPreviewOverride('unknown.example.com')).toBe(false)
  })

  it.each([
    ['medellinrewards.com', 'medellin'],
    ['medellin.localhost', 'medellin'],
    ['guatemala.rewardsplatform.app', 'guatemala'],
    ['guatemala.localhost', 'guatemala'],
    ['synergize.rewardsplatform.app', 'synergize'],
    ['synergize.localhost', 'synergize'],
    ['rewardme.localhost', 'pinas'],
    ['pinas.localhost', 'pinasrewards'],
    ['pinasrewards.localhost', 'pinasrewards'],
    ['loyalty-rewards-prog.vercel.app', 'pinas'],
    ['rewardme-prod.vercel.app', 'pinas'],
    ['myrewardme.com', 'pinas'],
    ['www.myrewardme.com', 'pinas'],
    ['pinas-rewards.vercel.app', 'pinasrewards'],
    ['wondertown-rewards.vercel.app', 'wondertown'],
    ['loyality-rewards.vercel.app', 'loyality'],
    ['loyality.localhost', 'loyality'],
  ])('maps %s to %s', (hostname, slug) => {
    expect(getFallbackProgram(hostname).slug).toBe(slug)
  })

  it('uses the RewardMe tenant for an unknown local domain', () => {
    expect(getFallbackProgram('localhost').slug).toBe('pinas')
    expect(inferTenantSlugHint('localhost')).toBeNull()
    expect(getFallbackProgram('medellin.attacker.example').slug).toBe('pinas')
    expect(inferTenantSlugHint('medellin.attacker.example')).toBeNull()
    expect(getFallbackProgram('guatemala-rewards.evil.example').slug).toBe('pinas')
    expect(inferTenantSlugHint('guatemala-rewards.evil.example')).toBeNull()
  })

  it('ships seven distinct seeded programs', () => {
    expect(new Set(seededPrograms.map((program) => program.id))).toHaveLength(7)
    expect(new Set(seededPrograms.map((program) => program.currency)).size).toBeGreaterThan(1)
  })
})
