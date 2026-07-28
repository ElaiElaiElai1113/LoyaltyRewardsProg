import { createHash } from 'node:crypto'

export const requiredCollections = [
  'users', 'businesses', 'balances', 'transactions', 'giftCards', 'agreements', 'referrals',
]

const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0

export function metrics(data) {
  const counts = Object.fromEntries(requiredCollections.map((key) => [key, Array.isArray(data[key]) ? data[key].length : 0]))
  return {
    counts,
    balancePoints: (data.balances ?? []).reduce((sum, row) => sum + number(row.points), 0),
    transactionValue: (data.transactions ?? []).reduce((sum, row) => sum + number(row.total), 0),
    giftCardOutstanding: (data.giftCards ?? [])
      .filter((row) => row.status === 'active')
      .reduce((sum, row) => sum + number(row.remainingValue ?? row.value), 0),
    signedAgreements: (data.agreements ?? []).filter((row) => row.signedAt || row.status === 'signed').length,
  }
}

export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export function digest(value) {
  return createHash('sha256').update(stableJson(value)).digest('hex')
}
