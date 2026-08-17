import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import { translateForLanguage } from './language'

const customerRoots = [
  'src/layouts/customer-layout.tsx',
  'src/components/customer-bottom-nav.tsx',
  'src/components/qr-scanner.tsx',
  'src/features/dashboard',
  'src/features/profile',
  'src/features/activity',
  'src/features/rewards',
  'src/features/promotions',
  'src/features/shop',
  'src/features/membership',
  'src/hooks/use-membership.ts',
  'src/hooks/use-customer-data.ts',
  'src/features/gift-cards/pages/gift-cards-page.tsx',
  'src/features/gift-cards/pages/wallet-gift-cards-page.tsx',
  'src/features/gift-cards/pages/gift-card-detail-page.tsx',
  'src/features/gift-cards/pages/public-gift-card-page.tsx',
  'src/features/gift-cards/components/gift-card-display.tsx',
  'src/features/gift-cards/components/gift-card-tile.tsx',
  'src/features/gift-cards/components/issue-confirmation-dialog.tsx',
]

function customerSourceFiles() {
  const files: string[] = []

  for (const root of customerRoots) {
    const absoluteRoot = path.resolve(root)
    if (statSync(absoluteRoot).isFile()) {
      files.push(absoluteRoot)
      continue
    }

    for (const entry of readdirSync(absoluteRoot, { recursive: true })) {
      const absoluteEntry = path.join(absoluteRoot, String(entry))
      if (
        statSync(absoluteEntry).isFile()
        && /\.(ts|tsx)$/.test(absoluteEntry)
        && !/\.(test|spec)\./.test(absoluteEntry)
      ) {
        files.push(absoluteEntry)
      }
    }
  }

  return files
}

function literalTranslationKeys(file: string) {
  const source = readFileSync(file, 'utf8')
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const keys: string[] = []

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === 't'
      && ts.isStringLiteralLike(node.arguments[0])
    ) {
      keys.push(node.arguments[0].text)
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return keys
}

describe('authenticated customer language isolation', () => {
  it('provides Spanish and Tagalog copy for every literal customer translation key', () => {
    const keys = new Set(customerSourceFiles().flatMap(literalTranslationKeys))
    const legitimateSpanishInvariants = new Set(['CVC', 'Legal', 'Subtotal', 'Total'])
    const legitimateTagalogInvariants = new Set(['CVC'])

    for (const key of keys) {
      if (!legitimateSpanishInvariants.has(key)) {
        expect(translateForLanguage('es', key), `missing Spanish customer copy for: ${key}`).not.toBe(key)
      }
      if (!legitimateTagalogInvariants.has(key)) {
        expect(translateForLanguage('tl', key), `missing Tagalog customer copy for: ${key}`).not.toBe(key)
      }
    }
  })

  it('keeps common customer interface terms out of the other language views', () => {
    const tagalogSamples = [
      'Account',
      'Wallet',
      'Rewards Marketplace',
      'Available Points',
      'Your Cart',
      'Order History',
      'Profile saved',
      'Gift Card Shop',
    ].map((key) => translateForLanguage('tl', key)).join(' ')
    expect(tagalogSamples).not.toMatch(/\b(account|wallet|rewards?|marketplace|available|points?|cart|orders?|history|profile|saved|gift|card|shop)\b/i)

    const spanishSamples = [
      'Wallet',
      'Buy gift cards',
      'Gift Card Shop',
      'Profile saved',
      'Back to Wallet',
    ].map((key) => translateForLanguage('es', key)).join(' ')
    expect(spanishSamples).not.toMatch(/\b(wallet|gift|cards?|shop|profile|saved|back)\b/i)
  })

  it('routes formerly hard-coded customer labels, placeholders, and toasts through translation', () => {
    const source = customerSourceFiles().map((file) => readFileSync(file, 'utf8')).join('\n')
    for (const hardCodedCopy of [
      '>Member QR<',
      '>Copy QR Link<',
      '>Gift Card Shop<',
      '>Issue gift card<',
      'placeholder="Optional front-desk or receptionist code"',
      "toast.success('Member QR link copied')",
      "toast.success('Gift card link copied')",
      "toast.success('Added to cart.')",
      "toast.success('Profile saved')",
    ]) {
      expect(source).not.toContain(hardCodedCopy)
    }
    expect(source).not.toContain('toast.error(t(error.message))')
    for (const fallback of [
      'Membership could not be activated.',
      'Membership could not be renewed.',
      'Membership could not be canceled.',
    ]) {
      expect(translateForLanguage('es', fallback)).not.toBe(fallback)
      expect(translateForLanguage('tl', fallback)).not.toBe(fallback)
    }
  })
})
