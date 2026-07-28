import { stat } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const homePath = join(root, 'src', 'features', 'home', 'pages', 'home-page.tsx')
const home = readFileSync(homePath, 'utf8')
const names = [
  'car-rewards-clean',
  'coffee-member',
  'coffee-rewards',
  'dinner-rewards',
  'real-estate-rewards',
  'salon-rewards',
]

if (/assets\/landing\/[^'"]+\.png/.test(home)) {
  throw new Error('Home page must not import PNG marketing photography.')
}
if (!home.includes('srcSet=') || !home.includes('loading="lazy"')) {
  throw new Error('Home page must use responsive sources and lazy loading.')
}

for (const name of names) {
  for (const suffix of ['-768.webp', '.webp']) {
    const path = join(root, 'src', 'assets', 'landing', `${name}${suffix}`)
    const details = await stat(path)
    if (details.size > 650_000) {
      throw new Error(`${name}${suffix} exceeds the 650 KB delivery budget.`)
    }
  }
}

console.log('Marketing image delivery checks passed.')
