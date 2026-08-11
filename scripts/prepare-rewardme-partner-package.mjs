import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  analyzeRewardMePartnerCatalog,
  createRewardMePartnerManifest,
} from './rewardme-partner-import.mjs'

const [partnerPathInput, offerPathInput, outputPathInput] = process.argv.slice(2)
if (!partnerPathInput || !offerPathInput || !outputPathInput) {
  console.error(
    'Usage: npm run prepare:rewardme-partners -- path/to/partners.csv path/to/offers.csv path/to/new-output-directory',
  )
  process.exit(2)
}

const partnerPath = resolve(partnerPathInput)
const offerPath = resolve(offerPathInput)
const outputPath = resolve(outputPathInput)
const [partnerCsv, offerCsv] = await Promise.all([
  readFile(partnerPath, 'utf8'),
  readFile(offerPath, 'utf8'),
])
const validation = analyzeRewardMePartnerCatalog(partnerCsv, offerCsv)

if (!validation.valid) {
  console.error(JSON.stringify(validation, null, 2))
  console.error('\nPackage was not created. Resolve every validation error first.')
  process.exit(1)
}

const manifest = createRewardMePartnerManifest(partnerCsv, offerCsv)
await mkdir(outputPath)
await Promise.all([
  copyFile(partnerPath, resolve(outputPath, 'partners.csv')),
  copyFile(offerPath, resolve(outputPath, 'offers.csv')),
  writeFile(resolve(outputPath, 'validation-report.json'), `${JSON.stringify(validation, null, 2)}\n`, 'utf8'),
  writeFile(resolve(outputPath, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8'),
])

console.log(JSON.stringify({ outputPath, manifest, validation }, null, 2))
