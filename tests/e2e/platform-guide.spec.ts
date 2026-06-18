import { expect, test } from '@playwright/test'

test.describe('platform guide workflow', () => {
  test('public guide explains the platform with Spanish-first video-ready content', async ({ page }) => {
    await page.goto('/guide')

    await expect(page).toHaveURL(/\/guide$/)
    await expect(page.getByRole('heading', { name: 'Guia de la plataforma' })).toBeVisible()
    await expect(page.getByText('Video aqui proximamente')).toBeVisible()
    await expect(page.getByText('Guion en espanol')).toBeVisible()
    await expect(page.getByText('Script base para grabar')).toBeVisible()
    await expect(page.getByText('Storyboard con pantallas')).toBeVisible()
    await expect(page.getByText('English version')).toBeVisible()

    await expect(page.locator('body')).toContainText('Que es Medellin Rewards')
    await expect(page.locator('body')).toContainText('Experiencia del cliente')
    await expect(page.locator('body')).toContainText('Flujo para negocios')
    await expect(page.locator('body')).toContainText('Flujo para administradores')

    await expect(page.getByRole('link', { name: 'Ver mapa' })).toHaveAttribute('href', '/shop')
    await expect(page.getByRole('link', { name: 'Portal negocio' })).toHaveAttribute('href', '/business/dashboard')
    await expect(page.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin/portal#members')
  })

  test('public navigation exposes the guide link', async ({ page }) => {
    await page.goto('/business')

    await expect(page.getByRole('link', { name: 'Guia' })).toHaveAttribute('href', '/guide')
    await page.getByRole('link', { name: 'Guia' }).click()
    await expect(page).toHaveURL(/\/guide$/)
    await expect(page.getByRole('heading', { name: 'Guia de la plataforma' })).toBeVisible()
  })

})
