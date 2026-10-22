import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyProgramDocumentBrand } from './tenant-document-brand'
import { seededPrograms } from './tenant-service'

describe('RewardMe document install identity', () => {
  afterEach(() => vi.unstubAllGlobals())

  it.each(['pinas', 'wondertown', 'loyality'])('updates %s install metadata without borrowing another tenant identity', (slug) => {
    const writes = new Map<string, string>()
    vi.stubGlobal('document', {
      documentElement: { dataset: {}, style: { setProperty: vi.fn() } },
      querySelector: (selector: string) => ({ setAttribute: (key: string, value: string) => writes.set(`${selector}:${key}`, value) }),
    })
    vi.stubGlobal('window', { location: { origin: 'https://myrewardme.com' } })
    const program = seededPrograms.find(item => item.slug === slug)!
    applyProgramDocumentBrand(program)
    const icon = new URL(writes.get('link[rel="apple-touch-icon"]:href')!, window.location.origin)
    const manifest = new URL(writes.get('link[rel="manifest"]:href')!, window.location.origin)
    expect(icon.searchParams.get('tenant')).toBe(slug)
    if (slug === 'pinas') {
      expect(icon.searchParams.get('v')).toBe('rewardme-client-e2f05324-20261023')
      expect(manifest.searchParams.get('iconv')).toBe('rewardme-client-e2f05324-20261023')
      expect(manifest.searchParams.get('theme')).toBe('forest-20261023')
      expect(writes.get('meta[name="theme-color"]:content')).toBe('#1f3a2e')
    } else {
      expect(icon.searchParams.has('v')).toBe(false)
      expect(manifest.searchParams.has('iconv')).toBe(false)
      expect(manifest.searchParams.has('theme')).toBe(false)
      expect(writes.get('meta[name="theme-color"]:content')).toBe(program.primaryColor)
    }
  })
})
