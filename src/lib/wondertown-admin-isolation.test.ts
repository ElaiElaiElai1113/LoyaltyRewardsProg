import { describe, expect, it, vi } from 'vitest'

vi.mock('@/integrations/supabase/client', () => ({ supabase: null }))

import { platformService } from '@/features/platform/platform-service'
import { seededPrograms } from '@/features/tenant/tenant-service'
import { getBrandedAdminProgramId } from './admin-program-scope'

describe('branded admin isolation', () => {
  const rewardme = seededPrograms.find((program) => program.slug === 'pinas')!
  const wondertown = seededPrograms.find((program) => program.slug === 'wondertown')!
  const loyality = seededPrograms.find((program) => program.slug === 'loyality')!
  const medellin = seededPrograms.find((program) => program.slug === 'medellin')!

  it('scopes every reviewed branded host while leaving the neutral global console available', () => {
    expect(getBrandedAdminProgramId(rewardme)).toBe(rewardme.id)
    expect(getBrandedAdminProgramId(wondertown)).toBe(wondertown.id)
    expect(getBrandedAdminProgramId(loyality)).toBe(loyality.id)
    expect(getBrandedAdminProgramId(medellin)).toBeUndefined()
  })

  it('returns only the requested tenant after the program list has loaded', async () => {
    await expect(platformService.listPrograms(wondertown.id)).resolves.toEqual([
      expect.objectContaining({ id: wondertown.id, slug: 'wondertown' }),
    ])
  })

  it('preserves the neutral global program list when no tenant scope is supplied', async () => {
    const programs = await platformService.listPrograms()
    expect(programs).toHaveLength(seededPrograms.length)
    expect(programs.map((program) => program.slug)).toContain('medellin')
    expect(programs.map((program) => program.slug)).toContain('wondertown')
  })
})
