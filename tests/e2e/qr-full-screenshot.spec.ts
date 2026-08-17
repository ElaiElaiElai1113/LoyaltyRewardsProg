import { existsSync } from 'node:fs'

import { expect, test } from '@playwright/test'

import { e2eAccounts } from './helpers/env.js'
import { signInBusinessPortal } from './helpers/auth.js'

const screenshotPath = process.env.E2E_QR_SCREENSHOT_PATH ?? ''

test('shared decoder finds an off-center QR in a phone-screen image when the native detector fails', async ({ page }) => {
  await page.goto('/')

  const decoded = await page.evaluate(async () => {
    Object.defineProperty(window, 'BarcodeDetector', {
      configurable: true,
      value: class {
        async detect() {
          throw new Error('Embedded browser detector is unavailable')
        }
      },
    })

    const qrResponse = await fetch('/rewardme-qr.svg')
    const qrSvg = (await qrResponse.text()).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
    const qrObjectUrl = URL.createObjectURL(new Blob([qrSvg], { type: 'image/svg+xml' }))
    const qrImage = new Image()
    await new Promise<void>((resolve, reject) => {
      qrImage.onload = () => resolve()
      qrImage.onerror = () => reject(new Error('QR fixture could not be loaded'))
      qrImage.src = qrObjectUrl
    })
    const phoneCanvas = document.createElement('canvas')
    phoneCanvas.width = 390
    phoneCanvas.height = 844
    const context = phoneCanvas.getContext('2d')
    if (!context) throw new Error('Canvas is unavailable')

    context.fillStyle = '#17120f'
    context.fillRect(0, 0, phoneCanvas.width, phoneCanvas.height)
    context.fillStyle = '#ead7b8'
    context.fillRect(20, 34, 350, 62)
    context.fillRect(28, 610, 334, 154)
    context.fillStyle = '#fff'
    context.fillRect(82, 232, 226, 226)
    context.drawImage(qrImage, 97, 247, 196, 196)
    URL.revokeObjectURL(qrObjectUrl)

    const phoneBlob = await new Promise<Blob>((resolve, reject) => {
      phoneCanvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Phone image could not be created')), 'image/png')
    })
    const phoneBitmap = await createImageBitmap(phoneBlob)
    try {
      const scannerPath = '/src/lib/qr-image-scanner.ts'
      const scanner = await import(/* @vite-ignore */ scannerPath)
      return await scanner.scanQrImageBitmap(phoneBitmap)
    } finally {
      phoneBitmap.close()
    }
  })

  expect(decoded).toBeTruthy()
})

test('shared decoder safely rejects a screenshot that contains no QR', async ({ page }) => {
  await page.goto('/')

  const decoded = await page.evaluate(async () => {
    Object.defineProperty(window, 'BarcodeDetector', {
      configurable: true,
      value: class {
        async detect() {
          throw new Error('Embedded browser detector is unavailable')
        }
      },
    })

    const canvas = document.createElement('canvas')
    canvas.width = 390
    canvas.height = 844
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is unavailable')
    context.fillStyle = '#17120f'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#ead7b8'
    context.fillRect(20, 34, 350, 62)
    context.fillRect(28, 610, 334, 154)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Image could not be created')), 'image/png')
    })
    const bitmap = await createImageBitmap(blob)
    try {
      const scannerPath = '/src/lib/qr-image-scanner.ts'
      const scanner = await import(/* @vite-ignore */ scannerPath)
      return await scanner.scanQrImageBitmap(bitmap)
    } finally {
      bitmap.close()
    }
  })

  expect(decoded).toBeNull()
})

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

      Object.defineProperty(window, 'BarcodeDetector', {
        configurable: true,
        value: class {
          async detect() {
            throw new Error('Embedded browser detector is unavailable')
          }
        },
      })

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

  const savedCustomer = page.locator('[data-customer-picker] button:not([disabled])').first()
  await expect(savedCustomer).toBeVisible()
  await savedCustomer.click()
  await expect(page.getByText(/Customer selected:/i)).toBeVisible()

  const upload = scanner.locator('input[type="file"][accept="image/*"]')
  await upload.setInputFiles(screenshotPath)

  await expect(scanner.getByText(/QR detected/i)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/No QR found/i)).toHaveCount(0)

  const memberValue = await page.locator('#member-qr-token').inputValue()
  const giftCardValue = await page.locator('#gift-card-code').inputValue()
  expect(memberValue || giftCardValue).not.toBe('')

  for (const viewport of [
    { width: 320, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport)
    const layout = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(layout.scrollWidth - layout.viewportWidth).toBeLessThanOrEqual(1)
  }
})
