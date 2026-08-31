import { expect, test, type Page } from '@playwright/test'

type TenantCase = {
  name: string
  query: string
  storageSlug: string
  programName: string
  wondertown: boolean
}

const tenants: TenantCase[] = [
  {
    name: 'RewardMe',
    query: 'rewardme',
    storageSlug: 'pinas',
    programName: 'RewardMe',
    wondertown: false,
  },
  {
    name: 'Wondertown',
    query: 'wondertown',
    storageSlug: 'wondertown',
    programName: 'Wondertown Rewards',
    wondertown: true,
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

const sharedRewardMeEnglishLabels = [
  'FOR BUSINESSES',
  'Get new customers while rewarding our members.',
  'Apply: Commission model',
  'Apply: Credit model',
  'PARTICIPATION MODELS',
  'Choose the model that fits your business.',
  'Commission model',
  'Business-credit model',
  'HOW IT WORKS',
  'Three steps. You pay for results, not access.',
  'IF YOU ALREADY USE SYNERGIZE',
  'Connected economics. Separate products.',
  'Choose the application that matches your proposed model.',
]

const legacyWondertownEnglishLabels = [
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

const wondertownTestEnglishLabels = [
  'For businesses · fictional test environment',
  'Test the same offer, purchase-verification, and business-account workflows used by RewardMe with fictional businesses and sandbox data.',
  'Open the test guide',
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
    ...sharedRewardMeEnglishLabels,
    ...legacyWondertownEnglishLabels,
    ...(tenant.wondertown ? wondertownTestEnglishLabels : []),
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

      const experience = page.locator('[data-rewardme-editorial-business]')
      const header = page.locator('header')
      const footer = page.locator('footer')
      await expect(experience).toBeVisible()
      if (tenant.wondertown) {
        await expect(experience).toHaveAttribute('data-wondertown-rewardme-mirror', 'true')
      } else {
        await expect(experience).not.toHaveAttribute('data-wondertown-rewardme-mirror')
      }
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

      await expect(experience.getByRole('heading', { name: 'Consigue nuevos clientes mientras recompensas a nuestros miembros.' })).toBeVisible()
      await expect(experience.getByRole('link', { name: 'Solicitar: modelo de comisión' })).toBeVisible()
      await expect(experience.getByRole('heading', { name: 'Tres pasos. Pagas por resultados, no por acceso.' })).toBeVisible()
      await expect(experience.locator('img[alt="Propietario de un negocio local recibiendo a miembros de recompensas"]')).toBeVisible()

      if (tenant.wondertown) {
        await expect(experience.locator('.rewardme-ledger-business__highlight')).toContainText('Wondertown Rewards')
        await expect(experience.locator('a[href="/signin?portal=business"]')).toBeVisible()
        await expect(experience.locator('a[href="/guide"]')).toBeVisible()
        await expect(footer).toContainText(
          'Un espacio de trabajo empresarial ficticio para probar flujos completos de recompensas.',
        )
        await expect(page.getByText('Dirige el mostrador de Wondertown.', { exact: true })).toHaveCount(0)
        await expect(page.locator('img[alt="Una vista ilustrada y colorida del distrito comercial ficticio de Wondertown"]')).toHaveCount(0)
      }

      await expectNoEnglishBusinessLabels(page, tenant)
    })

    test(`${tenant.name} business page is fully Tagalog`, async ({ page }) => {
      await openBusinessPage(page, tenant, 'tl')

      const experience = page.locator('[data-rewardme-editorial-business]')
      const header = page.locator('header')
      const footer = page.locator('footer')
      await expect(experience).toBeVisible()
      if (tenant.wondertown) {
        await expect(experience).toHaveAttribute('data-wondertown-rewardme-mirror', 'true')
      } else {
        await expect(experience).not.toHaveAttribute('data-wondertown-rewardme-mirror')
      }
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

      await expect(experience.getByRole('heading', { name: 'Makakuha ng bagong customer habang ginagantimpalaan ang aming mga miyembro.' })).toBeVisible()
      await expect(experience.getByRole('link', { name: 'Mag-apply: modelong komisyon' })).toBeVisible()
      await expect(experience.getByRole('heading', { name: 'Tatlong hakbang. Resulta ang binabayaran mo, hindi access.' })).toBeVisible()
      await expect(experience.locator('img[alt="May-ari ng lokal na negosyo na tumatanggap sa mga rewards member"]')).toBeVisible()

      if (tenant.wondertown) {
        await expect(experience.locator('.rewardme-ledger-business__highlight')).toContainText('Wondertown Rewards')
        await expect(experience.locator('a[href="/signin?portal=business"]')).toBeVisible()
        await expect(experience.locator('a[href="/guide"]')).toBeVisible()
        await expect(footer).toContainText(
          'Isang kathang-isip na workspace ng negosyo para subukan ang kumpletong rewards workflow.',
        )
        await expect(page.getByText('Patakbuhin ang tindahan sa Wondertown.', { exact: true })).toHaveCount(0)
        await expect(page.locator('img[alt="Makulay na guhit ng kathang-isip na distrito ng negosyo sa Wondertown"]')).toHaveCount(0)
      }

      await expectNoEnglishBusinessLabels(page, tenant)
    })
  }

  for (const tenant of tenants) {
    test(`${tenant.name} shared business header keeps all three languages usable at 320px`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 700 })
      await openBusinessPage(page, tenant, 'tl')

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
  }
})
