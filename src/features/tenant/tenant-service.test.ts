import { describe, expect, it } from 'vitest'

import { canUseTenantPreviewOverride, getFallbackProgram, seededPrograms } from '@/features/tenant/tenant-service'

describe('tenant resolution fallback', () => {
  it('allows this project preview hosts without trusting unrelated Vercel deployments', () => {
    expect(canUseTenantPreviewOverride('loyalty-rewards-prog-7xkl2hro-elaielaielai1113s-projects.vercel.app')).toBe(true)
    expect(canUseTenantPreviewOverride('attacker-project.vercel.app')).toBe(false)
    expect(canUseTenantPreviewOverride('unknown.example.com')).toBe(false)
  })

  it.each([
    ['medellinrewards.com', 'medellin'],
    ['guatemala.rewardsplatform.app', 'guatemala'],
    ['synergize.example', 'synergize'],
    ['davao.localhost', 'davao'],
  ])('maps %s to %s', (hostname, slug) => {
    expect(getFallbackProgram(hostname).slug).toBe(slug)
  })

  it('uses Medellin for an unknown domain', () => {
    expect(getFallbackProgram('localhost').slug).toBe('medellin')
  })

  it('ships four distinct seeded programs', () => {
    expect(new Set(seededPrograms.map((program) => program.id))).toHaveLength(4)
    expect(new Set(seededPrograms.map((program) => program.currency)).size).toBeGreaterThan(1)
  })
})
