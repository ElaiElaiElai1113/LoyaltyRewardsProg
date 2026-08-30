import { expect, test, type Page } from '@playwright/test'

type SupportedLanguage = 'en' | 'es' | 'tl'
type HomeTenant = 'rewardme' | 'wondertown'

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

for (const language of ['en', 'es', 'tl'] as const) {
  for (const tenant of ['rewardme', 'wondertown'] as const) {
    test(`${tenant} home preserves the supplied landing copy with ${language.toUpperCase()} saved`, async ({ page }) => {
      await openLocalizedHome(page, tenant, language)

      await expect(page.locator('html')).toHaveAttribute('lang', language)
      if (tenant === 'rewardme') {
        await expect(page.getByRole('heading', { level: 1, name: 'Earn amazing rewards while supporting local businesses.' })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'One account. Clear offers. Local rewards.' })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'The offer tells you exactly what you can earn.' })).toBeVisible()
        await expect(page.getByRole('link', { name: 'Sign in' }).first()).toHaveAttribute('href', '/signin')
        await expect(page.locator('.reference-rewardme')).toBeVisible()
        await expect(page.locator('body')).not.toContainText('Cada pequeño detalle')
        await expect(page.locator('body')).not.toContainText('Bawat munting bagay')
      } else {
        const expected = {
          en: { heading: 'Every little thing feels rewarding.', signIn: 'Member sign in' },
          es: { heading: 'Cada pequeño detalle se siente gratificante.', signIn: 'Acceso de miembro' },
          tl: { heading: 'Bawat munting bagay ay may gantimpala.', signIn: 'Pumasok bilang miyembro' },
        }[language]
        await expect(page.getByRole('heading', { level: 1, name: expected.heading })).toBeVisible()
        await expect(page.locator('.wondertown-home')).toBeVisible()
        await expect(page.getByRole('link', { name: expected.signIn }).first()).toHaveAttribute('href', '/signin')
        await expect(page.locator('.reference-rewardme')).toHaveCount(0)
      }
    })
  }
}

for (const tenant of ['rewardme', 'wondertown'] as const) {
  test(`${tenant} keeps the public actions reachable at 320px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await openLocalizedHome(page, tenant, 'tl')

    if (tenant === 'rewardme') {
      await expect(page.getByRole('link', { name: 'Start free access' }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: 'Start your free access' })).toBeVisible()
    } else {
      await expect(page.getByRole('link', { name: 'Subukan bilang miyembro' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Gumawa ng kuwenta' })).toBeVisible()
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2)
  })
}
