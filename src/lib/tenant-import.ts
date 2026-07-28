export const tenantImportCollections = [
  'users',
  'businesses',
  'balances',
  'transactions',
  'giftCards',
  'agreements',
  'referrals',
] as const

export type TenantImportCollection = typeof tenantImportCollections[number]
export type TenantImportData = Record<TenantImportCollection, Array<Record<string, unknown>>>

export interface TenantImportAnalysis {
  valid: boolean
  errors: string[]
  warnings: string[]
  counts: Record<TenantImportCollection, number>
  sourceColumns: Record<TenantImportCollection, string[]>
  totals: {
    balancePoints: number
    transactionValue: number
    giftCardOutstanding: number
  }
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export function analyzeTenantImport(value: unknown): TenantImportAnalysis {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const errors: string[] = []
  const warnings: string[] = []
  const counts = {} as Record<TenantImportCollection, number>
  const sourceColumns = {} as Record<TenantImportCollection, string[]>
  const data = {} as TenantImportData

  for (const collection of tenantImportCollections) {
    const rows = source[collection]
    if (!Array.isArray(rows)) {
      errors.push(`${collection} must be an array`)
      data[collection] = []
    } else {
      data[collection] = rows.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
      if (data[collection].length !== rows.length) errors.push(`${collection} contains invalid rows`)
    }
    counts[collection] = data[collection].length
    sourceColumns[collection] = [...new Set(data[collection].flatMap((row) => Object.keys(row)))].sort()
  }

  const duplicateEmails = new Set<string>()
  const seenEmails = new Set<string>()
  for (const user of data.users) {
    const email = String(user.email ?? '').trim().toLowerCase()
    if (!email) errors.push(`user ${String(user.id ?? '(unknown)')} has no email`)
    else if (seenEmails.has(email)) duplicateEmails.add(email)
    else seenEmails.add(email)
  }
  if (duplicateEmails.size) errors.push(`${duplicateEmails.size} duplicate user email(s)`)

  const userIds = new Set(data.users.map((row) => String(row.id)))
  const businessIds = new Set(data.businesses.map((row) => String(row.id)))
  for (const balance of data.balances) {
    if (!userIds.has(String(balance.userId))) errors.push(`balance ${String(balance.id ?? '(unknown)')} references an unknown user`)
    if (numberValue(balance.points) < 0) errors.push(`balance ${String(balance.id ?? '(unknown)')} is negative`)
  }
  for (const transaction of data.transactions) {
    if (!userIds.has(String(transaction.userId))) errors.push(`transaction ${String(transaction.id ?? '(unknown)')} references an unknown user`)
    if (!businessIds.has(String(transaction.businessId))) errors.push(`transaction ${String(transaction.id ?? '(unknown)')} references an unknown business`)
  }
  if (!data.agreements.length) warnings.push('No agreement acceptances are included.')

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    counts,
    sourceColumns,
    totals: {
      balancePoints: data.balances.reduce((total, row) => total + numberValue(row.points), 0),
      transactionValue: data.transactions.reduce((total, row) => total + numberValue(row.total ?? row.purchaseAmount), 0),
      giftCardOutstanding: data.giftCards
        .filter((row) => row.status === 'active')
        .reduce((total, row) => total + numberValue(row.remainingValue ?? row.value), 0),
    },
  }
}
