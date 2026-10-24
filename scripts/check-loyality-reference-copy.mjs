import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const inventory = JSON.parse(readFileSync(new URL('../tests/fixtures/loyality-reference-copy.json', import.meta.url)))
const home = readFileSync(new URL('../src/features/loyality/pages/loyality-home-page.tsx', import.meta.url), 'utf8')
const tree = ts.createSourceFile('home.tsx', home, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const strings = new Set()
function visit(node) {
  if (ts.isStringLiteralLike(node) || ts.isJsxText(node)) strings.add(node.text.replace(/\s+/g, ' ').trim())
  ts.forEachChild(node, visit)
}
visit(tree)
const copy = Object.values(inventory.sections).flat()
const missing = copy.filter(text => !strings.has(text))
assert.deepEqual(missing, [], `Missing supplied PDF copy: ${JSON.stringify(missing, null, 2)}`)
assert.doesNotMatch(home, /href="#"/)
const locale = readFileSync(new URL('../src/features/loyality/pages/loyality-home-copy.ts', import.meta.url), 'utf8')
const localeTree = ts.createSourceFile('copy.ts', locale, ts.ScriptTarget.Latest, true)
const translations = new Map()
function visitLocale(node) {
  if (ts.isPropertyAssignment(node) && ts.isStringLiteralLike(node.initializer)) translations.set(node.name.text, node.initializer.text)
  ts.forEachChild(node, visitLocale)
}
visitLocale(localeTree)
for (const text of copy) {
  assert.ok(translations.has(text), `Missing Loyality-only Spanish translation: ${text}`)
  if (text !== 'Harvest & Vine') assert.notEqual(translations.get(text), text)
}
console.log(`PASS: ${copy.length} source-derived English copy entries and scoped Spanish mappings; no inert placeholder links`)
