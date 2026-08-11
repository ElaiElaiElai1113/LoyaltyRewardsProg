import { writeFile } from 'node:fs/promises'
import { renderToStaticMarkup } from 'react-dom/server'
import { QRCodeSVG } from 'qrcode.react'
import React from 'react'
import { chromium } from 'playwright'

const destination = 'https://loyalty-rewards-prog.vercel.app/'
const qr = renderToStaticMarkup(
  React.createElement(QRCodeSVG, {
    value: destination,
    size: 1024,
    level: 'H',
    marginSize: 4,
    bgColor: '#FAF8F3',
    fgColor: '#11100E',
    title: 'Open RewardMe',
  }),
)

await writeFile(
  'public/rewardme-qr.svg',
  `<?xml version="1.0" encoding="UTF-8"?>\n${qr}\n`,
  'utf8',
)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 })
await page.setContent(`<!doctype html>
<html><head><style>
*{box-sizing:border-box}body{margin:0;background:#faf8f3;color:#17130f;font-family:Arial,sans-serif}
main{width:1200px;height:1500px;padding:110px 100px;display:flex;flex-direction:column;align-items:center;text-align:center}
.eyebrow{color:#a67608;font:700 25px Georgia,serif;letter-spacing:8px}.title{margin:42px 0 18px;font:700 88px Georgia,serif;line-height:.95}
.copy{max-width:780px;margin:0 0 55px;color:#5f584f;font-size:28px;line-height:1.45}.qr{padding:28px;background:white;border:2px solid #d9ad20;border-radius:30px}
.qr svg{display:block;width:620px;height:620px}.url{margin-top:42px;font-size:27px;font-weight:700}.rule{width:120px;height:5px;margin:42px 0;background:#d9ad20}
.footer{font-size:22px;color:#6d655b}
</style></head><body><main>
<div class="eyebrow">REWARDME</div>
<h1 class="title">Support local.<br>Earn more.</h1>
<p class="copy">Scan to discover participating businesses, earn member rewards, and support Filipino entrepreneurs.</p>
<div class="qr">${qr}</div>
<div class="url">loyalty-rewards-prog.vercel.app</div>
<div class="rule"></div>
<div class="footer">Made for members and local businesses in the Philippines.</div>
</main></body></html>`)
await page.screenshot({ path: 'public/rewardme-scan-poster.png' })
await browser.close()
