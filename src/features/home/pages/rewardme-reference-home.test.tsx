import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import reference from './__fixtures__/rewardme-reference-copy.json'
import baseline from './__fixtures__/wondertown-home-main-7428.json'
import { homeMarkupSnapshot, visibleWords } from './__fixtures__/home-markup'
import { RewardMeHomePage } from './rewardme-home'

const current = vi.hoisted(() => ({ slug: 'pinas', language: 'en' as 'en' | 'es' }))
vi.mock('@/hooks/use-tenant', async () => {
  const { seededPrograms } = await import('@/features/tenant/tenant-service')
  return { useTenant: () => ({ program: seededPrograms.find(program => program.slug === current.slug)! }) }
})
vi.mock('@/lib/language', async () => {
  const actual = await vi.importActual<typeof import('@/lib/language')>('@/lib/language')
  return { ...actual, useLanguage: () => ({ language: current.language, t: (text: string, values?: Record<string, string | number>) => actual.translateForLanguage(current.language, text, values) }) }
})

const render = () => renderToStaticMarkup(<MemoryRouter><RewardMeHomePage /></MemoryRouter>)
// User-approved launch amendment, 2026-10-28. Original PDF fixture stays intact.
const approvedLaunchRemovals = [
  '4-week streak',
  'Visit once more this week to keep it',
  'Streak bonuses',
  'Keep your visit streak alive and unlock bonus points the longer it runs.',
] as const
// The removed feature card's adjacent decorative icon is not another phrase.
const removedCardIconIndex = reference.orderedText.indexOf('Streak bonuses') - 1
const retainedPdfCopy = reference.orderedText.filter((phrase, index) =>
  index !== removedCardIconIndex && !approvedLaunchRemovals.some(removed => phrase.replace(/^🔥 /, '') === removed))
describe('PDF-authoritative RewardMe homepage restoration', () => {
  afterEach(() => { current.slug = 'pinas'; current.language = 'en' })

  it('preserves every PDF phrase/order except the four approved 2026-10-28 streak removals', () => {
    const markup = render(), text = visibleWords(markup)
    let cursor = 0
    expect(reference.orderedText[removedCardIconIndex]).toBe('🔥')
    expect(reference.orderedText.length - retainedPdfCopy.length).toBe(approvedLaunchRemovals.length + 1)
    for (const phrase of retainedPdfCopy) {
      const index = text.indexOf(phrase, cursor)
      expect(index, `Missing or reordered PDF copy: ${phrase}`).toBeGreaterThanOrEqual(cursor)
      cursor = index + phrase.length
    }
    expect(markup).toContain('Get rewarded for spending where you already love.</h1>')
    expect(text).not.toContain('Discover the offers available to you.')
    expect(text).not.toContain('Savings is not open for deposits')
    expect(text).not.toContain('Additional tier')
    for (const phrase of approvedLaunchRemovals) expect(text).not.toContain(phrase)
    const links = homeMarkupSnapshot(markup).links
    expect(links.filter(link => link.label === 'For Business').every(link => link.href === '/business')).toBe(true)
    expect(links.filter(link => link.label === 'Join Free' || link.label === 'Join RewardMe Free').every(link => link.href === '/join')).toBe(true)
    expect(links.find(link => link.label === 'Nearby Rewards')?.href).toBe('/shop')
    expect(links.some(link => link.href === '#')).toBe(false)
  })

  it('translates new narrative copy in Spanish without altering English authority', () => {
    current.language = 'es'
    const text = visibleWords(render())
    expect(text).toContain('Recibe recompensas por gastar en los lugares que ya te encantan.')
    for (const phrase of ['Racha de 4 semanas', 'Visítanos una vez más esta semana para mantenerla', 'Bonos por rachas', 'Mantén tu racha de visitas y desbloquea puntos adicionales cuanto más dure.', ...approvedLaunchRemovals]) expect(text).not.toContain(phrase)
    expect(text).toContain('Tres pasos. Cero costo.')
    expect(text).toContain('Únete gratis a RewardMe')
    for (const phrase of reference.orderedText.filter(text => text.length > 45)) expect(text).not.toContain(phrase)
  })

  it.each(['en', 'es'] as const)('preserves the exact %s Wondertown content, links and imagery from main7428', language => {
    current.slug = 'wondertown'; current.language = language
    expect(homeMarkupSnapshot(render())).toEqual(baseline.snapshots[language])
  })

  it('keeps the original mirror markup body unchanged behind an explicit pinas boundary', () => {
    const source = readFileSync('src/features/home/pages/rewardme-home.tsx', 'utf8')
    expect(source).toContain("program.slug === 'pinas' ? <RewardMeReferenceHomePage /> : <RewardMeMirrorHomePage />")
  })
})
