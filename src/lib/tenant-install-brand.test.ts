import { existsSync, readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  buildInstallManifest,
  getInstallIconPath,
  resolveInstallBrand,
  type InstallBrandSlug,
} from '../../api/_tenant-install-brand'

const tenantCases = [
  ['medellinrewards.com', 'medellin', 'Medellin Rewards'],
  ['guatemalarewards.com', 'guatemala', 'Guatemala Rewards'],
  ['synergize-business-group.vercel.app', 'synergize', 'Synergize'],
  ['loyalty-rewards-prog.vercel.app', 'pinas', 'RewardMe'],
  ['rewardme-prod.vercel.app', 'pinas', 'RewardMe'],
  ['myrewardme.com', 'pinas', 'RewardMe'],
  ['www.myrewardme.com', 'pinas', 'RewardMe'],
  ['pinas-rewards.vercel.app', 'pinasrewards', 'Pinas Rewards'],
  ['wondertown-rewards.vercel.app', 'wondertown', 'Wondertown Rewards'],
] as const

function readPngDimensions(path: string) {
  const bytes = readFileSync(path)
  expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG')
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

describe('tenant install branding', () => {
  it('does not ship shared legacy icon files that can leak one tenant into another', () => {
    for (const path of [
      'public/site.webmanifest',
      'public/apple-touch-icon.png',
      'public/favicon.ico',
      'public/favicon.svg',
      'public/icon-192.png',
      'public/icon-512.png',
    ]) {
      expect(existsSync(path)).toBe(false)
    }
  })

  it.each(tenantCases)('resolves %s to its own %s manifest', (hostname, slug, name) => {
    const brand = resolveInstallBrand(hostname, 'pinas')
    const manifest = buildInstallManifest(brand)

    expect(brand.slug).toBe(slug)
    expect(manifest.name).toBe(name)
    expect(manifest.icons).toEqual([
      expect.objectContaining({ src: expect.stringContaining(`tenant=${slug}`), sizes: '192x192' }),
      expect.objectContaining({ src: expect.stringContaining(`tenant=${slug}`), sizes: '512x512' }),
    ])
    if (slug !== 'pinas' && slug !== 'pinasrewards') expect(JSON.stringify(manifest.icons)).not.toContain('pinas')
  })

  it('keeps platform administration on the neutral parent install identity', () => {
    const brand = resolveInstallBrand('wondertown-rewards.vercel.app', 'platform')
    const manifest = buildInstallManifest(brand)

    expect(brand.slug).toBe('platform')
    expect(manifest.name).toBe('Rewards Platform')
    expect(manifest.start_url).toContain('/admin')
  })

  it.each(['platform', 'medellin', 'guatemala', 'synergize', 'pinas', 'pinasrewards', 'wondertown'] as InstallBrandSlug[])(
    'ships exact PNG sizes for the %s install brand',
    (slug) => {
      const brand = resolveInstallBrand('localhost', slug)
      for (const size of [180, 192, 512] as const) {
        const path = `public${getInstallIconPath(brand, size)}`
        expect(existsSync(path)).toBe(true)
        expect(readPngDimensions(path)).toEqual({ width: size, height: size })
      }
    },
  )
})
