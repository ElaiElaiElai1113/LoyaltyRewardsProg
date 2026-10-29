import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthPortalShell } from '@/features/auth/components/auth-portal-shell'
import { RewardMeJoinPage } from '@/features/join/pages/join-rewards-page'
import { CommissionBusinessApplicationPage, CreditBusinessApplicationPage } from '@/features/business/pages/business-application-page'
import { homeMarkupSnapshot } from '@/features/home/pages/__fixtures__/home-markup'

const current = vi.hoisted(() => ({ slug: 'pinas', language: 'en' as 'en' | 'es' }))
vi.mock('@/hooks/use-tenant', async () => {
  const { seededPrograms } = await import('@/features/tenant/tenant-service')
  return { useTenant: () => ({ program: seededPrograms.find(program => program.slug === current.slug)! }) }
})
vi.mock('@/hooks/use-auth', () => ({ useAuth: () => ({ profile: null, signUp: vi.fn() }) }))
vi.mock('@/components/theme-toggle', () => ({ ThemeToggle: () => <button type="button">Theme control</button> }))
vi.mock('@/lib/language', async () => {
  const actual = await vi.importActual<typeof import('@/lib/language')>('@/lib/language')
  return { ...actual, useLanguage: () => ({ language: current.language, setLanguage: vi.fn(), t: (text: string, values?: Record<string, string | number>) => actual.translateForLanguage(current.language, text, values) }) }
})
const routes = {
  '/signin': () => <AuthPortalShell activeTab="signin"><form><button type="submit">Controlled sign-in form</button></form></AuthPortalShell>,
  '/join': () => <RewardMeJoinPage />,
  '/business/apply/commission': () => <CommissionBusinessApplicationPage />,
  '/business/apply/credit': () => <CreditBusinessApplicationPage />,
}
type Route = keyof typeof routes
function render(route: Route) {
  const Page = routes[route]
  return renderToStaticMarkup(<MemoryRouter initialEntries={[route]}><Page /></MemoryRouter>)
}

describe('2026-10-28 RewardMe launch logo correction', () => {
  beforeEach(() => { vi.stubGlobal('window', { location: { hostname: 'localhost' } }) })
  afterEach(() => { current.slug = 'pinas'; current.language = 'en'; vi.unstubAllGlobals() })

  it.each(Object.keys(routes) as Route[])('uses the supplied client image at %s without old/star header marks', route => {
    const markup = render(route)
    const header = markup.match(/<header[\s\S]*?<\/header>/)?.[0] ?? ''
    expect(header).toContain('src="/rewardme-client-logo-132.webp"')
    expect(header).not.toContain('/rewardme-mark.svg')
    expect(header).not.toContain('✦')
    expect(header).toContain('RewardMe')
    expect(homeMarkupSnapshot(markup).links.some(link => link.href === '/' || link.href === '/landing-page')).toBe(true)
  })

  // Captured from exact main5cc80001 before implementation. No approved launch
  // copy or logo change applies to Wondertown's public supporting surfaces.
  it.each(['en', 'es'] as const)('preserves exact %s Wondertown supporting-page copy, links, images and form controls', language => {
    current.slug = 'wondertown'; current.language = language
    for (const route of Object.keys(routes) as Route[]) {
      const markup = render(route)
      expect({ ...homeMarkupSnapshot(markup), controls: markup.match(/<(?:input|select|option|button)\b[^>]*>/g) }).toMatchSnapshot(route)
    }
  })
})
