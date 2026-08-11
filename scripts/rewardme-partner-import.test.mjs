import assert from 'node:assert/strict'
import test from 'node:test'

import {
  analyzeRewardMePartnerCatalog,
  createRewardMePartnerManifest,
  parseCsv,
} from './rewardme-partner-import.mjs'

const partnerHeader = 'external_id,legal_name,display_name,slug,category,description,location,address,currency,reward_rate_percent,commission_rate_percent,settlement_cycle,owner_full_name,owner_email,owner_phone,active,agreement_status'
const offerHeader = 'external_id,business_external_id,title,description,offer_type,reward_rate_percent,inventory,start_date,end_date,restrictions,active'

test('parses quoted commas and escaped quotes', () => {
  const parsed = parseCsv('name,description\nCafe,"Coffee, tea and ""more"""\n')
  assert.equal(parsed.rows[0].values.description, 'Coffee, tea and "more"')
})

test('accepts a complete signed RewardMe partner catalog', () => {
  const partners = `${partnerHeader}\nbiz-001,Example Inc.,Example Cafe,example-cafe,Cafe,Local cafe,Davao City,123 Example St,PHP,20,25,weekly,Alex Owner,owner@example.com,+639171234567,true,signed\n`
  const offers = `${offerHeader}\noffer-001,biz-001,Weekday coffee,20% back on weekdays,reward,20,100,2026-09-01,2026-12-31,Weekdays only,true\n`
  const result = analyzeRewardMePartnerCatalog(partners, offers)
  assert.equal(result.valid, true)
  assert.deepEqual(result.errors, [])
  assert.equal(result.summary.activePartners, 1)
  assert.equal(result.summary.activeOffers, 1)
})

test('rejects activation without a signed agreement and unknown partner offers', () => {
  const partners = `${partnerHeader}\nbiz-001,Example Inc.,Example Cafe,Example Cafe,Cafe,Local cafe,Davao City,123 Example St,php,120,25,weekly,Alex Owner,invalid,true,true,draft\n`
  const offers = `${offerHeader}\noffer-001,biz-404,Weekday coffee,Offer,reward,20,1,2026-12-31,2026-01-01,None,true\n`
  const result = analyzeRewardMePartnerCatalog(partners, offers)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('signed agreement')))
  assert.ok(result.errors.some((error) => error.includes('unknown business_external_id')))
  assert.ok(result.errors.some((error) => error.includes('end_date')))
})

test('rejects unsafe activation details before packaging', () => {
  const partners = `${partnerHeader}\nbiz-001,Example Inc.,Example Cafe,example-cafe,Cafe,,Davao City,,PHP,20,25,daily,Alex Owner,owner@example.com,09171234567,true,signed\n`
  const offers = `${offerHeader}\noffer-001,biz-001,Weekday coffee,Offer,reward,20,0,2026-09-01,2026-12-31,Weekdays only,true\n`
  const result = analyzeRewardMePartnerCatalog(partners, offers)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('settlement_cycle')))
  assert.ok(result.errors.some((error) => error.includes('E.164')))
  assert.ok(result.errors.some((error) => error.includes('inventory greater than zero')))
  assert.throws(() => createRewardMePartnerManifest(partners, offers), /invalid RewardMe catalog/)
})

test('creates a deterministic review-only manifest for a valid catalog', () => {
  const partners = `${partnerHeader}\nbiz-001,Example Inc.,Example Cafe,example-cafe,Cafe,Local cafe,Davao City,123 Example St,PHP,20,25,monthly,Alex Owner,owner@example.com,+639171234567,false,draft\n`
  const offers = `${offerHeader}\noffer-001,biz-001,Weekday coffee,20% back on weekdays,reward,20,100,2026-09-01,2026-12-31,Weekdays only,false\n`
  const manifest = createRewardMePartnerManifest(partners, offers, {
    generatedAt: '2026-08-11T00:00:00.000Z',
  })
  assert.equal(manifest.importMode, 'review-only')
  assert.equal(manifest.activation.automatic, false)
  assert.equal(manifest.summary.partners, 1)
  assert.match(manifest.sources.partners.sha256, /^[a-f0-9]{64}$/)
})
