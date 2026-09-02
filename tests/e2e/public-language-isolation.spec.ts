import { expect, test, type Page } from '@playwright/test'

type PublicLanguage = 'es' | 'tl'
type PublicTenant = 'rewardme' | 'wondertown'

const storageTenant: Record<PublicTenant, string> = {
  rewardme: 'pinas',
  wondertown: 'wondertown',
}

async function setLanguage(page: Page, tenant: PublicTenant, language: PublicLanguage) {
  await page.addInitScript(({ key, value }) => {
    window.localStorage.setItem(`rewards:${key}:language`, value)
  }, { key: storageTenant[tenant], value: language })
}

async function openTenantPage(page: Page, tenant: PublicTenant, path: string) {
  const separator = path.includes('?') ? '&' : '?'
  await page.goto(`${path}${separator}tenant=${tenant}`)
  await expect(page.locator('body')).toBeVisible()
}

async function userFacingCopy(page: Page) {
  return page.locator('body').evaluate((body) => {
    const attributes = Array.from(
      body.querySelectorAll<HTMLElement>('[aria-label], [placeholder], [title]'),
    ).flatMap((element) => [
      element.getAttribute('aria-label'),
      element.getAttribute('placeholder'),
      element.getAttribute('title'),
    ])

    return [(body as HTMLElement).innerText, ...attributes.filter(Boolean)].join('\n')
  })
}

async function expectNoPhrases(page: Page, phrases: readonly string[]) {
  const copy = await userFacingCopy(page)
  for (const phrase of phrases) expect(copy).not.toContain(phrase)
}

const routes = [
  '/shop',
  '/membership',
  '/join',
  '/signin',
  '/invitation',
  '/promotions',
  '/terms',
  '/privacy',
  '/reward-terms',
  '/verification-policy',
  '/this-page-does-not-exist',
] as const

const englishFixtures = [
  'Explore Businesses',
  'Find partner businesses in',
  'NORTH GARDENS',
  'Choose how you want to earn.',
  'Three-month free access',
  'Manual enrollment:',
  'Reference price · manual activation',
  'Switch to dark mode',
  'Enter your email and password. We will open the workspace assigned to your account.',
  'Sign in',
  'Request Regular or Gold access',
  'We are tired of watching people work hard',
  'Terms of Use',
  'Members are responsible for keeping account details accurate and secure.',
  'Information we collect',
  'No cash payout promise',
  'Why verification is required',
  'Page not found',
] as const

const spanishFixtures = [
  'Explorar negocios',
  'Elige cómo quieres ganar.',
  'Tres meses de acceso gratuito',
  'Inscripción manual:',
  'Cambiar al modo oscuro',
  'Ingresa tu correo y contraseña. Abriremos el espacio de trabajo asignado a tu cuenta.',
  'Términos de uso',
  'Información que recopilamos',
  'Página no encontrada',
] as const

const tagalogFixtures = [
  'Piliin kung paano mo gustong kumita.',
  'Tatlong buwang libreng pagpasok',
  'Manu-manong pagpapatala:',
  'Lumipat sa madilim na anyo',
  'Ilagay ang iyong email at password. Bubuksan namin ang workspace na nakatalaga sa iyong account.',
  'Mga Tuntunin ng Paggamit',
  'Mga kuwenta ng miyembro',
  'Hindi makita ang pahina',
] as const

for (const tenant of ['rewardme', 'wondertown'] as const) {
  test(`${tenant} replaces a legacy Tagalog preference with English on public and account pages`, async ({ page }) => {
    test.setTimeout(90_000)
    await setLanguage(page, tenant, 'tl')

    for (const route of routes) {
      await test.step(route, async () => {
        await openTenantPage(page, tenant, route)
        await expect(page.locator('html')).toHaveAttribute('lang', 'en')
        await expectNoPhrases(page, [...spanishFixtures, ...tagalogFixtures])
        const picker = page.getByRole('combobox', { name: 'Language' }).first()
        if (await picker.count()) {
          await expect(picker).toBeVisible()
          await expect(picker.locator('option')).toHaveCount(2)
        }
      })
    }
  })

  test(`${tenant} keeps Spanish public and account pages free of English and Tagalog fixture copy`, async ({ page }) => {
    test.setTimeout(90_000)
    await setLanguage(page, tenant, 'es')

    for (const route of routes) {
      await test.step(route, async () => {
        await openTenantPage(page, tenant, route)
        await expect(page.locator('html')).toHaveAttribute('lang', 'es')
        await expectNoPhrases(page, [...englishFixtures, ...tagalogFixtures])
      })
    }
  })
}

test('mobile account entry keeps the active language and theme controls visible without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await setLanguage(page, 'rewardme', 'tl')
  await openTenantPage(page, 'rewardme', '/join')

  const languagePicker = page.getByRole('combobox', { name: 'Language' })
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(languagePicker).toBeVisible()
  await expect(languagePicker.locator('option')).toHaveText(['English', 'Spanish'])
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2)

  await languagePicker.selectOption('es')
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect(page.getByRole('combobox', { name: 'Idioma' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cambiar al modo oscuro' })).toBeVisible()
  await expectNoPhrases(page, tagalogFixtures)
})
