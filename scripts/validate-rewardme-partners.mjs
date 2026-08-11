import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { analyzeRewardMePartnerCatalog } from './rewardme-partner-import.mjs'

const [partnerPath, offerPath] = process.argv.slice(2)
if (!partnerPath || !offerPath) {
  console.error('Usage: npm run validate:rewardme-partners -- path/to/partners.csv path/to/offers.csv')
  process.exit(2)
}

const [partners, offers] = await Promise.all([
  readFile(resolve(partnerPath), 'utf8'),
  readFile(resolve(offerPath), 'utf8'),
])
const result = analyzeRewardMePartnerCatalog(partners, offers)
console.log(JSON.stringify(result, null, 2))
process.exit(result.valid ? 0 : 1)
