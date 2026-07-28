import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { digest, metrics } from './tenant-export-metrics.mjs'

const [sourcePath, destinationPath, outputArg] = process.argv.slice(2)
if (!sourcePath || !destinationPath) {
  console.error('Usage: npm run ops:tenant:reconcile -- source.json destination.json [report.json]')
  process.exit(2)
}

const source = JSON.parse(await readFile(resolve(sourcePath), 'utf8'))
const destination = JSON.parse(await readFile(resolve(destinationPath), 'utf8'))
const sourceMetrics = metrics(source)
const destinationMetrics = metrics(destination)
const differences = []

for (const [name, count] of Object.entries(sourceMetrics.counts)) {
  if (count !== destinationMetrics.counts[name]) {
    differences.push({ metric: `${name}.count`, source: count, destination: destinationMetrics.counts[name] })
  }
}
for (const name of ['balancePoints', 'transactionValue', 'giftCardOutstanding', 'signedAgreements']) {
  if (Math.abs(sourceMetrics[name] - destinationMetrics[name]) > 0.005) {
    differences.push({ metric: name, source: sourceMetrics[name], destination: destinationMetrics[name] })
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  passed: differences.length === 0,
  source: { path: resolve(sourcePath), sha256: digest(source), metrics: sourceMetrics },
  destination: { path: resolve(destinationPath), sha256: digest(destination), metrics: destinationMetrics },
  differences,
}
const output = outputArg ? resolve(outputArg) : resolve(`tenant-reconciliation-${Date.now()}.json`)
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({ ...report, reportPath: output }, null, 2))
process.exit(report.passed ? 0 : 1)
