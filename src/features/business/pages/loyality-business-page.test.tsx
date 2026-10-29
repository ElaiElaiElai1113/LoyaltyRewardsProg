import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { translateForLanguage } from '@/lib/language'
import { LoyalityBusinessPage } from './loyality-business-page'

const locale = vi.hoisted(() => ({ value: 'en' as 'en' | 'es' }))
vi.mock('@/hooks/use-tenant', () => ({ useTenant: () => ({ program: { supportEmail: 'support@example.test' } }) }))
vi.mock('@/lib/language', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/language')>()
  return { ...actual, useLanguage: () => ({ t: (text: string) => actual.translateForLanguage(locale.value, text) }) }
})

const approved = JSON.parse(readFileSync('tests/fixtures/loyality-business-launch-2026-10-28.json', 'utf8')) as {
  scope: string
  baselineSource: string
  amendments: Array<{ from: string; to: string; spanish: string }>
}

describe('Loyality public business launch amendment, approved 2026-10-28', () => {
  it('preserves the entire predecessor component except the two dated sentence replacements', () => {
    let expected = approved.baselineSource
    for (const amendment of approved.amendments) {
      expect(expected.split(amendment.from)).toHaveLength(2)
      expected = expected.replace(amendment.from, amendment.to)
    }
    expect(readFileSync(approved.scope, 'utf8')).toBe(expected)
  })

  it.each(['en', 'es'] as const)('renders the amended public copy in %s while retaining ordinary visit/referral content and links', (language) => {
    locale.value = language
    const markup = renderToStaticMarkup(<MemoryRouter><LoyalityBusinessPage /></MemoryRouter>)
    for (const amendment of approved.amendments) {
      expect(markup).toContain(language === 'en' ? amendment.to : amendment.spanish)
      expect(markup).not.toContain(amendment.from)
      expect(translateForLanguage('es', amendment.to)).toBe(amendment.spanish)
    }
    expect(markup).not.toMatch(/milestones|hitos/i)
    for (const unchanged of ['One scan records the visit.', 'Visit reward', '4 visits', 'Referral offer', 'New guest voucher']) {
      expect(markup).toContain(translateForLanguage(language, unchanged))
    }
    expect(markup).toContain('mailto:support@example.test?subject=')
    expect(markup).toContain('href="/signin?portal=business"')
  })
})
