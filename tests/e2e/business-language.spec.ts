import { expect, test, type Page } from '@playwright/test'

type TenantCase = {
  name: string
  query: string
  storageSlug: string
  programName: string
  rewardMe: boolean
}

const tenants: TenantCase[] = [
  {
    name: 'RewardMe',
    query: 'rewardme',
    storageSlug: 'pinas',
    programName: 'RewardMe',
    rewardMe: true,
  },
  {
    name: 'Wondertown',
    query: 'wondertown',
    storageSlug: 'wondertown',
    programName: 'Wondertown Rewards',
    rewardMe: false,
  },
]

const commonEnglishLabels = [
  'FOR BUSINESSES',
  'Benefits',
  'How It Works',
  'Cost Calculator',
  'Get Started',
  'Business Login',
  'Privacy policy',
  'Demo guide',
  'Member site',
  'All rights reserved.',
]

const rewardMeEnglishLabels = [
  'REWARDME FOR BUSINESSES',
  'Turn unused capacity into loyal, paying customers.',
  'Apply to partner',
  'Business sign in',
  'TWO PARTICIPATION MODELS',
  'Choose the model that matches your business.',
  'Commission model',
  'Business-credit model',
  'HOW IT WORKS',
  'A clear path from offer to repeat visit.',
  'SYNERGIZE BRIDGE',
  'Connected economics. Separate products.',
  'Ready to discuss a RewardMe offer?',
  'Talk to the team',
]

const wondertownEnglishLabels = [
  'FOR LOCAL BUSINESSES',
  'Partner With Us',
  'See how it works',
  'No upfront cost',
  'Setup in days, not weeks',
  'WHY PARTNER WITH US',
  'Limited space',
  'Three steps. That’s it.',
  'GET STARTED TODAY',
  'Open Business Demo',
  'Have questions before you sign?',
  'View Demo Guide',
]

async function openBusinessPage(page: Page, tenant: TenantCase, language: 'es' | 'tl') {
  await page.addInitScript(
    ({ storageSlug, language }) => {
      window.localStorage.setItem(`rewards:${storageSlug}:language`, language)
    },
    { storageSlug: tenant.storageSlug, language },
  )
  await page.goto(`/business?tenant=${tenant.query}`)
}

async function expectNoEnglishBusinessLabels(page: Page, tenant: TenantCase) {
  for (const label of [
    ...commonEnglishLabels,
    ...(tenant.rewardMe ? rewardMeEnglishLabels : wondertownEnglishLabels),
  ]) {
    await expect(page.getByText(label, { exact: true })).toHaveCount(0)
  }

  await expect(page.locator('[aria-label="Business page navigation"]')).toHaveCount(0)
  await expect(page.locator('[aria-label="Business footer navigation"]')).toHaveCount(0)
  await expect(page.locator('[aria-label="Partner benefits"]')).toHaveCount(0)
  await expect(page.locator('[aria-label="Zero percent upfront cost"]')).toHaveCount(0)
  await expect(page.locator('[aria-label="Limited partner space"]')).toHaveCount(0)
  await expect(page.locator('img[alt^="Local business owner"]')).toHaveCount(0)
  await expect(page.locator('img[alt^="Staff member scanning"]')).toHaveCount(0)
  await expect(page.locator('img[alt="Hotel partner welcoming a rewards member"]')).toHaveCount(0)
  await expect(page.locator('img[alt="Restaurant partner serving rewards members"]')).toHaveCount(0)
  await expect(page.locator('img[alt="Salon partner serving rewards members"]')).toHaveCount(0)
}

test.describe('business onboarding language isolation', () => {
  for (const tenant of tenants) {
    test(`${tenant.name} business page is fully Spanish`, async ({ page }) => {
      await openBusinessPage(page, tenant, 'es')

      const header = page.locator('header')
      const footer = page.locator('footer')
      await expect(page.getByRole('combobox', { name: 'Idioma' })).toBeVisible()
      await expect(header.getByRole('link', { name: 'Beneficios', exact: true })).toBeVisible()
      await expect(header.getByRole('link', { name: 'Cómo funciona', exact: true })).toBeVisible()
      await expect(header.getByRole('link', { name: 'Comenzar', exact: true })).toBeVisible()
      await expect(header.getByRole('link', { name: 'Acceso para negocios', exact: true })).toBeVisible()
      await expect(header.getByRole('link', {
        name: `Página principal para miembros de ${tenant.programName}`,
      })).toBeVisible()
      await expect(footer).toContainText('Todos los derechos reservados.')
      await expect(footer.getByRole('link', { name: 'Política de privacidad' })).toBeVisible()

      if (tenant.rewardMe) {
        await expect(page.getByRole('heading', {
          name: 'Convierte la capacidad disponible en clientes fieles que pagan.',
        })).toBeVisible()
        await expect(page.getByRole('link', { name: 'Solicitar ser socio' })).toBeVisible()
        await expect(page.locator('img[alt="Propietario de un negocio local dando la bienvenida a miembros de RewardMe"]')).toBeVisible()
      } else {
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Ayudamos a los')
        await expect(page.getByRole('link', { name: 'Asóciate con nosotros' })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Tres pasos. Eso es todo.' })).toBeVisible()
        await expect(page.locator(`img[alt="Propietario de un negocio local listo para recibir a miembros de ${tenant.programName}"]`)).toBeVisible()
      }

      await expectNoEnglishBusinessLabels(page, tenant)
    })

    test(`${tenant.name} business page is fully Tagalog`, async ({ page }) => {
      await openBusinessPage(page, tenant, 'tl')

      const header = page.locator('header')
      const footer = page.locator('footer')
      await expect(page.getByRole('combobox', { name: 'Wika' })).toBeVisible()
      await expect(header.getByRole('link', { name: 'Mga Benepisyo', exact: true })).toBeVisible()
      await expect(header.getByRole('link', { name: 'Paano Ito Gumagana', exact: true })).toBeVisible()
      await expect(header.getByRole('link', { name: 'Magsimula', exact: true })).toBeVisible()
      await expect(header.getByRole('link', { name: 'Pagpasok ng Negosyo', exact: true })).toBeVisible()
      await expect(header.getByRole('link', {
        name: `Pangunahing pahina ng kasapi sa ${tenant.programName}`,
      })).toBeVisible()
      await expect(footer).toContainText('Nakalaan ang lahat ng karapatan.')
      await expect(footer.getByRole('link', { name: 'Patakaran sa Pagkapribado' })).toBeVisible()

      if (tenant.rewardMe) {
        await expect(page.getByRole('heading', {
          name: 'Gawing tapat at nagbabayad na mga kostumer ang hindi nagagamit na kapasidad.',
        })).toBeVisible()
        await expect(page.getByRole('link', { name: 'Maghain upang maging katuwang' })).toBeVisible()
        await expect(page.locator('img[alt="May-ari ng lokal na negosyong tumatanggap sa mga kasapi ng RewardMe"]')).toBeVisible()
      } else {
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Tumutulong sa mga')
        await expect(page.getByRole('link', { name: 'Maging Katuwang Namin' })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Tatlong hakbang. Iyon lang.' })).toBeVisible()
        await expect(page.locator(`img[alt="May-ari ng lokal na negosyong handang tumanggap sa mga kasapi ng ${tenant.programName}"]`)).toBeVisible()
      }

      await expectNoEnglishBusinessLabels(page, tenant)
    })
  }

  test('RewardMe business header keeps all three languages usable at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await openBusinessPage(page, tenants[0], 'tl')

    const languagePicker = page.getByRole('combobox', { name: 'Wika' })
    await expect(languagePicker).toBeVisible()
    await expect(languagePicker.locator('option')).toHaveCount(3)
    await expect(page.getByRole('link', { name: 'Pagpasok ng Negosyo', exact: true })).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(2)

    await languagePicker.selectOption('es')
    await expect(page.getByRole('combobox', { name: 'Idioma' })).toHaveValue('es')
    await expect(page.getByRole('link', { name: 'Acceso para negocios', exact: true })).toBeVisible()
  })
})
