import { readdir, stat } from 'node:fs/promises'
import { extname, join, relative, resolve } from 'node:path'

const root = resolve('dist')
const limits = {
  '.js': 500 * 1024,
  '.css': 200 * 1024,
  '.png': 1.5 * 1024 * 1024,
  '.jpg': 1.5 * 1024 * 1024,
  '.jpeg': 1.5 * 1024 * 1024,
  '.webp': 1.5 * 1024 * 1024,
}
const files = []
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) await visit(path)
    else files.push({ path: relative(root, path), bytes: (await stat(path)).size })
  }
}
await visit(root)
const violations = files
  .filter((file) => limits[extname(file.path)] && file.bytes > limits[extname(file.path)])
  .map((file) => ({ ...file, limit: limits[extname(file.path)] }))
const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0)
const passed = violations.length === 0 && totalBytes <= 12 * 1024 * 1024
console.log(JSON.stringify({ passed, totalBytes, totalLimit: 12 * 1024 * 1024, violations }, null, 2))
process.exit(passed ? 0 : 1)
