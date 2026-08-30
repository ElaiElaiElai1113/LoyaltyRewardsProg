import { existsSync, rmSync } from 'node:fs'

import { expect, test, type Page } from '@playwright/test'

import { e2eAccounts } from './helpers/env.js'
import { signInBusinessPortal, signInCustomer } from './helpers/auth.js'

const screenshotPath = process.env.E2E_QR_SCREENSHOT_PATH ?? ''
const liveUploadCheckEnabled = process.env.E2E_QR_LIVE_UPLOAD_CHECK === 'true'

async function clearBrowserSession(page: Page) {
  await page.context().clearCookies()
  await page.evaluate(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
}

async function forceSharedQrFallback(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'BarcodeDetector', {
      configurable: true,
      value: class {
        async detect() {
          throw new Error('Use the shared full-image QR fallback in this deterministic check')
        }
      },
    })
  })
}

async function uploadPhoneScreenshotAndExpectMember(page: Page, phoneScreenshot: string) {
  await clearBrowserSession(page)
  await forceSharedQrFallback(page)
  await signInBusinessPortal(page, e2eAccounts.businessOwner)
  await page.goto('/business/redemptions', { waitUntil: 'domcontentloaded' })

  const transactionPanel = page.locator('[data-customer-picker]').locator('..')
  await expect(transactionPanel.getByText(/full phone screenshots work too/i)).toBeVisible()
  await transactionPanel.locator('input[type="file"][accept="image/*"]').setInputFiles(phoneScreenshot)

  await expect(transactionPanel.getByText(/QR detected/i)).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('#member-qr-token')).not.toHaveValue('')
  await expect(page.getByText(/Customer selected:/i)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/No QR found/i)).toHaveCount(0)
}

test('critical public and sign-in shell works without visual dead ends', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBeLessThan(400)
  await expect(page.locator('main')).toBeVisible()

  await page.goto('/signin', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('[data-app-install-prompt]')).toHaveCount(0)
  await page.locator('form').filter({ has: page.locator('#signin-email') }).locator('button[type="submit"]').click({ trial: true })
  for (const role of ['Admin', 'Business', 'Customer']) {
    await expect(page.getByRole('button', { name: `Sign in as ${role}`, exact: true })).toBeVisible()
  }

  const integrity = await page.evaluate(() => ({
    emptyLinks: Array.from(document.querySelectorAll<HTMLAnchorElement>('a'))
      .filter((link) => !link.getAttribute('href')?.trim() || link.getAttribute('href') === '#')
      .length,
    overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    visibleFatalError: /application error|page crashed|something went wrong/i.test(document.body.innerText),
  }))

  expect(integrity).toEqual({ emptyLinks: 0, overflow: 0, visibleFatalError: false })
})

test('shared decoder finds an off-center QR in a phone-screen image when the native detector fails', async ({ page }, testInfo) => {
  if (liveUploadCheckEnabled) {
    await page.setViewportSize({ width: 390, height: 844 })
    await signInCustomer(page, e2eAccounts.customer)
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })

    const memberQr = page.getByTestId('member-qr-code')
    await expect(memberQr).toBeVisible()
    await memberQr.evaluate(async (element) => {
      const serializedQr = new XMLSerializer().serializeToString(element)
      const objectUrl = URL.createObjectURL(new Blob([serializedQr], { type: 'image/svg+xml' }))
      const qrImage = new Image()
      await new Promise<void>((resolve, reject) => {
        qrImage.onload = () => resolve()
        qrImage.onerror = () => reject(new Error('Member QR could not be rendered'))
        qrImage.src = objectUrl
      })

      const canvas = document.createElement('canvas')
      canvas.id = 'deterministic-off-center-phone-screen'
      canvas.width = 390
      canvas.height = 844
      canvas.style.position = 'fixed'
      canvas.style.inset = '0'
      canvas.style.zIndex = '2147483647'
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas is unavailable')

      context.fillStyle = '#17120f'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = '#ead7b8'
      context.fillRect(16, 28, 358, 68)
      context.fillRect(22, 650, 346, 152)
      context.fillStyle = '#fff'
      context.fillRect(150, 238, 218, 218)
      context.drawImage(qrImage, 161, 249, 196, 196)
      URL.revokeObjectURL(objectUrl)
      document.body.append(canvas)
    })

    const syntheticPhoneScreenshot = testInfo.outputPath('off-center-member-phone-screen.png')
    await page.locator('#deterministic-off-center-phone-screen').screenshot({ path: syntheticPhoneScreenshot })
    try {
      await uploadPhoneScreenshotAndExpectMember(page, syntheticPhoneScreenshot)
    } finally {
      rmSync(syntheticPhoneScreenshot, { force: true })
    }
    return
  }

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

test('authenticated business upload decodes a full member phone screenshot', async ({ page }, testInfo) => {
  test.skip(!liveUploadCheckEnabled, 'Set E2E_QR_LIVE_UPLOAD_CHECK=true with private QA credentials.')

  await page.setViewportSize({ width: 390, height: 844 })
  await signInCustomer(page, e2eAccounts.customer)

  await page.goto('/profile', { waitUntil: 'domcontentloaded' })
  const memberQr = page.getByTestId('member-qr-code')
  await expect(memberQr).toBeVisible()
  await memberQr.evaluate((element) => {
    element.scrollIntoView({ block: 'center', inline: 'center' })
  })
  await expect.poll(async () => {
    const box = await memberQr.boundingBox()
    return box ? box.y >= 80 && box.y + box.height <= 680 : false
  }).toBe(true)

  const phoneScreenshot = testInfo.outputPath('member-phone-screen.png')
  await page.screenshot({ path: phoneScreenshot })
  try {
    await uploadPhoneScreenshotAndExpectMember(page, phoneScreenshot)

    const overflow = await page.evaluate(() => (
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    ))
    expect(overflow).toBeLessThanOrEqual(2)
  } finally {
    rmSync(phoneScreenshot, { force: true })
  }
})
