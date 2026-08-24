import { Gift, LoaderCircle, Repeat2, Sparkles, TicketCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/hooks/use-auth'
import { useTenant } from '@/hooks/use-tenant'
import { formatCurrency } from '@/lib/utils'
import { loyalityService, type LoyalityCustomerSnapshot } from '@/features/loyality/loyality-service'

type TimelineItem = { id: string; date: string; title: string; body: string; kind: 'visit' | 'voucher' }

export function LoyalityActivityPage() {
  const { profile } = useAuth()
  const { program } = useTenant()
  const [snapshot, setSnapshot] = useState<LoyalityCustomerSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.id) return
    let active = true
    loyalityService.getCustomerSnapshot(profile.id)
      .then((data) => { if (active) setSnapshot(data) })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Visit history could not be loaded.') })
    return () => { active = false }
  }, [profile?.id])

  const timeline = useMemo<TimelineItem[]>(() => {
    if (!snapshot) return []
    const visits = snapshot.visits.map((visit) => ({
      id: `visit-${visit.id}`,
      date: visit.visitedAt,
      title: `Visit ${visit.visitNumber}`,
      body: `${formatCurrency(visit.purchaseAmount, program.currency, program.locale)} purchase recorded`,
      kind: 'visit' as const,
    }))
    const vouchers = snapshot.vouchers.map((voucher) => ({
      id: `voucher-${voucher.id}`,
      date: voucher.redeemedAt ?? voucher.issuedAt,
      title: voucher.status === 'redeemed' ? 'Voucher used' : 'Voucher unlocked',
      body: voucher.title,
      kind: 'voucher' as const,
    }))
    return [...visits, ...vouchers].sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
  }, [program.currency, program.locale, snapshot])

  if (!snapshot && !error) return <div className="ly-history-loading"><LoaderCircle className="animate-spin" /><p>Building your Loyality story…</p></div>

  return (
    <div className="ly-history-page">
      <header className="ly-history-hero">
        <div><p>Relationship history</p><h1>Every return tells a story.</h1><span>Visits and vouchers are arranged in one simple timeline. New scans appear here automatically.</span></div>
        <div className="ly-history-score">
          <Repeat2 /><strong>{snapshot?.visits[0]?.visitNumber ?? 0}</strong><span>recorded visits</span>
        </div>
      </header>

      {error ? <EmptyState title="History unavailable" description={error} /> : timeline.length ? (
        <section className="ly-timeline">
          {timeline.map((item, index) => (
            <article className="ly-timeline__item" key={item.id}>
              <div className={`ly-timeline__marker ly-timeline__marker--${item.kind}`}>{item.kind === 'visit' ? <Repeat2 /> : <Gift />}</div>
              <div className="ly-timeline__date"><strong>{new Intl.DateTimeFormat(program.locale, { month: 'short', day: 'numeric' }).format(new Date(item.date))}</strong><span>{new Intl.DateTimeFormat(program.locale, { year: 'numeric' }).format(new Date(item.date))}</span></div>
              <div className="ly-timeline__copy"><small>{item.kind === 'visit' ? 'Customer visit' : 'Voucher moment'}</small><h2>{item.title}</h2><p>{item.body}</p></div>
              <span className="ly-timeline__number">{String(index + 1).padStart(2, '0')}</span>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState icon={<Sparkles />} title="Your story begins with the first scan" description="Show your member QR on your next visit. The visit and any reward progress will appear here." />
      )}

      <footer className="ly-history-footer"><TicketCheck /><p><strong>Nothing to calculate.</strong><span>Loyality records successful visits and voucher moments for you.</span></p></footer>
    </div>
  )
}
