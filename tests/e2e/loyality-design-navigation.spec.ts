import { expect, test } from '@playwright/test'

test('Loyality navigation dismisses accessibly and resets across breakpoints', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?tenant=loyality')
  const toggle = page.locator('.reference-loyality__menu-toggle')
  const menu = page.locator('#loyality-mobile-navigation')

  await toggle.click()
  await expect(menu).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await expect(toggle).toBeFocused()

  await toggle.click()
  await page.locator('.reference-loyality h1').click()
  await expect(menu).toBeHidden()

  await toggle.click()
  await menu.getByRole('link', { name: 'How it works', exact: true }).click()
  await expect(menu).toBeHidden()
  await expect(page).toHaveURL(/#how$/)
  await expect(page.locator('.reference-loyality__nav-links a[href="#how"]')).toHaveAttribute('aria-current', 'location')

  await toggle.click()
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(menu).toBeHidden()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(menu).toBeHidden()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
})

for (const width of [320, 375, 390, 430, 768, 1440]) {
  test(`supplied Loyality logo loads without distortion at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/?tenant=loyality')
    const logos = page.locator('.reference-loyality__logo img')
    await expect(logos).toHaveCount(2)
    for (const logo of await logos.all()) {
      await logo.scrollIntoViewIfNeeded()
      await expect(logo).toHaveAttribute('alt', 'Loyality')
      await expect(logo).toHaveAttribute('src', '/loyality-client-logo.webp')
      await expect.poll(() => logo.evaluate((image) => {
        const element = image as HTMLImageElement
        const bounds = element.getBoundingClientRect()
        return element.complete && element.naturalWidth === 280 && bounds.width / bounds.height === 2
      })).toBe(true)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)
  })
}
