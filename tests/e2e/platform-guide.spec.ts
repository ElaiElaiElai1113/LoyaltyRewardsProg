import { expect, test, type Page } from '@playwright/test'

async function expectEnglishPublicShell(page: Page) {
  const header = page.locator('header')
  const footer = page.locator('footer')

  await expect(header).toContainText('Golden Circle')
  await expect(header.getByRole('link', { name: 'Guide', exact: true })).toBeVisible()
  await expect(header.getByRole('link', { name: 'For Businesses', exact: true })).toBeVisible()
  await expect(header.getByRole('link', { name: 'Join Rewards Club', exact: true })).toBeVisible()
  await expect(footer.getByRole('link', { name: 'Terms', exact: true })).toBeVisible()
  await expect(footer.getByRole('link', { name: 'Privacy', exact: true })).toBeVisible()
  await expect(page.locator('body')).not.toContainText('Círculo Dorado')
  await expect(page.locator('body')).not.toContainText('Ginintuang Lupon')
}

test.describe('platform guide workflow', () => {
  test('public guide explains the program without exposing private role portals', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('rewards:pinas:language', 'es'))
    await page.goto('/guide')

    await expect(page).toHaveURL(/\/guide$/)
    await expect(page.getByRole('heading', { name: 'Guia de la plataforma' })).toBeVisible()
    await expect(page.getByText('Empieza aqui')).toBeVisible()
    await expect(page.getByText('Storyboard con pantallas')).not.toBeVisible()
    await expect(page.getByText('English version')).not.toBeVisible()
    await expect(page.getByText('Platform guide', { exact: true })).not.toBeVisible()
    await expect(page.locator('header')).toContainText('Círculo Dorado')
    await expect(page.locator('header')).not.toContainText('Golden Circle')

    await expect(page.getByText('Guion en espanol')).not.toBeVisible()
    await expect(page.getByText('Script base para grabar')).not.toBeVisible()
    await expect(page.getByText('Notas para presentar')).not.toBeVisible()
    await expect(page.locator('body')).not.toContainText('Que es Medellin Rewards')
    await expect(page.locator('body')).not.toContainText('Experiencia del cliente')
    await expect(page.locator('body')).not.toContainText('Flujo para negocios')
    await expect(page.locator('body')).not.toContainText('Flujo para administradores')
    await expect(page.locator('body')).not.toContainText('What the platform does')

    await expect(page.getByTestId('platform-guide').getByRole('link', { name: 'Ver mapa' })).toHaveAttribute('href', '/shop')
    await expect(page.getByTestId('platform-guide').getByRole('link', { name: 'Para negocios' })).toHaveAttribute('href', '/business')
    await expect(page.getByTestId('platform-guide').getByRole('link', { name: 'Iniciar sesion' })).toHaveAttribute('href', '/signin')
    await expect(page.getByTestId('platform-guide')).toHaveAttribute('data-guide-audience', 'public')
    await expect(page.locator('main a[href^="/admin"]')).toHaveCount(0)
    await expect(page.locator('main a[href^="/business/"]')).toHaveCount(0)
  })

  test('public guide follows the English language preference without Spanish guide copy', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('rewards:pinas:language', 'en')
    })

    await page.goto('/guide')

    await expect(page).toHaveURL(/\/guide$/)
    await expect(page.getByRole('heading', { name: 'Platform guide' })).toBeVisible()
    await expect(page.getByText('Start here')).toBeVisible()
    await expect(page.getByText('Screen storyboard')).not.toBeVisible()

    await expect(page.getByText('English script')).not.toBeVisible()
    await expect(page.getByText('Recording script')).not.toBeVisible()
    await expect(page.getByText('Presentation notes')).not.toBeVisible()
    await expect(page.locator('body')).not.toContainText('What the platform does')
    await expect(page.locator('body')).not.toContainText('Customer flow')
    await expect(page.locator('body')).not.toContainText('Business flow')
    await expect(page.locator('body')).not.toContainText('Admin flow')
    await expect(page.getByText('Guia de la plataforma')).not.toBeVisible()
    await expect(page.getByText('Guion en espanol')).not.toBeVisible()
    await expect(page.locator('body')).not.toContainText('Experiencia del cliente')

    await expect(page.getByTestId('platform-guide').getByRole('link', { name: 'View map' })).toHaveAttribute('href', '/shop')
    await expect(page.getByTestId('platform-guide').getByRole('link', { name: 'For businesses' })).toHaveAttribute('href', '/business')
    await expect(page.getByTestId('platform-guide').getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/signin')
    await expect(page.getByTestId('platform-guide')).toHaveAttribute('data-guide-audience', 'public')
    await expect(page.locator('main a[href^="/admin"]')).toHaveCount(0)
    await expect(page.locator('main a[href^="/business/"]')).toHaveCount(0)
  })

  test('public navigation exposes the guide link', async ({ page }) => {
    await page.goto('/shop')

    await expect(page.getByRole('link', { name: 'Guide' })).toHaveAttribute('href', '/guide')
    await page.getByRole('link', { name: 'Guide' }).click()
    await expect(page).toHaveURL(/\/guide$/)
    await expect(page.getByRole('heading', { name: 'Platform guide' })).toBeVisible()
  })

  test('Wondertown guide uses Wondertown copy and tenant-specific screenshots', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('rewards:wondertown:language', 'en')
    })

    await page.goto('/guide?tenant=wondertown')

    await expect(page).toHaveTitle('Wondertown Rewards')
    await expect(page.locator('body')).toContainText('Wondertown Rewards')
    await expect(page.locator('body')).not.toContainText(/medell[ií]n/i)

    const screenshots = page.locator('img[src*="/walkthrough-screenshots/"]')
    await expect(screenshots).toHaveCount(2)
    const sources = await screenshots.evaluateAll((images) => images.map((image) => image.getAttribute('src')))
    expect(sources).toEqual([
      '/walkthrough-screenshots/wondertown/public-map.png',
      '/walkthrough-screenshots/wondertown/business-page.png',
    ])
    await expect(page.getByText('Screen storyboard')).not.toBeVisible()
    await expect(page.locator('main a[href^="/admin"]')).toHaveCount(0)
    await expect(page.locator('main a[href^="/business/"]')).toHaveCount(0)
  })

  test('RewardMe guide uses RewardMe copy and tenant-specific screenshots', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('rewards:pinas:language', 'en')
    })

    await page.goto('/guide?tenant=rewardme')

    await expect(page).toHaveTitle('RewardMe')
    await expect(page.locator('body')).toContainText('RewardMe')
    await expect(page.locator('body')).not.toContainText(/medell[ií]n/i)

    const screenshots = page.locator('img[src*="/walkthrough-screenshots/"]')
    await expect(screenshots).toHaveCount(2)
    const sources = await screenshots.evaluateAll((images) => images.map((image) => image.getAttribute('src')))
    expect(sources).toEqual([
      '/walkthrough-screenshots/rewardme/public-map.png',
      '/walkthrough-screenshots/rewardme/business-page.png',
    ])
    await expect(page.getByText('Screen storyboard')).not.toBeVisible()
    await expect(page.locator('main a[href^="/admin"]')).toHaveCount(0)
    await expect(page.locator('main a[href^="/business/"]')).toHaveCount(0)
  })

  test('RewardMe public guide replaces a legacy Tagalog preference with English', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('rewards:pinas:language', 'tl')
    })

    await page.goto('/guide?tenant=rewardme')

    const guide = page.getByTestId('platform-guide')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('heading', { name: 'Platform guide' })).toBeVisible()
    const picker = page.getByRole('combobox', { name: 'Language' })
    await expect(picker).toHaveValue('en')
    await expect(picker.locator('option')).toHaveText(['English', 'Spanish'])
    await expect(guide.getByText('Start here')).toBeVisible()
    await expect(guide.locator('img[src*="/walkthrough-screenshots/"]')).toHaveCount(2)
    await expectEnglishPublicShell(page)
  })

  test('mobile guide keeps the active language control visible without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await page.addInitScript(() => {
      window.localStorage.setItem('rewards:pinas:language', 'tl')
    })

    await page.goto('/guide?tenant=rewardme')

    const picker = page.getByRole('combobox', { name: 'Language' })
    await expect(picker).toBeVisible()
    await expect(picker.locator('option')).toHaveCount(2)
    const menuToggle = page.locator('.product-public-shell__menu-toggle')
    await expect(menuToggle).toBeVisible()
    await menuToggle.click()
    const mobileNavigation = page.locator('#product-public-mobile-navigation')
    await expect(mobileNavigation.getByRole('link', { name: 'Join Rewards Club' })).toBeVisible()
    await expect(mobileNavigation.getByRole('link', { name: 'Sign In' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2)
  })

  test('Wondertown public guide replaces a legacy Tagalog preference with English', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('rewards:wondertown:language', 'tl')
    })

    await page.goto('/guide?tenant=wondertown')

    const guide = page.getByTestId('platform-guide')
    await expect(page).toHaveTitle('Wondertown Rewards')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('heading', { name: 'Platform guide' })).toBeVisible()
    await expect(guide.getByText('Start here')).toBeVisible()
    await expect(guide).not.toContainText('Guia de la plataforma')
    await expect(guide.locator('img[src*="/walkthrough-screenshots/"]')).toHaveCount(2)
    await expect(guide.getByTestId('localized-guide-preview')).toHaveCount(0)
    await expectEnglishPublicShell(page)
  })

  test('Spanish guides do not embed English screenshot text', async ({ page }) => {
    for (const tenant of ['rewardme', 'wondertown']) {
      await page.addInitScript((tenantSlug) => {
        window.localStorage.setItem(`rewards:${tenantSlug === 'rewardme' ? 'pinas' : tenantSlug}:language`, 'es')
      }, tenant)
      await page.goto(`/guide?tenant=${tenant}`)

      const guide = page.getByTestId('platform-guide')
      await expect(page.getByRole('heading', { name: 'Guia de la plataforma' })).toBeVisible()
      await expect(guide.locator('img[src*="/walkthrough-screenshots/"]')).toHaveCount(0)
      await expect(guide.getByTestId('localized-guide-preview')).toHaveCount(2)
    }
  })

})
