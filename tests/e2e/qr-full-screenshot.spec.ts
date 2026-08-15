import { existsSync } from 'node:fs'

import { expect, test } from '@playwright/test'

import { e2eAccounts } from './helpers/env.js'
import { signInBusinessPortal } from './helpers/auth.js'

const screenshotPath = process.env.E2E_QR_SCREENSHOT_PATH ?? ''

test('business scanner finds a QR inside an uncropped phone screenshot', async ({ page }) => {
  test.skip(!screenshotPath || !existsSync(screenshotPath), 'Set E2E_QR_SCREENSHOT_PATH to a full phone screenshot containing a QR.')

  await page.goto('/')
  if (new URL(page.url()).hostname.endsWith('localhost') || new URL(page.url()).hostname === '127.0.0.1') {
    await page.locator('body').evaluate((body) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.id = 'qr-decoder-test-file'
      body.append(input)
    })
    await page.locator('#qr-decoder-test-file').setInputFiles(screenshotPath)

    const decoded = await page.locator('#qr-decoder-test-file').evaluate(async (input) => {
      const file = (input as HTMLInputElement).files?.[0]
      if (!file) return null
      const bitmap = await createImageBitmap(file)
      try {
        const scannerPath = '/src/lib/qr-image-scanner.ts'
        const scanner = await import(/* @vite-ignore */ scannerPath)
        return await scanner.scanQrImageBitmap(bitmap)
      } finally {
        bitmap.close()
      }
    })

    expect(decoded).toBeTruthy()
    return
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await signInBusinessPortal(page, e2eAccounts.businessOwner)
  await page.goto('/business/redemptions')

  const scanner = page.locator('[data-customer-picker]').locator('..')
  await expect(scanner.getByText(/full phone screenshots work too/i)).toBeVisible()

  const upload = scanner.locator('input[type="file"][accept="image/*"]')
  await upload.setInputFiles(screenshotPath)

  await expect(scanner.getByText(/QR detected/i)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/No QR found/i)).toHaveCount(0)

  const memberValue = await page.locator('#member-qr-token').inputValue()
  const giftCardValue = await page.locator('#gift-card-code').inputValue()
  expect(memberValue || giftCardValue).not.toBe('')

  const layout = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(layout.scrollWidth - layout.viewportWidth).toBeLessThanOrEqual(1)
})
