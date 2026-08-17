import { expect, test, type Page } from '@playwright/test'

type SupportedLanguage = 'en' | 'es' | 'tl'
type HomeTenant = 'rewardme' | 'wondertown'

const languageLabels: Record<SupportedLanguage, string> = {
  en: 'Language',
  es: 'Idioma',
  tl: 'Wika',
}

const storageSlug: Record<HomeTenant, string> = {
  rewardme: 'pinas',
  wondertown: 'wondertown',
}

async function openLocalizedHome(page: Page, tenant: HomeTenant, language: SupportedLanguage) {
  await page.addInitScript(({ slug, selectedLanguage }) => {
    window.localStorage.setItem(`rewards:${slug}:language`, selectedLanguage)
  }, { slug: storageSlug[tenant], selectedLanguage: language })
  await page.goto(`/?tenant=${tenant}`)
}

const rewardMeExpectations = {
  en: {
    heading: "Turn what you already spend into what you're saving for.",
    present: 'Three steps. That\'s the whole system.',
    absent: ['Convierte lo que ya gastas', 'Gawing ipon para sa mahalaga'],
  },
  es: {
    heading: 'Convierte lo que ya gastas en aquello para lo que estás ahorrando.',
    present: 'Tres pasos. Ese es todo el sistema.',
    absent: ['Turn what you already spend', 'Gawing ipon para sa mahalaga', 'Three steps. That\'s the whole system.'],
  },
  tl: {
    heading: 'Gawing ipon para sa mahalaga ang karaniwan mo nang gastos.',
    present: 'Tatlong hakbang. Iyon na ang buong sistema.',
    absent: ['Turn what you already spend', 'Convierte lo que ya gastas', 'Three steps. That\'s the whole system.'],
  },
} as const

const wondertownExpectations = {
  en: {
    heading: 'Every little thing feels rewarding.',
    present: 'Three stops. Full-circle testing.',
    absent: ['Cada pequeño detalle', 'Bawat munting bagay'],
  },
  es: {
    heading: 'Cada pequeño detalle se siente gratificante.',
    present: 'Tres paradas. Una prueba completa.',
    absent: ['Every little thing', 'Bawat munting bagay', 'Three stops. Full-circle testing.'],
  },
  tl: {
    heading: 'Bawat munting bagay ay may gantimpala.',
    present: 'Tatlong hintuan. Kumpletong pagsubok.',
    absent: ['Every little thing', 'Cada pequeño detalle', 'Three stops. Full-circle testing.'],
  },
} as const

const forbiddenLocalizedPhrases: Record<Exclude<SupportedLanguage, 'en'>, Record<HomeTenant, readonly string[]>> = {
  es: {
    rewardme: ['Your Rewards', 'Free', 'Commission model', 'Business-credit model', 'Rewards utilizados'],
    wondertown: ['Rewards Platform', 'Demo highlights', 'Create account', 'Full-circle testing'],
  },
  tl: {
    rewardme: [
      'payment card', 'account', 'trial', 'referral', 'team', 'membership', 'partner', 'live catalog',
      'inventory', 'rate', 'availability', 'model', 'off-peak', 'lock', 'eligibility', 'payout',
      'member store', 'commission', 'business credits', 'network', 'customer', 'audience', 'Mag-sign in',
    ],
    wondertown: [
      'rewards experience', 'demo', 'data', 'sandbox', 'platform', 'customer', 'counter', 'marketplace',
      'record', 'stylist', 'member account', 'gift card', 'workflow', 'Mag-sign in',
    ],
  },
}

async function expectNoForeignUiPhrases(page: Page, tenant: HomeTenant, language: SupportedLanguage) {
  if (language === 'en') return
  const bodyText = await page.locator('body').innerText()
  for (const forbiddenPhrase of forbiddenLocalizedPhrases[language][tenant]) {
    expect(bodyText.toLocaleLowerCase()).not.toContain(forbiddenPhrase.toLocaleLowerCase())
  }
}

for (const language of ['en', 'es', 'tl'] as const) {
  test(`RewardMe home keeps ${language.toUpperCase()} copy isolated`, async ({ page }) => {
    const expected = rewardMeExpectations[language]
    await openLocalizedHome(page, 'rewardme', language)

    await expect(page.locator('html')).toHaveAttribute('lang', language)
    await expect(page.getByRole('combobox', { name: languageLabels[language] })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(expected.heading)
    await expect(page.getByText(expected.present, { exact: true })).toBeVisible()
    for (const forbiddenCopy of expected.absent) {
      await expect(page.locator('body')).not.toContainText(forbiddenCopy)
    }
    await expectNoForeignUiPhrases(page, 'rewardme', language)
  })

  test(`Wondertown home keeps ${language.toUpperCase()} copy isolated`, async ({ page }) => {
    const expected = wondertownExpectations[language]
    await openLocalizedHome(page, 'wondertown', language)

    await expect(page.locator('html')).toHaveAttribute('lang', language)
    await expect(page.getByRole('combobox', { name: languageLabels[language] })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(expected.heading)
    await expect(page.getByText(expected.present, { exact: true })).toBeVisible()
    for (const forbiddenCopy of expected.absent) {
      await expect(page.locator('body')).not.toContainText(forbiddenCopy)
    }
    await expectNoForeignUiPhrases(page, 'wondertown', language)
  })
}

for (const tenant of ['rewardme', 'wondertown'] as const) {
  test(`${tenant} keeps the language picker reachable at 320px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await openLocalizedHome(page, tenant, 'tl')

    const picker = page.getByRole('combobox', { name: 'Wika' })
    await expect(picker).toBeVisible()
    const pickerBox = await picker.boundingBox()
    expect(pickerBox).not.toBeNull()
    expect(pickerBox!.x).toBeGreaterThanOrEqual(0)
    expect(pickerBox!.x + pickerBox!.width).toBeLessThanOrEqual(320)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2)

    await picker.selectOption('es')
    await expect(page.getByRole('combobox', { name: 'Idioma' })).toHaveValue('es')
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  })
}
