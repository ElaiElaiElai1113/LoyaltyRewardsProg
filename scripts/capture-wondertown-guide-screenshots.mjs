import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.WONDERTOWN_SCREENSHOT_BASE_URL ?? 'https://wondertown-rewards.vercel.app'
const outputDirectory = resolve('public/walkthrough-screenshots/wondertown')
const screens = [
  { filename: 'guide.png', route: '/guide' },
  { filename: 'public-map.png', route: '/shop', selector: '[data-testid="partner-map"]' },
  { filename: 'business-page.png', route: '/business' },
  { filename: 'business-login.png', route: '/signin?portal=business' },
  { filename: 'admin-login.png', route: '/signin?portal=admin' },
]

await mkdir(outputDirectory, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  colorScheme: 'light',
  deviceScaleFactor: 1,
  locale: 'en-US',
  viewport: { width: 390, height: 520 },
})

await context.addInitScript(() => {
  window.localStorage.setItem('rewards:wondertown:language', 'en')
  window.localStorage.setItem('rewards:wondertown:install-prompt-dismissed', 'true')
})

try {
  const page = await context.newPage()

  for (const { filename, route, selector } of screens) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' })
    await page.locator('main').waitFor({ state: 'visible' })

    const hasMedellinBranding = await page.evaluate(() => {
      const attributeValues = Array.from(document.querySelectorAll('*')).flatMap((element) =>
        ['aria-label', 'alt', 'title', 'placeholder', 'href'].map((attribute) => element.getAttribute(attribute) ?? ''),
      )
      return /medell[ií]n|medellinrewards/i.test([document.title, document.body.innerText, ...attributeValues].join('\n'))
    })
    if (hasMedellinBranding) {
      throw new Error(`Refusing to capture ${route}: Medellin branding is present.`)
    }

    const captureTarget = selector ? page.locator(selector) : page
    if (selector) {
      await captureTarget.waitFor({ state: 'visible' })
    }
    await captureTarget.screenshot({
      animations: 'disabled',
      caret: 'hide',
      path: resolve(outputDirectory, filename),
      type: 'png',
    })
  }
} finally {
  await browser.close()
}

console.log(`Captured ${screens.length} Wondertown guide screenshots in ${outputDirectory}.`)
