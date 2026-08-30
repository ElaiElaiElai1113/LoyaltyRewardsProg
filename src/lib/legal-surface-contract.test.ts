import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  getLegalJoinLabel,
  getLegalPageContent,
  type LegalPageKind,
} from '@/features/legal/legal-content'
import { translateForLanguage } from '@/lib/language'

const legalPageSource = readFileSync(
  resolve(process.cwd(), 'src/features/legal/pages/legal-page.tsx'),
  'utf8',
)
const designSystemSource = readFileSync(resolve(process.cwd(), 'src/reference-design-systems.css'), 'utf8')
const legalKinds: LegalPageKind[] = ['terms', 'privacy', 'reward-terms', 'verification-policy']

function flattenLegalContent(programSlug: string) {
  return legalKinds.flatMap((kind) => {
    const page = getLegalPageContent(kind, programSlug)
    return [
      page.title,
      page.intro,
      ...(page.notice ? [page.notice] : []),
      ...page.sections.flatMap((section) => [section.title, section.body]),
    ]
  })
}

describe('tenant legal surfaces', () => {
  it('uses semantic tenant theme tokens instead of a hardcoded brown and gold palette', () => {
    expect(legalPageSource).not.toMatch(/#[0-9a-f]{3,8}/i)
    expect(legalPageSource).toContain('bg-[var(--background)]')
    expect(legalPageSource).toContain('border-[var(--border)]')
    expect(legalPageSource).toContain('bg-[var(--card)]')
    expect(legalPageSource).toContain('text-[var(--primary-container)]')
    expect(legalPageSource).toContain('border-[var(--secondary)]/25 bg-[var(--accent)]')
    expect(designSystemSource).toContain('--tenant-accent: var(--ly-teal) !important;')
    expect(designSystemSource).toContain('--tenant-accent-foreground: #ffffff !important;')
    expect(designSystemSource).toContain('--tenant-accent-soft: #e1efed !important;')
  })

  it('keeps RewardMe legal launch wording unchanged for non-demo, non-Loyality tenants', () => {
    const rewardMeTerms = getLegalPageContent('terms', 'pinas')
    const medellinTerms = getLegalPageContent('terms', 'medellin')

    expect(rewardMeTerms.notice).toBe('Operational summary — pending final legal approval before paid membership launch.')
    expect(rewardMeTerms.sections.at(-1)?.title).toBe('Membership subscription')
    expect(medellinTerms).toBe(rewardMeTerms)
    expect(getLegalJoinLabel('pinas')).toBe('Join Rewards Club')
  })

  it('gives Loyality truthful single-business customer-account terms on every legal route', () => {
    const copy = flattenLegalContent('loyality').join(' ')

    for (const kind of legalKinds) {
      expect(getLegalPageContent(kind, 'loyality').notice).toBeUndefined()
    }
    expect(copy).toContain('business loyalty program powered by Loyality')
    expect(copy).toContain('Offers, visit rewards, vouchers')
    expect(copy).toContain('standard customer account is free')
    expect(copy).toContain('does not require a paid membership or government ID')
    expect(copy).not.toMatch(/pending final legal approval|active membership status|completed ID verification|Admins review submitted ID/i)
    expect(getLegalJoinLabel('loyality')).toBe('Create customer account')
  })

  it('keeps Wondertown explicitly fictional and prevents real charges or identity submissions', () => {
    const copy = flattenLegalContent('wondertown').join(' ')

    for (const kind of legalKinds) {
      expect(getLegalPageContent(kind, 'wondertown').notice).toContain('fictional demo environment')
    }
    expect(copy).toContain('does not charge real membership fees')
    expect(copy).toContain('Do not submit real identity documents')
    expect(copy).toContain('do not complete a real transaction')
    expect(copy).not.toMatch(/pending final legal approval|active membership status|completed ID verification|Admins review submitted ID/i)
  })

  it.each(['es', 'tl'] as const)('translates all Loyality and Wondertown legal copy into %s', (language) => {
    const sourceStrings = new Set([
      getLegalJoinLabel('loyality'),
      ...flattenLegalContent('loyality'),
      ...flattenLegalContent('wondertown'),
    ])

    for (const source of sourceStrings) {
      expect(translateForLanguage(language, source), `${language}: ${source}`).not.toBe(source)
    }
  })
})
