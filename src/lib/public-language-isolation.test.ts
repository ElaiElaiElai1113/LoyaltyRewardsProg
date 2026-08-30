import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('public and account language isolation', () => {
  it('routes public membership, signup, legal, and account controls through translations', () => {
    const membership = source('src/features/membership/pages/rewardme-membership-page.tsx')
    const join = source('src/features/join/pages/join-rewards-page.tsx')
    const legal = source('src/features/legal/pages/legal-page.tsx')
    const earlyAccess = source('src/features/early-access/pages/early-access-page.tsx')
    const signIn = source('src/features/auth/pages/landing-page.tsx')
    const themeToggle = source('src/components/theme-toggle.tsx')

    expect(membership).toContain("t('Choose how you want to earn.')")
    expect(membership).toContain("t('RewardMe membership plans')")
    expect(membership).toContain('placeholder={t(\'Tell the team why you want to cancel\')}')
    expect(join).toContain("t('Three-month free access')")
    expect(join).toContain("t('Hide password')")
    expect(legal).toContain('tenantText(page.intro)')
    expect(legal).toContain('tenantText(section.body)')
    expect(earlyAccess).toContain("'Request Regular or Gold access'")
    expect(earlyAccess).toContain('usesAssignedInvitation')
    expect(earlyAccess).toContain("t('International phone number')")
    expect(signIn).toContain("t('Choose sign-in account type')")
    expect(signIn).toContain("t('Show password')")
    expect(themeToggle).toContain("t('Switch to dark mode')")
    expect(themeToggle).toContain("t('Switch to light mode')")
  })

  it('defines Spanish and Tagalog copies for representative route fixtures', () => {
    const language = source('src/lib/language.tsx')
    const requiredKeys = [
      'Find partner businesses in {program} and open their products from the map.',
      'Choose how you want to earn.',
      'Three-month free access',
      'Switch to dark mode',
      'Request Regular or Gold access',
      'These plain-language terms explain the current RewardMe member experience and the responsibilities that come with using it.',
      'Members are responsible for keeping account details accurate and secure. One member account should represent one real person.',
      'This privacy summary explains the information RewardMe uses to operate accounts, rewards, support, and verification.',
      'No cash payout promise',
      'Why verification is required',
      'Page not found',
    ]

    for (const key of requiredKeys) {
      expect(language.split(`'${key}'`).length - 1, key).toBeGreaterThanOrEqual(2)
    }

    expect(language).toContain("'Choose how you want to earn.': 'Piliin kung paano mo gustong kumita.'")
    expect(language).toContain("'Three-month free access': 'Tatlong buwang libreng pagpasok'")
    expect(language).toContain("'Switch to dark mode': 'Lumipat sa madilim na anyo'")
    expect(language).toContain("'Member accounts': 'Mga kuwenta ng miyembro'")
    expect(language).not.toContain("'Member accounts': 'Mga Account ng Miyembro'")
    expect(language).not.toContain("'Password': 'Password'")
  })
})
