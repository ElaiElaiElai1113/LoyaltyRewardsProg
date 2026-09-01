import { expect, test, type Page } from '@playwright/test'

type SupportedLanguage = 'en' | 'es' | 'tl'
type HomeTenant = 'rewardme' | 'wondertown'

const storageSlug: Record<HomeTenant, string> = {
  rewardme: 'pinas',
  wondertown: 'wondertown',
}

const localizedHomeCopy: Record<SupportedLanguage, {
  hero: string
  account: string
  rates: string
  signIn: string
  start: string
  startLong: string
  seeHow: string
  wondertownEyebrow: string
  wondertownStamp: string
  rewardmeStamp: string
}> = {
  en: {
    hero: 'Earn amazing rewards while supporting local businesses.',
    account: 'One account. Clear offers. Local rewards.',
    rates: 'The offer tells you exactly what you can earn.',
    signIn: 'Sign in',
    start: 'Start free access',
    startLong: 'Start your free access',
    seeHow: 'See how it works',
    wondertownEyebrow: 'RewardMe test environment · fictional data',
    wondertownStamp: 'Sandbox account',
    rewardmeStamp: 'Member account',
  },
  es: {
    hero: 'Obtén recompensas increíbles mientras apoyas a los negocios locales.',
    account: 'Una cuenta. Ofertas claras. Recompensas locales.',
    rates: 'La oferta te dice exactamente lo que puedes obtener.',
    signIn: 'Iniciar sesión',
    start: 'Comenzar acceso gratuito',
    startLong: 'Comienza tu acceso gratuito',
    seeHow: 'Ver cómo funciona',
    wondertownEyebrow: 'Entorno de prueba de RewardMe · datos ficticios',
    wondertownStamp: 'Cuenta de prueba',
    rewardmeStamp: 'Cuenta de miembro',
  },
  tl: {
    hero: 'Makakuha ng magagandang reward habang sinusuportahan ang mga lokal na negosyo.',
    account: 'Isang account. Malinaw na alok. Lokal na rewards.',
    rates: 'Malinaw na sinasabi ng alok kung ano ang maaari mong kitain.',
    signIn: 'Pumasok',
    start: 'Simulan ang libreng pagpasok',
    startLong: 'Simulan ang iyong libreng access',
    seeHow: 'Tingnan kung paano ito gumagana',
    wondertownEyebrow: 'RewardMe test environment · kathang-isip na data',
    wondertownStamp: 'Test account',
    rewardmeStamp: 'Account ng miyembro',
  },
}

async function openLocalizedHome(page: Page, tenant: HomeTenant, language: SupportedLanguage) {
  await page.addInitScript(({ slug, selectedLanguage }) => {
    window.localStorage.setItem(`rewards:${slug}:language`, selectedLanguage)
  }, { slug: storageSlug[tenant], selectedLanguage: language })
  await page.goto(`/?tenant=${tenant}`)
}

for (const language of ['en', 'es', 'tl'] as const) {
  for (const tenant of ['rewardme', 'wondertown'] as const) {
    test(`${tenant} home localizes the complete landing experience with ${language.toUpperCase()} saved`, async ({ page }) => {
      await openLocalizedHome(page, tenant, language)
      const copy = localizedHomeCopy[language]

      await expect(page.locator('html')).toHaveAttribute('lang', language)
      await expect(page.locator('.reference-rewardme')).toBeVisible()
      await expect(page.getByRole('heading', { level: 1, name: copy.hero })).toBeVisible()
      await expect(page.getByRole('heading', { name: copy.account })).toBeVisible()
      await expect(page.getByRole('heading', { name: copy.rates })).toBeVisible()
      await expect(page.getByRole('link', { name: copy.signIn }).first()).toHaveAttribute('href', '/signin')
      await expect(page.locator('.reference-rewardme__logo').first()).toContainText(
        tenant === 'wondertown' ? 'Wondertown Rewards' : 'RewardMe',
      )

      if (tenant === 'wondertown') {
        await expect(page.locator('.reference-rewardme')).toHaveAttribute('data-wondertown-rewardme-mirror', 'true')
        await expect(page.locator('.reference-rewardme__eyebrow').first()).toHaveText(copy.wondertownEyebrow)
        await expect(page.locator('.reference-rewardme__stamp')).toHaveText(copy.wondertownStamp)
      } else {
        await expect(page.locator('.reference-rewardme')).not.toHaveAttribute('data-wondertown-rewardme-mirror')
        await expect(page.locator('.reference-rewardme__stamp')).toHaveText(copy.rewardmeStamp)
      }
    })
  }
}

for (const tenant of ['rewardme', 'wondertown'] as const) {
  test(`${tenant} keeps the public actions reachable at 320px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await openLocalizedHome(page, tenant, 'tl')
    const copy = localizedHomeCopy.tl

    await expect(page.locator('.reference-rewardme')).toBeVisible()
    await expect(page.getByRole('link', { name: copy.start }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: copy.startLong })).toBeVisible()
    await expect(page.getByRole('link', { name: copy.seeHow })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2)
  })
}
