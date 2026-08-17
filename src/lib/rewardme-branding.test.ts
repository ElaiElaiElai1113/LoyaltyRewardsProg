import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const publicLayout = readFileSync('src/layouts/public-browse-layout.tsx', 'utf8')
const homePage = readFileSync('src/features/home/pages/home-page.tsx', 'utf8')
const businessPage = readFileSync('src/features/business/pages/for-businesses-page.tsx', 'utf8')
const installBranding = readFileSync('api/_tenant-install-brand.ts', 'utf8')
const indexHtml = readFileSync('index.html', 'utf8')
const robots = readFileSync('public/robots.txt', 'utf8')
const sitemap = readFileSync('public/sitemap.xml', 'utf8')

describe('RewardMe flagship branding', () => {
  it('keeps RewardMe pages free of Pinas branding while both independent brands ship', () => {
    const formerDisplayName = ['Pinas', 'Rewards'].join(' ')
    const rewardMeRuntime = [
      'src/features/home/pages/rewardme-home.tsx',
      'src/features/membership/pages/rewardme-membership-page.tsx',
    ].map((path) => readFileSync(path, 'utf8')).join('\n')

    expect(rewardMeRuntime).not.toContain(formerDisplayName)
    expect(JSON.parse(readFileSync('package.json', 'utf8')).name).toBe('rewardme')
    for (const path of [
      'public/pinas-rewards-logo.png',
      'public/pinas-rewards-logo.svg',
      'public/pinas-rewards-mark.svg',
    ]) {
      expect(existsSync(path), path).toBe(true)
    }
    for (const path of [
      'public/rewardme-logo.png',
      'public/rewardme-logo.svg',
      'public/rewardme-mark.svg',
      'public/rewardme-qr.svg',
      'public/rewardme-scan-poster.png',
      'scripts/generate-rewardme-qr.mjs',
      'docs/rewardme-launch-readiness.md',
    ]) {
      expect(existsSync(path), path).toBe(true)
    }
  })

  it('keeps RewardMe canonical while serving Pinas Rewards independently', () => {
    const discovery = readFileSync('api/_tenant-public-discovery.ts', 'utf8')
    const deployment = readFileSync('scripts/deploy-tenant-sites.mjs', 'utf8')
    const vercel = readFileSync('vercel.json', 'utf8')

    expect(discovery).toContain("'loyalty-rewards-prog.vercel.app': 'https://loyalty-rewards-prog.vercel.app'")
    expect(discovery).toContain("'pinas-rewards.vercel.app': 'https://pinas-rewards.vercel.app'")
    expect(deployment).toContain("primaryProject: 'loyalty-rewards-prog'")
    expect(deployment).toContain("aliases: ['pinas-rewards.vercel.app', 'wondertown-rewards.vercel.app']")
    expect(vercel).not.toContain('"destination": "https://loyalty-rewards-prog.vercel.app/:path*"')
  })

  it('does not hardcode the Medellin wordmark in public page chrome', () => {
    expect(publicLayout).not.toMatch(/MEDELL[IÍ]N REWARDS/)
    expect(publicLayout).toContain('program.name.toUpperCase()')
  })

  it('tenantizes legacy compatibility copy before rendering', () => {
    expect(homePage).toContain(".replaceAll('Medellin Rewards', program.name)")
    expect(businessPage).toContain('program: program.name')
    expect(businessPage).not.toContain('Medellin Rewards')
  })

  it('ships host-aware install metadata and neutral static discovery fallbacks', () => {
    expect(installBranding).toContain("name: 'RewardMe'")
    expect(installBranding).toContain("name: 'Pinas Rewards'")
    expect(installBranding).toContain("name: 'Medellin Rewards'")
    expect(installBranding).toContain("name: 'Wondertown Rewards'")
    expect(indexHtml).toContain('href="/api/tenant-icon?size=192"')
    expect(indexHtml).toContain('href="/api/tenant-icon?size=180"')
    expect(indexHtml).toContain('href="/api/manifest?v=host-aware-2026"')
    expect(indexHtml).toContain('<title>Rewards Program</title>')
    expect(indexHtml).not.toContain('rel="canonical"')
    expect(indexHtml).not.toContain('Pinas' + ' Rewards')
    expect(indexHtml).not.toContain('pinas-' + 'rewards')
    expect(indexHtml).not.toContain('application/ld+json')
    expect(robots).toContain('Disallow: /')
    expect(robots).not.toContain('pinas-' + 'rewards.vercel.app')
    expect(sitemap).not.toContain('<loc>')
    expect(sitemap).not.toContain('pinas-' + 'rewards.vercel.app')
  })
})
