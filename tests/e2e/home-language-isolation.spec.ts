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
      await expect(page.getByRole('heading', { level: 1, name: 'Get rewarded for spending where you already love.' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Three steps. Zero cost.' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Built to feel like a win, every visit.' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Sign In' }).first()).toHaveAttribute('href', '/signin')
      await expect(page.locator('.reference-rewardme')).toBeVisible()
      await expect(page.locator('body')).not.toContainText('Convierte lo que ya gastas')
      await expect(page.locator('body')).not.toContainText('Bawat munting bagay')
    })
  }
}

for (const tenant of ['rewardme', 'wondertown'] as const) {
  test(`${tenant} keeps the public actions reachable at 320px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await openLocalizedHome(page, tenant, 'tl')

    await expect(page.getByRole('link', { name: 'Sign In' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Join Free' }).first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2)
  })
}
