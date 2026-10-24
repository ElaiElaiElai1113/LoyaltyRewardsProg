import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
const tenant = vi.hoisted(() => ({ program: { name: 'RewardMe', slug: 'pinas', logoUrl: '/private-custom-logo.svg' } }))
vi.mock('@/hooks/use-tenant', () => ({ useTenant: () => tenant }))
import { BrandLogo } from './brand-logo'

describe('public logo source override', () => {
  afterEach(() => { tenant.program = { name: 'RewardMe', slug: 'pinas', logoUrl: '/private-custom-logo.svg' } })
  it('uses the public source only when explicitly provided, preserving accessible brand text', () => {
    const html = renderToStaticMarkup(<BrandLogo imageSrc="/rewardme-client-logo-132.webp" showText={false} />)
    expect(html).toContain('src="/rewardme-client-logo-132.webp"')
    expect(html).toContain('alt="RewardMe"')
    expect(html).toContain('class="sr-only">RewardMe</span>')
  })
  it('keeps a private/custom configured logo when the public override is absent', () => {
    expect(renderToStaticMarkup(<BrandLogo />)).toContain('src="/private-custom-logo.svg"')
  })
  it('does not change Wondertown default branding', () => {
    tenant.program = { name: 'Wondertown Rewards', slug: 'wondertown', logoUrl: '/wondertown-rewards-logo.svg' }
    const html = renderToStaticMarkup(<BrandLogo />)
    expect(html).toContain('src="/wondertown-rewards-logo.svg"')
    expect(html).not.toContain('rewardme-client')
  })
})
