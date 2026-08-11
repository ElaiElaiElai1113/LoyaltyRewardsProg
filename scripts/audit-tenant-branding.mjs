import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const files = execFileSync('git', ['ls-files', 'src', 'api', 'public', 'index.html', 'vite.config.ts'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean)
const patterns = [/Davao Rewards/g, /davaorewards\.com/g, /\bDavao\b/g]
const permitted = [
  /tenant-service(?:\.test)?\.ts$/,
  /tenant-migration\.test\.ts$/,
  /language\.tsx$/,
  /landing-content\.ts$/,
  /early-access-content\.ts$/,
  /landing-page\.tsx$/,
  /early-access-page\.tsx$/,
  /ambassador-content\.ts$/,
  /ambassadors-page\.tsx$/,
  /for-businesses-page\.tsx$/,
  /legal-page\.tsx$/,
  /home-page\.tsx$/,
  /shop-page\.tsx$/,
  /rewardme-pitch-alignment\.test\.ts$/,
  /platform-guide-page\.tsx$/,
  /mock-store\.ts$/,
  /send-welcome-email\.ts$/,
  /tenant-migration\.test\.ts$/,
]
const findings = []
for (const file of files) {
  const content = await readFile(resolve(file), 'utf8').catch(() => '')
  const lines = content.split(/\r?\n/)
  for (const [index, line] of lines.entries()) {
    if (patterns.some((pattern) => pattern.test(line))) {
      findings.push({ file, line: index + 1, permitted: permitted.some((pattern) => pattern.test(file)), text: line.trim().slice(0, 180) })
    }
    for (const pattern of patterns) pattern.lastIndex = 0
  }
}
const unexpected = findings.filter((finding) => !finding.permitted)
console.log(JSON.stringify({ passed: unexpected.length === 0, totalReferences: findings.length, unexpected }, null, 2))
process.exit(unexpected.length ? 1 : 0)
