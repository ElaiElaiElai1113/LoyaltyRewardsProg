import { describe, expect, it } from 'vitest'

import {
  extractGiftCardCode,
  extractMoneyFromGiftCardNote,
} from './gift-card-transaction-note'

const productionReceiptNote = [
  'Gift card code: GC-260805-5066C5.',
  'Gift card value: 25.00.',
  'Gift card remaining balance: 0.00.',
  'Original receipt total: 2300.00.',
  'Bill after gift card: 2275.00.',
  'Tax added: 0.00.',
  'Service charge added: 0.00.',
  'Total before gift card: 2300.00.',
  'Final bill after gift card: 2275.00.',
].join(' ')

describe('gift card transaction note parsing', () => {
  it('parses the exact production receipt without including sentence punctuation', () => {
    expect(extractGiftCardCode(productionReceiptNote)).toBe('GC-260805-5066C5')
    expect(extractMoneyFromGiftCardNote(productionReceiptNote, 'Gift card value')).toBe(25)
    expect(extractMoneyFromGiftCardNote(productionReceiptNote, 'Original receipt total')).toBe(2300)
    expect(extractMoneyFromGiftCardNote(productionReceiptNote, 'Final bill after gift card')).toBe(2275)
  })

  it('supports comma-formatted amounts and rejects missing or malformed values', () => {
    expect(extractMoneyFromGiftCardNote('Gift card value: 1,234.50.', 'Gift card value')).toBe(1234.5)
    expect(extractMoneyFromGiftCardNote('Gift card value: unavailable.', 'Gift card value')).toBeNull()
    expect(extractMoneyFromGiftCardNote(null, 'Gift card value')).toBeNull()
  })
})
