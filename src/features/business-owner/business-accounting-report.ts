import type { GiftCard } from '@/types/domain'
import type { BusinessAccountingRow } from '@/integrations/supabase/services/business-accounting-service'

export interface BusinessAccountingSummary {
  grossSales: number
  giftCardApplied: number
  otherPaymentsDue: number
  estimatedReimbursement: number
  commissionTracked: number
  outstandingCardBalance: number
  fullCreditSales: number
  splitPaymentSales: number
  reviewRequired: number
}

function money(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : 0
}

export function summarizeBusinessAccounting(
  rows: readonly BusinessAccountingRow[],
  cards: readonly GiftCard[],
): BusinessAccountingSummary {
  return {
    grossSales: money(rows.reduce((total, row) => total + money(row.saleTotal), 0)),
    giftCardApplied: money(rows.reduce((total, row) => total + money(row.giftCardApplied), 0)),
    otherPaymentsDue: money(rows.reduce((total, row) => total + money(row.otherPaymentDue), 0)),
    estimatedReimbursement: money(rows.reduce((total, row) => total + money(row.reimbursementEstimate), 0)),
    commissionTracked: money(rows.reduce((total, row) => total + money(row.commissionAmount), 0)),
    outstandingCardBalance: money(cards
      .filter((card) => card.status === 'active')
      .reduce((total, card) => total + money(card.remainingBalance), 0)),
    fullCreditSales: rows.filter((row) => row.giftCardApplied > 0 && row.otherPaymentDue <= 0).length,
    splitPaymentSales: rows.filter((row) => row.giftCardApplied > 0 && row.otherPaymentDue > 0).length,
    reviewRequired: rows.filter((row) => row.reimbursementStatus === 'review_required').length,
  }
}

export function escapeAccountingCsvCell(value: string | number | null) {
  const cell = value === null ? '' : String(value)
  const spreadsheetSafeCell = /^[\t\r\n ]*[=+\-@]/.test(cell) ? `'${cell}` : cell
  return `"${spreadsheetSafeCell.replace(/"/g, '""')}"`
}
