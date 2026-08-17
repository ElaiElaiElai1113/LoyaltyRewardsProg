import { readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import {
  ambassadorCreatorSignals,
  ambassadorFormIntro,
  ambassadorPerks,
  ambassadorPrimaryCta,
  ambassadorSuccessMessage,
  ambassadorSuccessTitle,
  ambassadorVipHeadline,
  ambassadorVipSupportingCopy,
} from '@/features/ambassadors/ambassador-content'
import {
  launchReadinessStatusLabels,
  rewardMeLaunchWorkstreams,
} from '@/features/platform/launch-readiness'

import { translateForLanguage } from './language'

const adminSources = [
  'src/layouts/admin-layout.tsx',
  'src/layouts/program-admin-layout.tsx',
  'src/layouts/app-shell.tsx',
  'src/features/admin/pages/admin-page.tsx',
  'src/features/admin/components/agreement-status-panel.tsx',
  'src/features/gift-cards/pages/admin-gift-cards-page.tsx',
  'src/features/platform/pages/membership-operations-page.tsx',
  'src/features/platform/pages/platform-programs-page.tsx',
  'src/features/platform/pages/tenant-import-page.tsx',
  'src/features/platform/pages/launch-readiness-page.tsx',
  'src/features/program/pages/program-onboarding-page.tsx',
  'src/features/program/pages/program-settings-page.tsx',
  'src/features/program/pages/program-team-page.tsx',
  'src/features/program/pages/program-reports-page.tsx',
  'src/features/program/pages/program-billing-page.tsx',
  'src/features/ambassadors/pages/ambassadors-page.tsx',
].map((file) => path.resolve(file))

const adminFormValidationKeys = [
  'Select a member',
  'Minimum -10000',
  'Maximum 10000',
  'Add a clear reason',
  'Select a business',
  'Enter a reward title',
  'Add a short description',
  'Set a realistic points cost',
  'Add a highlight',
  'Enter a promotion title',
  'Add a badge',
  'Add a CTA',
  'Add an audience',
  'Enter a product title',
  'Minimum price is $0.50',
  'Inventory cannot be negative',
  'Enter a business name',
  'Enter a slug',
  'Use lowercase letters, numbers, and single hyphens only',
  'Keep the address under 180 characters',
  'Latitude must be -90 or greater',
  'Latitude must be 90 or less',
  'Longitude must be -180 or greater',
  'Longitude must be 180 or less',
  'Enter a valid logo URL',
  'Earn rate cannot be negative',
  'Tax rate cannot be negative',
  'Maximum 50% tax rate',
  'Service charge cannot be negative',
  'Maximum 50% service charge',
  'Use a 3-letter currency code',
  'Enter a valid partner owner email',
  'Keep the contract title under 120 characters',
  'Keep the contract under 30000 characters',
  'Enter at least 20 characters for the contract document',
  'Enter a valid email',
]

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

describe('authenticated operations language isolation', () => {
  it('provides Spanish and Tagalog copy for every literal operations translation key', () => {
    const dynamicKeys = [
      ...Object.values(launchReadinessStatusLabels),
      ...rewardMeLaunchWorkstreams.flatMap((workstream) => [
        workstream.title,
        workstream.description,
        workstream.owner,
        workstream.nextAction,
        workstream.actionLabel ?? '',
      ]),
      ambassadorVipHeadline,
      ambassadorVipSupportingCopy,
      ...ambassadorCreatorSignals,
      ...ambassadorPerks.flatMap((perk) => [perk.title, perk.body]),
      ambassadorFormIntro,
      ambassadorSuccessTitle,
      ambassadorSuccessMessage,
      ambassadorPrimaryCta,
      ...adminFormValidationKeys,
    ].filter(Boolean)
    const keys = new Set([...adminSources.flatMap(literalTranslationKeys), ...dynamicKeys])
    const invariantKeys = new Set([
      'CSV',
      'JSON',
      'CVC',
      'ID',
      'ID:',
      'QR',
      'Email',
      'Instagram',
      'TikTok',
      'WhatsApp',
      'Regular',
      'Gold',
      'Harbor Roast',
      'harbor-roast',
    ])
    const spanishInvariants = new Set([...invariantKeys, 'Plan'])

    const missingSpanish = [...keys].filter((key) => !spanishInvariants.has(key) && translateForLanguage('es', key) === key)
    const missingTagalog = [...keys].filter((key) => !invariantKeys.has(key) && translateForLanguage('tl', key) === key)
    expect(missingSpanish, `missing Spanish operations copy:\n${missingSpanish.join('\n')}`).toEqual([])
    expect(missingTagalog, `missing Tagalog operations copy:\n${missingTagalog.join('\n')}`).toEqual([])
  })

  it('does not leak representative English operations vocabulary into translated views', () => {
    const keys = [
      'Membership operations',
      'Request queue',
      'Reward programs',
      'Program settings',
      'Signed Agreements',
      'Partner Management',
      'Admin Logs',
      'Recent audit history',
    ]
    const tagalog = keys.map((key) => translateForLanguage('tl', key)).join(' ')
    expect(tagalog).not.toMatch(/\b(membership|operations|request|queue|reward|programs?|settings|signed|agreements?|partner|management|admin|logs?|recent|audit|history)\b/i)
    const spanish = keys.map((key) => translateForLanguage('es', key)).join(' ')
    expect(spanish).not.toMatch(/\b(membership|operations|request|queue|reward|programs?|settings|signed|agreements?|partner|management|admin|logs?|recent|audit|history)\b/i)
  })

  it('routes high-risk operations labels, placeholders, aria labels, and toasts through translation', () => {
    const source = adminSources.map((file) => readFileSync(file, 'utf8')).join('\n')
    for (const hardCodedCopy of [
      '>Membership operations<',
      '>Signed Agreements<',
      '>Partner Management<',
      '>Admin Logs<',
      'placeholder="Reason required when rejecting an ID"',
      'ariaLabel="Agreement records pagination"',
      "toast.success('Business updated.')",
      "toast.error('ID number copied.')",
    ]) {
      expect(source).not.toContain(hardCodedCopy)
    }

    const adminPage = readFileSync(path.resolve('src/features/admin/pages/admin-page.tsx'), 'utf8')
    expect(adminPage).toContain('translatedMessage === error.message ? fallbackMessage : translatedMessage')
    expect(adminPage).not.toContain('error instanceof Error ? t(error.message)')
    expect(adminPage).not.toContain('`${label} must be between ${min} and ${max}.`')
    expect(adminPage).not.toMatch(/\{[a-zA-Z]+Form\.formState\.errors\.[a-zA-Z]+\.message\}/)
  })
})
