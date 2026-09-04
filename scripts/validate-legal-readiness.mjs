import { readFile } from 'node:fs/promises'

const documents = [
  ['member-terms.md', 'RewardMe Member Terms of Use'],
  ['privacy-notice.md', 'RewardMe Privacy Notice'],
  ['rewards-and-gift-card-terms.md', 'RewardMe Rewards and Gift Card Terms'],
  ['referral-program-terms.md', 'RewardMe Referral Program Terms'],
  ['savings-plan-supplement.md', 'RewardMe Savings Plan Supplement'],
  ['verification-policy.md', 'RewardMe Verification Policy'],
  ['business-partner-agreement.md', 'RewardMe Business Partner Agreement'],
  ['consent-and-account-deletion.md', 'RewardMe Consent and Account Deletion Notice'],
]

const directory = 'docs/legal-drafts'
const readme = await readFile(`${directory}/README.md`, 'utf8')
const checklist = await readFile(`${directory}/legal-approval-checklist.md`, 'utf8')
const legalPage = await readFile('src/features/legal/pages/legal-page.tsx', 'utf8')
const legalContent = await readFile('src/features/legal/legal-content.ts', 'utf8')
const router = await readFile('src/routes/router.tsx', 'utf8')
const failures = []
const unresolvedOwnerInputs = []

for (const [file, title] of documents) {
  const content = await readFile(`${directory}/${file}`, 'utf8').catch(() => '')
  if (!content.startsWith(`# ${title}`)) failures.push(`${file}: missing canonical title`)
  if (!/^Status: \*\*DRAFT/m.test(content)) failures.push(`${file}: draft status is missing`)
  if ((content.match(/^## /gm) ?? []).length < 2) failures.push(`${file}: insufficient section structure`)
  if (/Medellin|PinasRewards|Pinas Rewards/i.test(content)) failures.push(`${file}: legacy brand found`)
  if (/\uFFFD|â€|Ã.|Â./u.test(content)) failures.push(`${file}: encoding artifact found`)
  if (!readme.includes(`](${file})`)) failures.push(`${file}: missing from legal pack index`)
  if (!checklist.includes(`| ${title.replace(/^RewardMe /, '')} |`)) {
    failures.push(`${file}: missing from counsel approval register`)
  }

  for (const match of content.matchAll(/`\[([^\]]*(?:REQUIRED|OWNER INPUT)[^\]]*)\]`/g)) {
    unresolvedOwnerInputs.push({ file, field: match[1] })
  }
}

for (const route of ['/terms', '/privacy', '/reward-terms', '/verification-policy']) {
  if (!router.includes(`path: '${route}'`)) failures.push(`missing public legal route: ${route}`)
}

if (/Medellin|PinasRewards|Pinas Rewards/i.test(legalPage)) {
  failures.push('public legal summaries contain a legacy brand')
}
if (!legalPage.includes(".replaceAll('RewardMe', program.name)")) {
  failures.push('public legal summaries are not tenant-aware')
}
if (!legalContent.includes('pending final legal approval before paid membership launch')) {
  failures.push('public legal summaries do not disclose draft status')
}
if (/\|\s*Yes\s*\|/.test(checklist)) {
  failures.push('a document is marked approved without recorded counsel completion')
}

console.log(JSON.stringify({
  passed: failures.length === 0,
  technicalReviewComplete: failures.length === 0,
  counselApprovalComplete: false,
  documents: documents.length,
  unresolvedOwnerInputs,
  failures,
}, null, 2))
process.exit(failures.length ? 1 : 0)
