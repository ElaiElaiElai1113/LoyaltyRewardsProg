import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  buildRobotsDocument,
  buildSitemapDocument,
  resolveDiscoveryOrigin,
} from '../../api/_tenant-public-discovery'

const verifiedTenants = [
  ['www.medellinrewards.com', 'https://www.medellinrewards.com'],
  ['guatemalarewards.com', 'https://guatemalarewards.com'],
  ['pinas-rewards.vercel.app', 'https://pinas-rewards.vercel.app'],
] as const

describe('host-aware public discovery documents', () => {
  it('routes both well-known discovery paths through their serverless handlers', () => {
    const vercelConfig = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
      redirects?: Array<{ source: string; destination: string; permanent: boolean }>
    }

    expect(vercelConfig.redirects).toEqual(expect.arrayContaining([
      { source: '/robots.txt', destination: '/api/robots', permanent: false },
      { source: '/sitemap.xml', destination: '/api/sitemap', permanent: false },
    ]))
    expect(readFileSync('public/robots.txt', 'utf8')).not.toMatch(/https?:\/\//)
    expect(readFileSync('public/sitemap.xml', 'utf8')).not.toContain('<loc>')
  })

  it.each(verifiedTenants)('uses only the matching origin for %s', (hostname, origin) => {
    expect(resolveDiscoveryOrigin(hostname)).toBe(origin)

    const robots = buildRobotsDocument(hostname)
    const sitemap = buildSitemapDocument(hostname)
    expect(robots).toContain(`Sitemap: ${origin}/sitemap.xml`)
    expect(sitemap).toContain(`<loc>${origin}/</loc>`)
    expect(sitemap).toContain(`<loc>${origin}/for-businesses</loc>`)

    for (const [, otherOrigin] of verifiedTenants) {
      if (otherOrigin !== origin) {
        expect(robots).not.toContain(otherOrigin)
        expect(sitemap).not.toContain(otherOrigin)
      }
    }
  })

  it('accepts case and a transport port without broadening the hostname allowlist', () => {
    expect(resolveDiscoveryOrigin('WWW.MEDELLINREWARDS.COM:443')).toBe('https://www.medellinrewards.com')
  })

  it.each([
    undefined,
    '',
    'rewardsplatform.app',
    'synergizerewards.com',
    'www.medellinrewards.com.evil.example',
    'www.medellinrewards.com, evil.example',
  ])('keeps an unverified host neutral: %s', (hostname) => {
    expect(resolveDiscoveryOrigin(hostname)).toBeNull()
    expect(buildRobotsDocument(hostname)).toBe('User-agent: *\nDisallow: /\n')
    expect(buildSitemapDocument(hostname)).not.toContain('<loc>')
    expect(buildSitemapDocument(hostname)).not.toContain('Rewards')
  })

  it('never includes protected portal routes in a tenant sitemap', () => {
    const sitemap = buildSitemapDocument('pinas-rewards.vercel.app')
    for (const path of ['/admin', '/dashboard', '/profile', '/orders', '/cart', '/business/dashboard']) {
      expect(sitemap).not.toContain(`<loc>https://pinas-rewards.vercel.app${path}`)
    }
  })
})
