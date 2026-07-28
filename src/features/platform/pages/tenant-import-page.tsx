import { AlertTriangle, CheckCircle2, FileJson, Upload } from 'lucide-react'
import { type ChangeEvent, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { analyzeTenantImport, tenantImportCollections, type TenantImportAnalysis } from '@/lib/tenant-import'

export function TenantImportPage() {
  const [fileName, setFileName] = useState('')
  const [analysis, setAnalysis] = useState<TenantImportAnalysis | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  async function inspectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setParseError(null)
    try {
      setAnalysis(analyzeTenantImport(JSON.parse(await file.text())))
    } catch {
      setAnalysis(null)
      setParseError('The selected file is not valid JSON.')
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase text-[var(--muted-foreground)]">Migration workbench</p>
        <h1 className="mt-1 text-3xl font-semibold">Tenant import dry run</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">Inspect collection shapes, relationships, and financial totals locally. This page never writes to Supabase.</p>
      </header>

      <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center border-2 border-dashed border-[var(--border)] px-5 text-center hover:bg-[var(--muted)]/40">
        <Upload className="size-6" />
        <span className="mt-3 font-semibold">{fileName || 'Select tenant export JSON'}</span>
        <span className="mt-1 text-xs text-[var(--muted-foreground)]">The file is processed only in this browser.</span>
        <input className="sr-only" type="file" accept="application/json,.json" onChange={(event) => void inspectFile(event)} />
      </label>

      {parseError ? <p className="border-l-4 border-error pl-4 text-sm text-error">{parseError}</p> : null}

      {analysis ? (
        <>
          <section className="flex items-center gap-3 border-y border-[var(--border)] py-4">
            {analysis.valid ? <CheckCircle2 className="size-5 text-success" /> : <AlertTriangle className="size-5 text-error" />}
            <div><p className="font-semibold">{analysis.valid ? 'Dry run passed' : 'Dry run blocked'}</p><p className="text-sm text-[var(--muted-foreground)]">{analysis.valid ? 'The export is structurally ready for a controlled import.' : 'Correct every error before preparing an import batch.'}</p></div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {tenantImportCollections.map((collection) => <Metric key={collection} label={collection} value={analysis.counts[collection]} />)}
            <Metric label="Balance points" value={analysis.totals.balancePoints} />
            <Metric label="Transaction value" value={analysis.totals.transactionValue} />
            <Metric label="Gift cards outstanding" value={analysis.totals.giftCardOutstanding} />
          </section>

          <section>
            <h2 className="text-xl font-semibold">Detected columns</h2>
            <div className="mt-4 divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {tenantImportCollections.map((collection) => (
                <div className="grid gap-2 py-4 md:grid-cols-[140px_1fr]" key={collection}>
                  <p className="font-semibold capitalize">{collection}</p>
                  <div className="flex flex-wrap gap-2">{analysis.sourceColumns[collection].length ? analysis.sourceColumns[collection].map((column) => <Badge variant="outline" key={column}>{column}</Badge>) : <span className="text-sm text-[var(--muted-foreground)]">No columns</span>}</div>
                </div>
              ))}
            </div>
          </section>

          {analysis.errors.length || analysis.warnings.length ? (
            <section>
              <h2 className="text-xl font-semibold">Findings</h2>
              <div className="mt-4 space-y-2">
                {analysis.errors.map((error) => <p className="flex gap-2 text-sm text-error" key={error}><AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}</p>)}
                {analysis.warnings.map((warning) => <p className="flex gap-2 text-sm text-[var(--muted-foreground)]" key={warning}><FileJson className="mt-0.5 size-4 shrink-0" />{warning}</p>)}
              </div>
            </section>
          ) : null}

          <Button disabled title={analysis.valid ? 'Import execution requires an approved import RPC.' : 'Resolve dry-run errors first.'}>Create import batch</Button>
        </>
      ) : null}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="border-b border-[var(--border)] py-3"><p className="text-2xl font-semibold">{value.toLocaleString()}</p><p className="text-xs capitalize text-[var(--muted-foreground)]">{label}</p></div>
}
