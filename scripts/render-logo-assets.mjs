import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const rewardMeFullLogoSvg = readFileSync('public/rewardme-logo.svg', 'utf8')
const rewardMeInstallMarkSvg = readFileSync('public/rewardme-mark.svg', 'utf8')
const pinasFullLogoSvg = readFileSync('public/pinas-rewards-logo.svg', 'utf8')
const pinasInstallMarkSvg = readFileSync('public/pinas-rewards-mark.svg', 'utf8')

const targets = [
  ['public/rewardme-logo.png', 1024, rewardMeFullLogoSvg],
  ['public/install-icons/rewardme-512.png', 512, rewardMeInstallMarkSvg],
  ['public/install-icons/rewardme-192.png', 192, rewardMeInstallMarkSvg],
  ['public/install-icons/rewardme-180.png', 180, rewardMeInstallMarkSvg],
  ['public/pinas-rewards-logo.png', 1024, pinasFullLogoSvg],
  ['public/install-icons/pinasrewards-512.png', 512, pinasInstallMarkSvg],
  ['public/install-icons/pinasrewards-192.png', 192, pinasInstallMarkSvg],
  ['public/install-icons/pinasrewards-180.png', 180, pinasInstallMarkSvg],
  ['ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', 1024],
  ['android/app/src/main/res/mipmap-mdpi/ic_launcher.png', 48],
  ['android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png', 48],
  ['android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png', 108],
  ['android/app/src/main/res/mipmap-hdpi/ic_launcher.png', 72],
  ['android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png', 72],
  ['android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png', 162],
  ['android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', 96],
  ['android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png', 96],
  ['android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png', 216],
  ['android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png', 144],
  ['android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png', 144],
  ['android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png', 324],
  ['android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', 192],
  ['android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png', 192],
  ['android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png', 432],
]

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 1 })

for (const [path, size, sourceSvg = rewardMeInstallMarkSvg] of targets) {
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
      <body>${sourceSvg}</body>
    </html>
  `)
  await page.locator('svg').screenshot({ path, omitBackground: true })
}

await browser.close()
