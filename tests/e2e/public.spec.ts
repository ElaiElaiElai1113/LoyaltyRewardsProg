import { expect, test } from '@playwright/test'

test.describe('public acquisition workflow', () => {
  test('Figma homepage is the main public landing page', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: 'Earn Amazing Rewards While Supporting Local Businesses' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Every purchase becomes a Reward' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Choose how you earn' })).toBeVisible()
    await expect(page.getByText('$100,000 COP', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Your dream vacation. Already paid for.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Frequently asked questions' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Businesses' })).toHaveAttribute('href', '/business')
    await expect(page.getByRole('link', { name: 'Join now' }).first()).toHaveAttribute('href', '/join')

    const expandedFaq = page.locator('details').filter({ hasText: 'Can I have more than one Rewards account?' })
    await expect(expandedFaq).toHaveAttribute('open', '')
    await expect(
      page.getByText(
        'No. Each person can have one Rewards account, tied to your full name, email, and phone number.',
      ),
    ).toBeVisible()
  })

  test('legacy landing URL renders the Figma homepage', async ({ page }) => {
    await page.goto('/landing-page')
    await expect(
      page.getByRole('heading', { name: 'Earn Amazing Rewards While Supporting Local Businesses' }),
    ).toBeVisible()
  })

  test('early access invitation page renders', async ({ page }) => {
    await page.goto('/invitation')
    await expect(page.locator('body')).toContainText(/Medell[ií]n Rewards/)
    await expect(page.locator('body')).toContainText(/Suscribirse|Subscribe/i)
    await page.getByRole('button', { name: /Suscribirse|Subscribe/i }).click()
    await page.getByRole('button', { name: /Suscribirse|Subscribe/i }).click()
    await expect(page.getByText(/Enter your WhatsApp number|Ingresa tu n.mero de WhatsApp/i)).toBeVisible()
    await expect(page.getByText(/Enter your email|Ingresa tu correo/i)).toBeVisible()
  })
})
