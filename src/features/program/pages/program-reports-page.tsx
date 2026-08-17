import { Download, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { programService, type ProgramReport } from '@/features/program/program-service'
import { useTenant } from '@/hooks/use-tenant'
import { useLanguage } from '@/lib/language'

export function ProgramReportsPage() {
  const { program } = useTenant()
  const { language, t } = useLanguage()
  const [report, setReport] = useState<ProgramReport | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try { setReport(await programService.getReport()) } catch {
      toast.error(t('Report could not be loaded.'))
    } finally { setLoading(false) }
  }, [t])

  useEffect(() => { void load() }, [load])

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
        <div><p className="text-sm text-[var(--muted-foreground)]">{t('Tenant reporting')}</p><h1 className="text-3xl font-semibold">{program.name}</h1></div>
        <div className="flex gap-2"><Button size="icon" variant="ghost" title={t('Refresh report')} aria-label={t('Refresh report')} onClick={() => void load()}><RefreshCw className="size-4" /></Button><Button variant="outline" disabled={!report} onClick={downloadCsv}><Download className="size-4" />CSV</Button></div>
      </header>
      {loading ? <p className="text-sm text-[var(--muted-foreground)]">{t('Loading report...')}</p> : null}
      {report ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label={t('Active members')} value={report.members} />
        <Metric label={t('Businesses')} value={report.businesses} />
        <Metric label={t('Transactions')} value={report.transactions} />
        <Metric label={t('Purchase volume')} value={formatCurrency(report.purchaseVolume, program.currency, language === 'es' ? 'es-CO' : language === 'tl' ? 'fil-PH' : program.locale)} />
        <Metric label={t('Points awarded')} value={report.pointsAwarded} />
        <Metric label={t('Commission owed')} value={formatCurrency(report.commissionOwed, program.currency, language === 'es' ? 'es-CO' : language === 'tl' ? 'fil-PH' : program.locale)} />
        <Metric label={t('Gift cards')} value={report.giftCards} />
        <Metric label={t('Gift-card points')} value={report.giftCardPoints} />
      </div> : null}
      <p className="border-t border-[var(--border)] pt-4 text-xs text-[var(--muted-foreground)]">{t('Snapshot generated from the active tenant only. Large historical exports will move to the approval-gated reporting RPC.')}</p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="border-b border-[var(--border)] py-4"><p className="text-2xl font-semibold">{typeof value === 'number' ? value.toLocaleString() : value}</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">{label}</p></div>
}

function formatCurrency(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
}
