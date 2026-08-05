import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const publicLayout = readFileSync('src/layouts/public-browse-layout.tsx', 'utf8')
const homePage = readFileSync('src/features/home/pages/home-page.tsx', 'utf8')
const businessPage = readFileSync('src/features/business/pages/for-businesses-page.tsx', 'utf8')
const installBranding = readFileSync('api/_tenant-install-brand.ts', 'utf8')
const indexHtml = readFileSync('index.html', 'utf8')
const robots = readFileSync('public/robots.txt', 'utf8')
const sitemap = readFileSync('public/sitemap.xml', 'utf8')

describe('Pinas Rewards flagship branding', () => {
  it('does not hardcode the Medellin wordmark in public page chrome', () => {
    expect(publicLayout).not.toMatch(/MEDELL[IÍ]N REWARDS/)
    expect(publicLayout).toContain('program.name.toUpperCase()')
  })

  it('tenantizes legacy compatibility copy before rendering', () => {
    expect(homePage).toContain(".replaceAll('Medellin Rewards', program.name)")
    expect(businessPage).toContain("text.replaceAll('Medellin Rewards', program.name)")
  })

  it('ships host-aware install metadata and neutral static discovery fallbacks', () => {
    expect(installBranding).toContain("name: 'Pinas Rewards'")
    expect(installBranding).toContain("name: 'Medellin Rewards'")
    expect(installBranding).toContain("name: 'Wondertown Rewards'")
    expect(indexHtml).toContain('href="/api/tenant-icon?size=192"')
    expect(indexHtml).toContain('href="/api/tenant-icon?size=180"')
    expect(indexHtml).toContain('href="/api/manifest?v=host-aware-2026"')
    expect(indexHtml).toContain('<title>Rewards Program</title>')
    expect(indexHtml).not.toContain('rel="canonical"')
    expect(indexHtml).not.toContain('Pinas Rewards')
    expect(indexHtml).not.toContain('pinas-rewards')
    expect(indexHtml).not.toContain('application/ld+json')
    expect(robots).toContain('Disallow: /')
    expect(robots).not.toContain('pinas-rewards.vercel.app')
    expect(sitemap).not.toContain('<loc>')
    expect(sitemap).not.toContain('pinas-rewards.vercel.app')
  })
})
