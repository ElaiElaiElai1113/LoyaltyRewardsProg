import { readFileSync, readdirSync } from 'node:fs'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { translateForLanguage } from './language'
import { rewardMeCommissionAgreement, rewardMeCreditAgreement } from '@/features/business/content/rewardme-business-agreements'
import { spanishBusinessTranslations } from './spanish-business-translations'

describe('Spanish translation completeness', () => {
  it('preserves every named value in business translations', () => {
    const values = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()
    for (const [english, spanish] of Object.entries(spanishBusinessTranslations)) {
      expect(values(spanish), english).toEqual(values(english))
    }
  })

  it('does not leave English JSX text in shared controls', () => {
    const files = ['src/components/program-invitations.tsx', 'src/components/program-switcher.tsx', 'src/components/ui/dialog.tsx', 'src/components/language-picker.tsx', 'src/layouts/customer-layout.tsx', 'src/features/tenant/tenant-provider.tsx']
    const untranslated: string[] = []
    for (const file of files) {
      const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
      function visit(node: ts.Node) {
        if (ts.isJsxText(node) && /[a-zA-Z]{3}/.test(node.text)) untranslated.push(`${file}: ${node.text.trim()}`)
        ts.forEachChild(node, visit)
      }
      visit(source)
    }
    expect(untranslated).toEqual([])
  })

  it('translates every business agreement section', () => {
    for (const section of [...rewardMeCommissionAgreement, ...rewardMeCreditAgreement]) {
      for (const text of [section.title, ...(section.paragraphs ?? []), ...(section.items ?? [])]) {
        expect(translateForLanguage('es', text), text).not.toBe(text)
      }
    }
  })

  it('covers literal UI translation keys across the application', () => {
    const invariant = new Set(['CVC', 'ID', 'ID:', 'Portal', 'Plan', 'Ana - Harbor View Hotel', 'optional@email.com', 'Instagram', 'TikTok', 'WhatsApp', 'Legal', 'Subtotal', 'Total', 'Gold', 'Regular', 'Premium', 'Standard', 'RewardMe', 'Wondertown', 'Loyality', 'QR', 'CSV', 'Email', 'No', 'Base'])
    const missing: string[] = []
    for (const file of readdirSync('src', { recursive: true }).map(String).filter((file) => /\.tsx?$/.test(file) && !/\.test\./.test(file))) {
      const source = ts.createSourceFile(file, readFileSync(`src/${file}`, 'utf8'), ts.ScriptTarget.Latest, true)
      function visit(node: ts.Node) {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't' && node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
          const key = node.arguments[0].text
          if (/[a-zA-Z]/.test(key) && !invariant.has(key) && translateForLanguage('es', key) === key) missing.push(`${file}: ${key}`)
        }
        ts.forEachChild(node, visit)
      }
      visit(source)
    }
    expect(missing).toEqual([])
  })
})
