import { expect, test, type Page } from '@playwright/test'

async function chooseSpanish(page: Page, path: string) {
  await page.goto(`${path}?tenant=rewardme`)
  await page.getByRole('combobox', { name: 'Language' }).first().selectOption('es')
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
}

for (const model of ['commission', 'credit'] as const) {
  test(`Spanish ${model} application translates terms, options, errors and confirmation`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 780 })
    await chooseSpanish(page, `/business/apply/${model}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Únete a RewardMe — ${model === 'commission' ? 'Modelo de Comisión' : 'Modelo de Crédito'}.`)
    await expect(page.getByRole('heading', { name: '11. Acuerdo electrónico', exact: true })).toBeAttached()
    await expect(page.locator('.rewardme-application__disclosure')).not.toContainText('RewardMe is a subscription-based')
    await expect(page.getByPlaceholder('p. ej., restaurante, hotel, salón')).toBeVisible()
    await expect(page.locator('select[name="rewardRate"] option')).toHaveText([
      'Selecciona una opción', '20 % de vuelta (mínimo)', '30 % de vuelta', '50 % de vuelta', '100 % de vuelta', 'Menos del 20 % (categoría de alto valor)',
    ])
    await page.reload()
    await expect(page.getByRole('combobox', { name: 'Idioma' }).first()).toHaveValue('es')
    await page.getByRole('button', { name: 'Enviar solicitud', exact: true }).click()
    await expect(page.locator('input[name="legalName"]')).toHaveJSProperty('validationMessage', 'Completa este campo.')
    await page.getByRole('combobox', { name: 'Idioma' }).first().selectOption('en')
    await page.getByRole('button', { name: 'Submit Application', exact: true }).click()
    await expect(page.locator('input[name="legalName"]')).toHaveJSProperty('validationMessage', 'Please fill out this field.')
    await page.getByRole('combobox', { name: 'Language' }).first().selectOption('es')
    for (const [name, value] of Object.entries({
      legalName: 'Café Prueba', industry: 'Restaurante', street: '123 Calle Prueba', city: 'Manila', region: 'Metro Manila', postal: '1000', country: 'Filipinas', representativeName: 'Ana Prueba', representativeTitle: 'Propietaria', representativeEmail: 'ana@example.test', representativePhone: '+639171234567',
    })) await page.locator(`input[name="${name}"]`).fill(value)
    await page.locator('select[name="rewardRate"]').selectOption({ label: model === 'commission' ? '20 % de vuelta (mínimo)' : 'Menos del 20 % (categoría de alto valor)' })
    await page.getByRole('checkbox').check()

    // Intercept every submission: this test must never create a real application.
    let attempt = 0
    await page.route('**/api/business-applications', async (route) => {
      expect(route.request().postDataJSON()).toMatchObject({ model, legalName: 'Café Prueba', rewardRate: model === 'commission' ? '20% back' : 'Other — discuss with the team', redemptionAccess: 'earn-and-redeem' })
      attempt += 1
      await route.fulfill({ status: attempt === 1 ? 400 : 201, json: attempt === 1 ? { error: 'The application could not be submitted.' } : { reference: 'QA-ES-123' } })
    })
    await page.getByRole('button', { name: 'Enviar solicitud', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveText('No se pudo enviar la solicitud.')
    await page.getByRole('button', { name: 'Enviar solicitud', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Solicitud recibida.' })).toBeVisible()
    await expect(page.locator('.rewardme-application__confirmation')).toContainText('Gracias, Ana Prueba.')
    await expect(page.locator('.rewardme-application__confirmation')).toContainText('Número de referencia: QA-ES-123')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2)
    await page.getByRole('link', { name: 'Volver a la página para negocios', exact: true }).click()
    await expect(page.getByRole('combobox', { name: 'Idioma' }).first()).toHaveValue('es')
    await page.getByRole('combobox', { name: 'Idioma' }).first().selectOption('en')
    await page.reload()
    await expect(page.getByRole('combobox', { name: 'Language' }).first()).toHaveValue('en')
  })
}

test('Spanish calculator translates changing amounts without losing the currency or calculations', async ({ page }) => {
  await chooseSpanish(page, '/cost-calculator')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Muestra el costo real de los alimentos detrás del crecimiento financiado con recompensas.')
  await page.getByLabel('Gasto deseado de los clientes', { exact: true }).fill('2000')
  await expect(page.getByText(/Costo real para el negocio:.*125/)).toBeVisible()
  await expect(page.getByText(/El cliente gasta.*2[,.]000/)).toBeVisible()
  await expect(page.getByText('Comparación lado a lado', { exact: true })).toBeVisible()
  await expect(page.locator('body')).not.toContainText('Food Cost Calculator')
  await page.setViewportSize({ width: 320, height: 780 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2)
  const clippedText = await page.locator('h1, h3, p').evaluateAll((elements) => elements
    .filter((element) => element.scrollWidth > element.clientWidth + 2)
    .map((element) => element.textContent))
  expect(clippedText).toEqual([])
})
