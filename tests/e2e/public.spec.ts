import { expect, test } from '@playwright/test'

test.describe('public acquisition workflow', () => {
  test('Figma homepage is the Spanish-first main public landing page', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: 'Gana increíbles recompensas mientras apoyas a los negocios locales' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Cada compra se convierte en una recompensa' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Elige cómo quieres ganar' })).toBeVisible()
    await expect(page.getByText('$100,000 COP', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Cómo funciona' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tus vacaciones soñadas. Ya están pagadas.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Preguntas frecuentes' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Negocios' })).toHaveAttribute('href', '/business')
    await expect(page.getByRole('link', { name: 'Únete ahora' }).first()).toHaveAttribute('href', '/join')
    await expect(page.getByRole('button', { name: 'Switch to English' })).toHaveText('English')

    const expandedFaq = page.locator('details').filter({ hasText: '¿Puedo tener más de una cuenta de recompensas?' })
    await expect(expandedFaq).toHaveAttribute('open', '')
    await expect(
      page.getByText(
        'No. Cada persona puede tener una sola cuenta asociada con su nombre completo, correo y teléfono.',
      ),
    ).toBeVisible()
  })

  test('legacy landing URL renders the Figma homepage', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('rewards:medellin:language', 'en'))
    await page.goto('/landing-page')
    await expect(
      page.getByRole('heading', { name: 'Earn Amazing Rewards While Supporting Local Businesses' }),
    ).toBeVisible()
  })

  test('homepage uses approved landing typography and clean media assets', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('rewards:medellin:language', 'en'))
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Earn Amazing Rewards While Supporting Local Businesses' }))
      .toHaveCSS('font-family', /Fraunces/)
    await expect(page.getByText("Every time you shop, dine, or spend at a business in our network", { exact: false }))
      .toHaveCSS('font-family', /Inter/)

    await expect(page.getByRole('img', { name: 'Family celebrating a car purchase' }))
      .toHaveAttribute('src', /car-rewards-clean\.png/)
    await expect(page.locator('.figma-home__category-card figcaption')).toHaveCount(0)

    const vacationBanner = page.locator('#vacation')
    await expect(vacationBanner).toHaveCSS('background-image', /vacation-beach-clean\.webp/)
    await expect(vacationBanner).toHaveCSS('background-position', '50% 0%')
  })

  test('mobile homepage separates the hero actions from the benefit pills', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript(() => window.localStorage.setItem('rewards:medellin:language', 'en'))
    await page.goto('/')

    const secondaryAction = page.getByRole('link', { name: 'See how it works' })
    const benefitPills = page.getByRole('list', { name: 'Membership benefits' })
    const secondaryBox = await secondaryAction.boundingBox()
    const pillsBox = await benefitPills.boundingBox()

    expect(secondaryBox).not.toBeNull()
    expect(pillsBox).not.toBeNull()
    expect(pillsBox!.y - (secondaryBox!.y + secondaryBox!.height)).toBeGreaterThanOrEqual(28)
  })

  test('all homepage FAQs expand and show approved answers', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('rewards:medellin:language', 'en'))
    await page.goto('/')

    const faqItems = [
      {
        question: 'Where can I use my Rewards?',
        answer: 'You can use your Rewards with many partnered businesses, either by going to the Rewards Store or by messaging us for more options.',
      },
      {
        question: 'Can I have more than one Rewards account?',
        answer: 'No. Each person can have one Rewards account, tied to your full name, email, and phone number.',
      },
      {
        question: 'Can I transfer Rewards to another account?',
        answer: 'Rewards are tied to your member account and must be used and cannot be transferred.',
      },
      {
        question: 'Can Rewards be exchanged for money?',
        answer: 'No, Rewards are designed for member benefits, purchases, travel, experiences, and partner offers within the Medellin Rewards Program - not cash exchange.',
      },
    ] as const

    await expect(page.locator('#faq details')).toHaveCount(faqItems.length)

    for (const faq of faqItems) {
      const item = page.locator('#faq details').filter({ hasText: faq.question })
      if ((await item.getAttribute('open')) === null) {
        await item.locator('summary').click()
      }

      await expect(item).toHaveAttribute('open', '')
      await expect(item.locator('p')).toHaveText(faq.answer)
      await expect(item.locator('p')).toBeVisible()
    }
  })

  test('business page follows the supplied local partner reference', async ({ page }) => {
    await page.goto('/business')

    await expect(
      page.getByRole('heading', { name: 'Helping local businesses grow, while giving amazing Rewards to our members.' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'A steady stream of loyal, spending customers' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Three steps. That’s it.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sign the agreement. We’ll take it from there.' })).toBeVisible()

    await expect(page.getByRole('link', { name: 'Business Login' })).toHaveAttribute('href', '/business/login')
    await expect(page.getByRole('link', { name: 'Cost Calculator' })).toHaveAttribute('href', '/cost-calculator')
    await expect(page.getByRole('link', { name: 'Calculate Your Costs' })).toHaveAttribute('href', '/cost-calculator')
    await expect(page.getByRole('link', { name: 'See how it works' })).toHaveAttribute('href', '#how-it-works')
    await expect(page.getByRole('link', { name: 'Partner With Us' })).toHaveAttribute('href', '#get-started')

    await expect(page.getByRole('img', { name: 'Local business owner ready to welcome Medellín Rewards members' }))
      .toHaveAttribute('src', /local-business-owner\.png/)
    await expect(page.getByRole('img', { name: 'Hotel partner welcoming a Medellín Rewards member' }))
      .toHaveAttribute('src', /hotel-partner\.png/)
    await expect(page.getByRole('img', { name: 'Salon partner serving Medellín Rewards members' }))
      .toHaveAttribute('src', /salon-partner\.png/)
    await expect(page.getByRole('img', { name: 'Staff member scanning a customer QR code at checkout' }))
      .toHaveAttribute('src', /staff-qr-checkout\.png/)
  })

  test('business page stays readable without horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/business')

    await expect(
      page.getByRole('heading', { name: 'Helping local businesses grow, while giving amazing Rewards to our members.' }),
    ).toBeVisible()
    await expect(page.getByRole('img', { name: 'Local business owner ready to welcome Medellín Rewards members' }))
      .toBeVisible()

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
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
