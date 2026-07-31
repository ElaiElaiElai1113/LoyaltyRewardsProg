import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const publicLayout = readFileSync('src/layouts/public-browse-layout.tsx', 'utf8')
const homePage = readFileSync('src/features/home/pages/home-page.tsx', 'utf8')
const businessPage = readFileSync('src/features/business/pages/for-businesses-page.tsx', 'utf8')
const manifest = readFileSync('public/site.webmanifest', 'utf8')
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

  it('ships neutral shared install and static discovery fallbacks', () => {
    expect(manifest).toContain('"name": "Rewards Program"')
    expect(manifest).toContain('/rewards-program-mark.svg')
    expect(manifest).not.toContain('Pinas Rewards')
    expect(manifest).not.toContain('Medellin Rewards')
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
