import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const tenantSlug = process.argv[2] ?? 'wondertown'
const tenantConfig = {
  rewardme: {
    baseUrl: process.env.REWARDME_SCREENSHOT_BASE_URL ?? 'https://rewardme-prod.vercel.app',
    name: 'RewardMe',
    storageSlug: 'pinas',
  },
  wondertown: {
    baseUrl: process.env.WONDERTOWN_SCREENSHOT_BASE_URL ?? 'https://wondertown-rewards.vercel.app',
    name: 'Wondertown Rewards',
    storageSlug: 'wondertown',
  },
}[tenantSlug]

if (!tenantConfig) {
  throw new Error(`Unsupported guide screenshot tenant: ${tenantSlug}`)
}

const outputDirectory = resolve(`public/walkthrough-screenshots/${tenantSlug}`)
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

await context.addInitScript((slug) => {
  window.localStorage.setItem(`rewards:${slug}:language`, 'en')
  window.localStorage.setItem(`rewards:${slug}:install-prompt-dismissed`, 'true')
}, tenantConfig.storageSlug)

try {
  const page = await context.newPage()

  for (const { filename, route, selector } of screens) {
    await page.goto(`${tenantConfig.baseUrl}${route}`, { waitUntil: 'networkidle' })
    await page.locator('main').waitFor({ state: 'visible' })

    const branding = await page.evaluate(({ expectedName }) => {
      const attributeValues = Array.from(document.querySelectorAll('*')).flatMap((element) =>
        ['aria-label', 'alt', 'title', 'placeholder', 'href'].map((attribute) => element.getAttribute(attribute) ?? ''),
      )
      const searchableText = [document.title, document.body.innerText, ...attributeValues].join('\n')
      return {
        hasExpectedBrand: searchableText.toLowerCase().includes(expectedName.toLowerCase()),
        hasMedellinBrand: /medell[ií]n|medellinrewards/i.test(searchableText),
      }
    }, { expectedName: tenantConfig.name })
    if (branding.hasMedellinBrand) {
      throw new Error(`Refusing to capture ${route}: Medellin branding is present.`)
    }
    if (route !== '/signin?portal=admin' && !branding.hasExpectedBrand) {
      throw new Error(`Refusing to capture ${route}: ${tenantConfig.name} branding is missing.`)
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

console.log(`Captured ${screens.length} ${tenantConfig.name} guide screenshots in ${outputDirectory}.`)
