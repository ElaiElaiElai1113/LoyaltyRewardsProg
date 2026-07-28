import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const inputPath = process.argv[2]
if (!inputPath) {
  console.error('Usage: npm run validate:tenant-import -- path/to/export.json')
  process.exit(2)
}

const data = JSON.parse(await readFile(resolve(inputPath), 'utf8'))
const requiredCollections = ['users', 'businesses', 'balances', 'transactions', 'giftCards', 'agreements', 'referrals']
const errors = []
const summary = {}

for (const collection of requiredCollections) {
  if (!Array.isArray(data[collection])) {
    errors.push(`${collection} must be an array`)
    continue
  }
  summary[collection] = data[collection].length
}

function duplicates(rows, key) {
  const seen = new Set()
  return rows.filter((row) => {
    const value = String(row?.[key] ?? '').toLowerCase()
    if (!value || !seen.has(value)) {
      if (value) seen.add(value)
      return false
    }
    return true
  })
}

if (Array.isArray(data.users)) {
  const duplicateEmails = duplicates(data.users, 'email')
  if (duplicateEmails.length) errors.push(`${duplicateEmails.length} duplicate user email(s)`)
}
if (Array.isArray(data.businesses)) {
  const duplicateSlugs = duplicates(data.businesses, 'slug')
  if (duplicateSlugs.length) errors.push(`${duplicateSlugs.length} duplicate business slug(s)`)
}

const userIds = new Set((data.users ?? []).map((row) => String(row.id)))
const businessIds = new Set((data.businesses ?? []).map((row) => String(row.id)))
for (const balance of data.balances ?? []) {
  if (!userIds.has(String(balance.userId))) errors.push(`balance ${balance.id ?? '(unknown)'} references an unknown user`)
  if (Number(balance.points ?? 0) < 0) errors.push(`balance ${balance.id ?? '(unknown)'} is negative`)
}
for (const transaction of data.transactions ?? []) {
  if (!userIds.has(String(transaction.userId))) errors.push(`transaction ${transaction.id ?? '(unknown)'} references an unknown user`)
  if (!businessIds.has(String(transaction.businessId))) errors.push(`transaction ${transaction.id ?? '(unknown)'} references an unknown business`)
}

summary.balancePoints = (data.balances ?? []).reduce((total, row) => total + Number(row.points ?? 0), 0)
summary.transactionValue = (data.transactions ?? []).reduce((total, row) => total + Number(row.total ?? 0), 0)
summary.giftCardOutstanding = (data.giftCards ?? [])
  .filter((row) => row.status === 'active')
  .reduce((total, row) => total + Number(row.remainingValue ?? row.value ?? 0), 0)

console.log(JSON.stringify({ valid: errors.length === 0, summary, errors }, null, 2))
process.exit(errors.length ? 1 : 0)
