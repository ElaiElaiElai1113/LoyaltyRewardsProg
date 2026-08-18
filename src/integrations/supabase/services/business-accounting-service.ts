import { camelCaseRow, friendlySupabaseError, requireSupabase } from './shared'

export type AccountingFundingSource =
  | 'program_points'
  | 'program_grant'
  | 'business_issued'
  | 'review_required'

export type AccountingReimbursementStatus = 'estimated' | 'not_applicable' | 'review_required'

export interface BusinessAccountingRow {
  eventId: string
  transactionId: string | null
  giftCardId: string
  giftCardCode: string
  customerId: string
  customerName: string
  receiptNumber: string | null
  saleTotal: number
  giftCardApplied: number
  otherPaymentDue: number
  balanceBefore: number
  balanceAfter: number
  fundingSource: AccountingFundingSource
  reimbursementEstimate: number
  reimbursementStatus: AccountingReimbursementStatus
  commissionAmount: number
  commissionStatus: string
  redeemedAt: string
}

export interface BusinessAccountingFilters {
  from?: string
  to?: string
}

function startOfLocalDay(value?: string) {
  if (!value) return null
  return new Date(`${value}T00:00:00`).toISOString()
}

function dayAfterLocalDate(value?: string) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  date.setDate(date.getDate() + 1)
  return date.toISOString()
}

function mapAccountingRow(row: Record<string, unknown>): BusinessAccountingRow {
  const mapped = camelCaseRow(row)

  return {
    eventId: mapped.eventId as string,
    transactionId: (mapped.transactionId as string | null) ?? null,
    giftCardId: mapped.giftCardId as string,
    giftCardCode: mapped.giftCardCode as string,
    customerId: mapped.customerId as string,
    customerName: mapped.customerName as string,
    receiptNumber: (mapped.receiptNumber as string | null) ?? null,
    saleTotal: Number(mapped.saleTotal ?? 0),
    giftCardApplied: Number(mapped.giftCardApplied ?? 0),
    otherPaymentDue: Number(mapped.otherPaymentDue ?? 0),
    balanceBefore: Number(mapped.balanceBefore ?? 0),
    balanceAfter: Number(mapped.balanceAfter ?? 0),
    fundingSource: mapped.fundingSource as AccountingFundingSource,
    reimbursementEstimate: Number(mapped.reimbursementEstimate ?? 0),
    reimbursementStatus: mapped.reimbursementStatus as AccountingReimbursementStatus,
    commissionAmount: Number(mapped.commissionAmount ?? 0),
    commissionStatus: String(mapped.commissionStatus ?? 'not_recorded'),
    redeemedAt: mapped.redeemedAt as string,
  }
}

export const businessAccountingService = {
  async getReport(
    businessId: string,
    filters: BusinessAccountingFilters = {},
  ): Promise<BusinessAccountingRow[]> {
    const sb = requireSupabase()
    const { data, error } = await sb.rpc('get_business_accounting_report', {
      p_business_id: businessId,
      p_from: startOfLocalDay(filters.from),
      p_to: dayAfterLocalDate(filters.to),
    })

    if (error) {
      throw new Error(friendlySupabaseError(error, 'Failed to load the accounting report.'))
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapAccountingRow)
  },
}
