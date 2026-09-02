import { existsSync, readFileSync } from 'node:fs'

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
      'https://loyalty-rewards-prog.vercel.app',
    )).toBe('https://medellinrewards.com')
    expect(resolveTenantPublicSiteUrl(undefined, 'https://loyalty-rewards-prog.vercel.app/path')).toBe(
      'https://loyalty-rewards-prog.vercel.app',
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
    expect(guatemala).not.toContain('rewardme-logo')
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

    expect(indexHtml).toContain('<title>Rewards Program</title>')
    expect(indexHtml).toContain('href="/api/tenant-icon?size=192"')
    expect(indexHtml).toContain('href="/api/tenant-icon?size=180"')
    expect(indexHtml).toContain('href="/api/manifest?v=host-aware-2026"')
    expect(indexHtml).not.toContain('rel="canonical"')
    expect(indexHtml).not.toContain('Pinas Rewards')
    expect(indexHtml).not.toContain('pinas-rewards')
    expect(indexHtml).not.toContain('application/ld+json')
    expect(indexHtml).not.toContain('og:image')
    expect(indexHtml).not.toContain('twitter:image')
    for (const tenant of ['Medellin Rewards', 'Guatemala Rewards', 'Synergize', 'RewardMe', 'Wondertown Rewards']) {
      expect(bootstrap).toContain(`name: '${tenant}'`)
    }
    expect(bootstrap).toContain('brands[slug] || neutralBrand')
    expect(bootstrap).not.toContain('hostname.indexOf(key)')
    expect(bootstrap).toContain('dataset.tenantBrand')
    expect(bootstrap).toContain('link[rel="icon"]')
    expect(bootstrap).toContain("canonical.setAttribute('href', canonicalUrl)")
    for (const legacyPath of [
      'public/site.webmanifest',
      'public/apple-touch-icon.png',
      'public/favicon.ico',
      'public/favicon.svg',
      'public/icon-192.png',
      'public/icon-512.png',
    ]) {
      expect(existsSync(legacyPath)).toBe(false)
    }
    expect(tenantDocumentBrand).toContain('/api/tenant-icon?size=192&tenant=')
    expect(tenantDocumentBrand).toContain('/api/tenant-icon?size=180&tenant=')
    expect(tenantDocumentBrand).toContain('/api/manifest?v=host-aware-2026&tenant=')
    expect(tenantDocumentBrand).not.toContain('data:application/manifest+json')
  })

  it('honors tenant query overrides only on trusted preview hosts', () => {
    vi.stubGlobal('window', { location: { search: '?tenant=medellin' } })

    expect(getFallbackProgram('guatemalarewards.com').slug).toBe('guatemala')
    expect(getFallbackProgram('localhost').slug).toBe('medellin')

    vi.stubGlobal('window', { location: { search: '?tenant=rewardme' } })
    expect(getFallbackProgram('127.0.0.1').slug).toBe('pinas')
    expect(getFallbackProgram('rewardme.rewardsplatform.app').slug).toBe('pinas')
  })

  it('keeps local RewardMe previews off stale production service workers', () => {
    const entry = source('src/main.tsx')
    const viteConfig = source('vite.config.ts')

    expect(entry).toContain('if (import.meta.env.PROD)')
    expect(entry).toContain('navigator.serviceWorker.getRegistrations()')
    expect(entry).toContain('registration.unregister()')
    expect(viteConfig).toContain("server.middlewares.use('/sw.js'")
    expect(viteConfig).toContain("response.setHeader('Cache-Control', 'no-store, max-age=0')")
    expect(viteConfig).toContain('await self.registration.unregister()')
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
    expect(platformDocument).toContain('/api/tenant-icon?size=192&tenant=platform')
    expect(platformDocument).toContain('/api/tenant-icon?size=180&tenant=platform')
    expect(platformDocument).toContain('/api/manifest?v=host-aware-2026&tenant=platform')
    expect(platformDocument).not.toContain('pinas-rewards')
    expect(platformDocument).not.toContain('medellin-rewards')
  })
})
