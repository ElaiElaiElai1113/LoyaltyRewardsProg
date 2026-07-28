import { describe, expect, it } from 'vitest'

import { getFallbackProgram, seededPrograms } from '@/features/tenant/tenant-service'

describe('tenant resolution fallback', () => {
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
