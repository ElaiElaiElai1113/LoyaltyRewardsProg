import { readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import { chromium } from 'playwright'

const sources = [
  'car-rewards-clean.png',
  'coffee-member.png',
  'coffee-rewards.png',
  'dinner-rewards.png',
  'real-estate-rewards.png',
  'salon-rewards.png',
]
const assetDirectory = join(process.cwd(), 'src', 'assets', 'landing')
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

try {
  for (const sourceName of sources) {
    const sourcePath = join(assetDirectory, sourceName)
    const input = await readFile(sourcePath)
    const encoded = input.toString('base64')
    const stem = basename(sourceName, extname(sourceName))

    for (const targetWidth of [768, null]) {
      const result = await page.evaluate(
        async ({ encodedImage, width }) => {
          const image = new Image()
          image.src = `data:image/png;base64,${encodedImage}`
          await image.decode()

          const outputWidth = width ? Math.min(width, image.naturalWidth) : image.naturalWidth
          const outputHeight = Math.round(image.naturalHeight * (outputWidth / image.naturalWidth))
          const canvas = document.createElement('canvas')
          canvas.width = outputWidth
          canvas.height = outputHeight
          canvas.getContext('2d').drawImage(image, 0, 0, outputWidth, outputHeight)
          return canvas.toDataURL('image/webp', 0.82)
        },
        { encodedImage: encoded, width: targetWidth },
      )

      const outputName = `${stem}${targetWidth ? `-${targetWidth}` : ''}.webp`
      const outputPath = join(dirname(sourcePath), outputName)
      await writeFile(outputPath, Buffer.from(result.split(',')[1], 'base64'))
      console.log(outputName)
    }
  }
} finally {
  await browser.close()
}
