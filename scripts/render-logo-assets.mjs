import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const svg = readFileSync('public/medellin-rewards-logo.svg', 'utf8')

const targets = [
  ['public/medellin-rewards-logo.png', 1024],
  ['public/icon-512.png', 512],
  ['public/icon-192.png', 192],
  ['public/apple-touch-icon.png', 180],
]

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 1 })

for (const [path, size] of targets) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`
    <!doctype html>
    <html>
      <head>
        <style>
          html,
          body {
            width: ${size}px;
            height: ${size}px;
            margin: 0;
            background: transparent;
            overflow: hidden;
          }

          svg {
            display: block;
            width: ${size}px;
            height: ${size}px;
          }
        </style>
      </head>
      <body>${svg}</body>
    </html>
  `)
  await page.locator('svg').screenshot({ path, omitBackground: true })
}

await browser.close()
