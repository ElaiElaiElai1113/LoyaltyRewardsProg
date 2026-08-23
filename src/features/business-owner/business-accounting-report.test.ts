import { describe, expect, it } from 'vitest'

import type { GiftCard } from '@/types/domain'
import type { BusinessAccountingRow } from '@/integrations/supabase/services/business-accounting-service'
import { escapeAccountingCsvCell, summarizeBusinessAccounting } from './business-accounting-report'

function row(overrides: Partial<BusinessAccountingRow> = {}): BusinessAccountingRow {
  return {
    eventId: 'event-1',
    transactionId: 'transaction-1',
    giftCardId: 'card-1',
    giftCardCode: 'GC-001',
    customerId: 'customer-1',
    customerName: 'Customer',
    receiptNumber: 'R-001',
    saleTotal: 75,
    giftCardApplied: 50,
    otherPaymentDue: 25,
    balanceBefore: 50,
    balanceAfter: 0,
    fundingSource: 'program_points',
    reimbursementEstimate: 0,
    reimbursementStatus: 'not_applicable',
    commissionAmount: 7.5,
    commissionStatus: 'commission_unpaid',
    redeemedAt: '2026-08-18T00:00:00.000Z',
    ...overrides,
  }
}

describe('business accounting report', () => {
  it('summarizes split and full-credit sales without reducing gross sales', () => {
    const cards = [
      { status: 'active', remainingBalance: 20 },
      { status: 'redeemed', remainingBalance: 0 },
    ] as GiftCard[]
    const summary = summarizeBusinessAccounting([
      row(),
      row({ eventId: 'event-2', saleTotal: 30, giftCardApplied: 30, otherPaymentDue: 0, reimbursementEstimate: 0, reimbursementStatus: 'not_applicable' }),
    ], cards)

    expect(summary).toEqual({
      grossSales: 105,
      giftCardApplied: 80,
      otherPaymentsDue: 25,
      estimatedReimbursement: 0,
      commissionTracked: 15,
      outstandingCardBalance: 20,
      fullCreditSales: 1,
      splitPaymentSales: 1,
      reviewRequired: 0,
    })
  })

  it('counts funding rows that need a commercial review', () => {
    const summary = summarizeBusinessAccounting([
      row({ reimbursementStatus: 'review_required', reimbursementEstimate: 0 }),
    ], [])

    expect(summary.reviewRequired).toBe(1)
  })

  it('escapes spreadsheet cells safely', () => {
    expect(escapeAccountingCsvCell('Receipt "A", final')).toBe('"Receipt ""A"", final"')
    expect(escapeAccountingCsvCell(null)).toBe('""')
  })

  it('neutralizes formulas in exported customer data', () => {
    expect(escapeAccountingCsvCell('=HYPERLINK("https://example.test")')).toBe('"\'=HYPERLINK(""https://example.test"")"')
    expect(escapeAccountingCsvCell('  +SUM(1,2)')).toBe('"\'  +SUM(1,2)"')
  })
})
