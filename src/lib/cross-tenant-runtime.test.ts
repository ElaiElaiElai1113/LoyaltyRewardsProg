import { readFileSync } from 'node:fs'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { getProgramIconHref } from '@/features/tenant/tenant-branding'
import { getFallbackProgram } from '@/features/tenant/tenant-service'
import { getDefaultLanguageForLocale } from '@/lib/language'
import { resolveTenantPublicSiteUrl } from '@/lib/public-site-url'

const source = (path: string) => readFileSync(path, 'utf8')

describe('cross-tenant runtime safeguards', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the browser tenant origin before a global configured fallback', () => {
    expect(resolveTenantPublicSiteUrl(
      'https://medellinrewards.com',
      'https://pinas-rewards.vercel.app',
    )).toBe('https://medellinrewards.com')
    expect(resolveTenantPublicSiteUrl(undefined, 'https://pinas-rewards.vercel.app/path')).toBe(
      'https://pinas-rewards.vercel.app',
    )
    expect(resolveTenantPublicSiteUrl('javascript:alert(1)', undefined)).toBe('')
  })

  it.each([
    ['es-CO', 'es'],
    ['es-GT', 'es'],
    ['en-PH', 'en'],
    ['en-US', 'en'],
  ] as const)('maps %s to the expected first-visit language', (locale, language) => {
    expect(getDefaultLanguageForLocale(locale)).toBe(language)
  })

  it('creates a tenant-colored fallback icon without borrowing another tenant logo', () => {
    const icon = getProgramIconHref({
      name: 'Guatemala Rewards',
      primaryColor: '#176b5b',
      logoUrl: null,
    })

    expect(icon).toMatch(/^data:image\/svg\+xml,/)
    expect(decodeURIComponent(icon)).toContain('G</text>')
    expect(icon).not.toContain('pinas')
  })

  it('uses active tenant branding in shared business chrome', () => {
    const layout = source('src/layouts/public-browse-layout.tsx')
    const tenantService = source('src/features/tenant/tenant-service.ts')
    const guatemala = tenantService.slice(
      tenantService.indexOf('guatemala: {'),
      tenantService.indexOf('synergize: {'),
    )

    expect(layout).toContain('<BrandLogo')
    expect(layout).not.toContain('src="/favicon.svg"')
    expect(guatemala).toContain('logoUrl: null')
    expect(guatemala).not.toContain('pinas-rewards-logo')
  })

  it('fails welcome-email branding closed instead of falling back to Medellin', () => {
    const emailApi = source('api/send-welcome-email.ts')

    expect(emailApi).toContain('authorize_early_access_welcome_email')
    expect(emailApi).toContain('No active verified tenant email brand is configured')
    expect(emailApi).not.toContain("name: 'Medellin Rewards'")
    expect(emailApi).not.toContain('return fallback')
    expect(emailApi).toContain('from: `${brand.emailFromName} <${brand.emailFromAddress}>`')
  })

  it('starts from neutral static chrome and resolves known tenant metadata before React', () => {
    const indexHtml = source('index.html')
    const bootstrap = source('public/tenant-bootstrap.js')
    const tenantDocumentBrand = source('src/features/tenant/tenant-document-brand.ts')
    const staticManifest = JSON.parse(source('public/site.webmanifest')) as {
      name: string
      icons: Array<{ src: string }>
    }

    expect(indexHtml).toContain('<title>Rewards Program</title>')
    expect(indexHtml).toContain('href="/rewards-program-mark.svg"')
    expect(indexHtml).not.toContain('rel="canonical"')
    expect(indexHtml).not.toContain('Pinas Rewards')
    expect(indexHtml).not.toContain('pinas-rewards')
    expect(indexHtml).not.toContain('application/ld+json')
    expect(indexHtml).not.toContain('og:image')
    expect(indexHtml).not.toContain('twitter:image')
    for (const tenant of ['Medellin Rewards', 'Guatemala Rewards', 'Synergize', 'Pinas Rewards']) {
      expect(bootstrap).toContain(`name: '${tenant}'`)
    }
    expect(bootstrap).toContain('brands[slug] || neutralBrand')
    expect(bootstrap).not.toContain('hostname.indexOf(key)')
    expect(bootstrap).toContain('dataset.tenantBrand')
    expect(bootstrap).toContain('link[rel="icon"]')
    expect(bootstrap).toContain("canonical.setAttribute('href', canonicalUrl)")
    expect(staticManifest.name).toBe('Rewards Program')
    expect(staticManifest.icons).toEqual([
      expect.objectContaining({ src: '/rewards-program-mark.svg' }),
    ])
    expect(source('public/site.webmanifest')).not.toContain('Pinas Rewards')
    expect(tenantDocumentBrand).toContain("{ src: iconHref, sizes: 'any'")
    expect(tenantDocumentBrand).not.toContain("src: '/icon-192.png'")
  })

  it('honors tenant query overrides only on trusted preview hosts', () => {
    vi.stubGlobal('window', { location: { search: '?tenant=medellin' } })

    expect(getFallbackProgram('guatemalarewards.com').slug).toBe('guatemala')
    expect(getFallbackProgram('localhost').slug).toBe('medellin')
  })

  it('keeps every platform-admin document surface parent branded', () => {
    const tenantProvider = source('src/features/tenant/tenant-provider.tsx')
    const platformDocument = source('src/features/platform/use-platform-document-brand.ts')

    expect(tenantProvider).toContain('!isPlatformAdminPath()')
    for (const surface of [
      'theme-color',
      'og:site_name',
      'og:title',
      'og:description',
      'og:url',
      'twitter:title',
      'twitter:description',
      'apple-mobile-web-app-title',
      'link[rel="icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="canonical"]',
      'link[rel="manifest"]',
    ]) {
      expect(platformDocument).toContain(surface)
    }
    expect(platformDocument).toContain("'/rewards-program-mark.svg'")
    expect(platformDocument).not.toContain('pinas-rewards')
    expect(platformDocument).not.toContain('medellin-rewards')
  })
})
