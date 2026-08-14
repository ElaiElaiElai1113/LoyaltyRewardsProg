import { expect, test } from '@playwright/test'

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

    await expect(page.getByRole('link', { name: 'Guia' })).toHaveAttribute('href', '/guide')
    await page.getByRole('link', { name: 'Guia' }).click()
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

})
