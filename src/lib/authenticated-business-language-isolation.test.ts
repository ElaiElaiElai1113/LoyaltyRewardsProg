import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

const workspaceFiles = [
  'src/features/business-owner/pages/business-dashboard-page.tsx',
  'src/features/business-owner/pages/member-sale-page.tsx',
  'src/features/business-owner/pages/members-page.tsx',
  'src/features/business-owner/pages/partners-page.tsx',
  'src/features/business-owner/pages/products-page.tsx',
  'src/features/business-owner/pages/promotions-page.tsx',
  'src/features/business-owner/pages/rewards-page.tsx',
  'src/features/business-owner/pages/settings-page.tsx',
  'src/features/gift-cards/pages/business-gift-cards-page.tsx',
  'src/features/gift-cards/pages/redemptions-page.tsx',
  'src/features/gift-cards/components/redemption-confirmation-dialog.tsx',
  'src/components/qr-scanner.tsx',
  'src/layouts/business-owner-layout.tsx',
] as const

describe('authenticated business language isolation', () => {
  it('routes every business workspace surface through the shared language provider', () => {
    for (const path of workspaceFiles) {
      const contents = source(path)
      expect(contents, path).toContain("from '@/lib/language'")
      expect(contents, path).toContain('useLanguage()')
    }

    const transactions = source('src/features/gift-cards/pages/redemptions-page.tsx')
    const giftCards = source('src/features/gift-cards/pages/business-gift-cards-page.tsx')
    const members = source('src/features/business-owner/pages/members-page.tsx')
    const scanner = source('src/components/qr-scanner.tsx')

    expect(transactions).toContain("t('Choose the Customer')")
    expect(transactions).toContain("aria-label={t('Search customers')}")
    expect(transactions).toContain("t('Transaction History')")
    expect(transactions).toContain("t('Transaction history pagination')")
    expect(giftCards).toContain("t('Gift Card Catalog')")
    expect(giftCards).toContain("t('Business-issued cards start with the catalog value and do not deduct customer points.')")
    expect(members).toContain("t('Search by name, email, or customer ID')")
    expect(scanner).toContain("t('Checking the whole image for a QR code...')")
    expect(scanner).toContain("t('No QR found. Try a clearer screenshot or use the camera.')")
  })

  it('defines natural Spanish and Tagalog copy for representative business workflows', () => {
    const language = source('src/lib/language.tsx')
    const requiredKeys = [
      'Business Staff',
      'Choose the Customer',
      'Gift Card Catalog',
      'Business-issued cards start with the catalog value and do not deduct customer points.',
      'Search customers',
      'Transaction History',
      'Transaction history pagination',
      'Checking the whole image for a QR code...',
      'No QR found. Try a clearer screenshot or use the camera.',
      'Partner Referrals',
      'View and manage your product catalog and inventory.',
      'Create and manage rewards customers can redeem with points.',
    ]

    for (const key of requiredKeys) {
      expect(language.split(`'${key}'`).length - 1, key).toBeGreaterThanOrEqual(2)
    }

    expect(language).toContain("'Choose the Customer': 'Elige al cliente'")
    expect(language).toContain("'Gift Card Catalog': 'Catálogo de tarjetas de regalo'")
    expect(language).toContain("'Transaction History': 'Historial de transacciones'")
    expect(language).toContain("'Business Staff': 'Kawani ng Negosyo'")
    expect(language).toContain("'Choose the Customer': 'Piliin ang Kostumer'")
    expect(language).toContain("'Gift Card Catalog': 'Katalogo ng mga Kard na Regalo'")
    expect(language).toContain("'Transaction History': 'Kasaysayan ng mga Transaksiyon'")
  })

  it('preserves business-owned catalog and customer data instead of translating it', () => {
    const rewards = source('src/features/business-owner/pages/rewards-page.tsx')
    const promotions = source('src/features/business-owner/pages/promotions-page.tsx')
    const products = source('src/features/business-owner/pages/products-page.tsx')
    const transactions = source('src/features/gift-cards/pages/redemptions-page.tsx')

    expect(rewards).not.toMatch(/t\(reward\.(?:title|description)\)/)
    expect(promotions).not.toMatch(/t\(promotion\.(?:title|description|badge|cta|audience)\)/)
    expect(products).not.toMatch(/t\(product\.(?:title|description|highlight)\)/)
    expect(transactions).toContain("selectedCard.catalog?.title ?? t('Gift card')")
    expect(transactions).not.toMatch(/t\(selectedCard\.catalog\?\.title\)/)
  })
})
