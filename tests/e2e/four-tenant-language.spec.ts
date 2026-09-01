import { expect, test, type Page } from '@playwright/test'

type TargetTenant = 'rewardme' | 'wondertown' | 'synergize' | 'loyality'

const tenantCases: Array<{
  tenant: TargetTenant
  storageSlug: string
  spanishHeading: string
  businessSpanish: string
  englishHeading: string
}> = [
  {
    tenant: 'rewardme',
    storageSlug: 'pinas',
    spanishHeading: 'Obtén recompensas increíbles mientras apoyas a los negocios locales.',
    businessSpanish: 'Consigue nuevos clientes mientras recompensas a nuestros miembros.',
    englishHeading: 'Earn amazing rewards while supporting local businesses.',
  },
  {
    tenant: 'wondertown',
    storageSlug: 'wondertown',
    spanishHeading: 'Obtén recompensas increíbles mientras apoyas a los negocios locales.',
    businessSpanish: 'Consigue nuevos clientes mientras recompensas a nuestros miembros.',
    englishHeading: 'Earn amazing rewards while supporting local businesses.',
  },
  {
    tenant: 'synergize',
    storageSlug: 'synergize',
    spanishHeading: 'Gana increíbles recompensas mientras apoyas a los negocios locales',
    businessSpanish: 'Asóciate con nosotros',
    englishHeading: 'Earn Amazing Rewards While Supporting Local Businesses',
  },
  {
    tenant: 'loyality',
    storageSlug: 'loyality',
    spanishHeading: 'Convierte a tus clientes en miembros.',
    businessSpanish: 'Un programa de fidelidad que se siente como tu negocio.',
    englishHeading: 'Turn your customers into members.',
  },
]

function runtimeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

async function selectSpanishFromHome(page: Page, tenant: TargetTenant) {
  if (tenant === 'synergize') {
    const toggle = page.getByRole('button', { name: 'Switch to Spanish' })
    await expect(toggle).toBeVisible()
    await toggle.click()
    expect(new URL(page.url()).pathname).toBe('/')
    await expect(page.getByRole('button', { name: 'Cambiar a Inglés' })).toBeVisible()
    return
  }

  const picker = page.getByRole('combobox', { name: 'Language' })
  await expect(picker).toBeVisible()
  await expect(picker.locator('option')).toHaveCount(tenant === 'loyality' ? 2 : 3)
  await picker.selectOption('es')
  await expect(page.getByRole('combobox', { name: 'Idioma' })).toHaveValue('es')
}

for (const viewport of [
  { name: 'phone', width: 320, height: 780 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const) {
  for (const tenantCase of tenantCases) {
    test(`${tenantCase.tenant} exposes a working Spanish toggle on ${viewport.name}`, async ({ page }) => {
      const errors = runtimeErrors(page)
      await page.setViewportSize(viewport)
      await page.goto(`/?tenant=${tenantCase.tenant}`)
      await expect(page.getByRole('heading', { level: 1, name: tenantCase.englishHeading })).toBeVisible()

      await selectSpanishFromHome(page, tenantCase.tenant)

      await expect(page.locator('html')).toHaveAttribute('lang', 'es')
      await expect(page.getByRole('heading', { level: 1, name: tenantCase.spanishHeading })).toBeVisible()
      await expect(page.getByRole('heading', { level: 1, name: tenantCase.englishHeading })).toHaveCount(0)
      await expect(page.locator('body')).not.toContainText(/Medell[ií]n/i)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2)
      expect(errors).toEqual([])
    })
  }
}

for (const tenantCase of tenantCases) {
  test(`${tenantCase.tenant} keeps Spanish active beyond the homepage`, async ({ page }) => {
    await page.addInitScript(({ slug }) => {
      window.localStorage.setItem(`rewards:${slug}:language`, 'es')
    }, { slug: tenantCase.storageSlug })

    await page.goto(`/business?tenant=${tenantCase.tenant}`)
    await expect(page.getByText(tenantCase.businessSpanish, { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Idioma' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')

    await page.goto(`/signin?tenant=${tenantCase.tenant}`)
    await expect(page.locator('form')).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Idioma' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')

    await page.goto(`/join?tenant=${tenantCase.tenant}`)
    await expect(page.locator('form')).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Idioma' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page.locator('body')).not.toContainText(/Medell[ií]n/i)
  })
}
