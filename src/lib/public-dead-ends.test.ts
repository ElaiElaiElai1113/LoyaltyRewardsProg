import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(path, 'utf8')

describe('public calls to action', () => {
  it('keeps the marketing contact link connected to tenant support', () => {
    const home = source('src/features/home/pages/home-page.tsx')

    expect(home).toContain('href={`mailto:${program.supportEmail}`}')
    expect(home).not.toContain('<Link to="/terms">{tx(\'Contact\')}</Link>')
  })

  it('routes the fictional Wondertown business calls to working demo pages', () => {
    const businessPage = source('src/features/business/pages/for-businesses-page.tsx')
    const customerLayout = source('src/layouts/customer-layout.tsx')
    const publicLayout = source('src/layouts/public-browse-layout.tsx')

    expect(businessPage).toContain('const isDemoTenant = program.featureFlags.demoTenant === true')
    expect(businessPage).toContain('to="/business/login"')
    expect(businessPage).toContain('Open Business Demo')
    expect(businessPage).toContain('to="/guide"')
    expect(businessPage).toContain('View Demo Guide')
    expect(publicLayout).toContain('program.featureFlags.demoTenant')
    expect(publicLayout).toContain('<NavLink to="/guide">Demo guide</NavLink>')
    expect(customerLayout).toContain('program.featureFlags.demoTenant')
    expect(customerLayout).toContain('href={`mailto:${program.supportEmail}`}')
  })

  it('uses working routes for company navigation in the member footer', () => {
    const customerLayout = source('src/layouts/customer-layout.tsx')

    expect(customerLayout).toContain('<NavLink to="/guide"')
    expect(customerLayout).toContain('<NavLink to="/shop"')
    expect(customerLayout).not.toContain('<span className="text-sm text-[var(--muted-foreground)]">{t(\'About Us\')}</span>')
    expect(customerLayout).not.toContain('<span className="text-sm text-[var(--muted-foreground)]">{t(\'Contact\')}</span>')
    expect(customerLayout).not.toContain('<span className="text-sm text-[var(--muted-foreground)]">{t(\'Store Locator\')}</span>')
  })

  it('does not expose unfinished placeholder labels on legal pages', () => {
    const legalPage = source('src/features/legal/pages/legal-page.tsx')

    expect(legalPage.toLowerCase()).not.toContain('placeholder')
    expect(legalPage.toLowerCase()).not.toContain('replace with reviewed legal copy')
  })
})
