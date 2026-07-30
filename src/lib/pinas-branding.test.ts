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

  it('ships Pinas metadata and the canonical zero-cost domain', () => {
    expect(manifest).toContain('"name": "Pinas Rewards"')
    expect(manifest).not.toContain('Medellin Rewards')
    expect(indexHtml).toContain('https://pinas-rewards.vercel.app/')
    expect(indexHtml).toContain('application/ld+json')
    expect(indexHtml).toContain('og:image:alt')
    expect(robots).toContain('https://pinas-rewards.vercel.app/sitemap.xml')
    expect(sitemap).toContain('https://pinas-rewards.vercel.app/for-businesses')
  })
})
