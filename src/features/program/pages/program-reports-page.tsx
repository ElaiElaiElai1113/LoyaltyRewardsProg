import { Download, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { programService, type ProgramReport } from '@/features/program/program-service'
import { useTenant } from '@/hooks/use-tenant'

export function ProgramReportsPage() {
  const { program } = useTenant()
  const [report, setReport] = useState<ProgramReport | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try { setReport(await programService.getReport()) } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Report could not be loaded.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  function downloadCsv() {
    if (!report) return
    const csv = ['metric,value', ...Object.entries(report).map(([key, value]) => `${key},${value}`)].join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    link.download = `${program.slug}-report-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-sm text-[var(--muted-foreground)]">Tenant reporting</p><h1 className="text-3xl font-semibold">{program.name}</h1></div>
        <div className="flex gap-2"><Button size="icon" variant="ghost" title="Refresh report" onClick={() => void load()}><RefreshCw className="size-4" /></Button><Button variant="outline" disabled={!report} onClick={downloadCsv}><Download className="size-4" />CSV</Button></div>
      </header>
      {loading ? <p className="text-sm text-[var(--muted-foreground)]">Loading report...</p> : null}
      {report ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active members" value={report.members} />
        <Metric label="Businesses" value={report.businesses} />
        <Metric label="Transactions" value={report.transactions} />
        <Metric label="Purchase volume" value={formatCurrency(report.purchaseVolume, program.currency, program.locale)} />
        <Metric label="Points awarded" value={report.pointsAwarded} />
        <Metric label="Commission owed" value={formatCurrency(report.commissionOwed, program.currency, program.locale)} />
        <Metric label="Gift cards" value={report.giftCards} />
        <Metric label="Gift-card points" value={report.giftCardPoints} />
      </div> : null}
      <p className="border-t border-[var(--border)] pt-4 text-xs text-[var(--muted-foreground)]">Snapshot generated from the active tenant only. Large historical exports will move to the approval-gated reporting RPC.</p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="border-b border-[var(--border)] py-4"><p className="text-2xl font-semibold">{typeof value === 'number' ? value.toLocaleString() : value}</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">{label}</p></div>
}

function formatCurrency(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
}
