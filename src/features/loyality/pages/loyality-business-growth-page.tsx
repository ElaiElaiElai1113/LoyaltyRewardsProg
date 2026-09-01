import { BarChart3, Gift, LoaderCircle, Pause, Play, Plus, QrCode, Repeat2, TicketCheck, Trash2, UsersRound, XCircle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingState } from '@/components/ui/loading-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useBusinessOwnerData } from '@/hooks/use-business-owner-data'
import { useLanguage } from '@/lib/language'
import {
  loyalityService,
  type LoyalityBusinessSnapshot,
  type LoyalityRewardKind,
} from '@/features/loyality/loyality-service'

type Builder = 'offer' | 'visit' | 'voucher' | 'raffle' | null

const inputClass = 'h-12 rounded-2xl'

function RewardKindSelect({ value, onChange }: { value: LoyalityRewardKind; onChange: (value: LoyalityRewardKind) => void }) {
  const { t } = useLanguage()
  return (
    <Select value={value} onValueChange={(next) => onChange(next as LoyalityRewardKind)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="item">{t('Specific item')}</SelectItem>
        <SelectItem value="amount">{t('Dollar voucher')}</SelectItem>
        <SelectItem value="discount">{t('Percentage discount')}</SelectItem>
      </SelectContent>
    </Select>
  )
}

function Metric({ value, label, icon: Icon }: { value: number; label: string; icon: typeof BarChart3 }) {
  const { t } = useLanguage()
  return <div className="rounded-3xl border border-white/15 bg-white/8 p-4"><Icon className="size-5 text-[#d8b36a]" /><strong className="mt-3 block text-3xl">{value}</strong><span className="text-xs font-bold uppercase tracking-wider text-white/60">{t(label)}</span></div>
}

export function LoyalityBusinessGrowthPage({ mode = 'manage' }: { mode?: 'overview' | 'manage' }) {
  const { business, isBusinessLoading } = useBusinessOwnerData()
  const { t } = useLanguage()
  const [snapshot, setSnapshot] = useState<LoyalityBusinessSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [builder, setBuilder] = useState<Builder>(null)

  const load = useCallback(async () => {
    if (!business?.id) return
    setIsLoading(true)
    try { setSnapshot(await loyalityService.getBusinessSnapshot(business.id)) }
    catch (error) { toast.error(error instanceof Error ? t(error.message) : t('Loyality tools could not be loaded.')) }
    finally { setIsLoading(false) }
  }, [business?.id, t])

  useEffect(() => { void load() }, [load])

  const activeOffer = useMemo(() => snapshot?.offers.find((offer) => offer.active) ?? null, [snapshot])
  const offerUrl = activeOffer && typeof window !== 'undefined' ? `${window.location.origin}/offer/${activeOffer.publicToken}?source=business` : ''

  if (isBusinessLoading || isLoading) return <LoadingState title={t('Opening Loyality')} description={t('Loading offers, visit rules, vouchers, and customer activity.')} />
  if (!business || !snapshot) return <EmptyState title={t('Business setup required')} description={t('Assign this account to the Loyality business before using its growth tools.')} />

  async function submit(action: () => Promise<unknown>) {
    setBusy(true)
    try { await action(); toast.success(t('Saved. The new rule is active.')); setBuilder(null); await load() }
    catch (error) { toast.error(error instanceof Error ? t(error.message) : t('This item could not be saved.')) }
    finally { setBusy(false) }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-7">
      <section className="rounded-[2rem] bg-[#1f3a2e] px-6 py-8 text-white shadow-xl lg:grid lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:px-10">
        <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#d8b36a]">{t('Private loyalty control room')}</p><h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">{t('Turn today’s customer into the next visit.')}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-white/70">{t('One business, one branded program. Create trackable offers, reward return visits, issue specific vouchers, and see what brings customers back.')}</p></div>
        <div className="mt-7 grid grid-cols-2 gap-3 lg:mt-0">
          <Metric value={snapshot.counts.claims} label="Offer claims" icon={UsersRound} />
          <Metric value={snapshot.counts.visits} label="Recorded visits" icon={Repeat2} />
          <Metric value={snapshot.counts.activeVouchers} label="Active vouchers" icon={Gift} />
          <Metric value={snapshot.counts.raffleEntries} label="Prize entries" icon={TicketCheck} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(330px,.85fr)]">
        <div className="rounded-[2rem] border border-[var(--border)] bg-card p-5 shadow-sm sm:p-7">
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#b8862e]">{t('Start here')}</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">{t('Record a customer visit')}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">{t('Ask the customer to open their member QR. Scan it with your phone camera, enter the sale amount, and confirm. The visit count, rewards, and raffle entries update automatically.')}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row"><Link to="/business/members"><Button className="w-full rounded-full sm:w-auto"><QrCode />{t('Find customer or use QR')}</Button></Link>{mode === 'manage' ? <Button variant="outline" className="w-full rounded-full sm:w-auto" onClick={() => setBuilder('voucher')}><Gift />{t('Create voucher option')}</Button> : null}</div>
        </div>
        <div className="rounded-[2rem] border border-[var(--border)] bg-card p-5 shadow-sm sm:p-7">
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#b8862e]">{t('Acquisition QR')}</p><h2 className="mt-2 text-2xl font-black">{t('Share your active offer')}</h2>
          {offerUrl ? <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row"><div className="rounded-2xl bg-white p-3"><QRCodeSVG value={offerUrl} size={132} fgColor="#1f3a2e" level="H" /></div><div className="min-w-0"><strong>{activeOffer?.title}</strong><p className="mt-2 break-all text-xs text-[var(--muted-foreground)]">{offerUrl}</p><Button className="mt-3 rounded-full" size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(offerUrl); toast.success(t('Offer link copied.')) }}>{t('Copy link')}</Button></div></div> : <p className="mt-4 text-sm text-[var(--muted-foreground)]">{t('Create an offer below to receive a trackable QR.')}</p>}
        </div>
      </section>

      {mode === 'manage' ? <>
      <section id="loyality-raffle-builder" className="scroll-mt-24 rounded-[2rem] border border-[var(--border)] bg-card p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#b8862e]">{t('Simple builders')}</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">{t('Choose what you want to create')}</h2><p className="mt-2 text-sm text-[var(--muted-foreground)]">{t('Each rule belongs only to this business.')}</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{([['offer','Offer'],['visit','Visit reward'],['voucher','Voucher'],['raffle','Raffle']] as const).map(([id,label]) => <Button key={id} variant={builder === id ? 'default' : 'outline'} className="rounded-full" onClick={() => setBuilder(id)}><Plus />{t(label)}</Button>)}</div></div>
        {builder === 'offer' ? <OfferForm businessId={business.id} busy={busy} submit={submit} /> : null}
        {builder === 'visit' ? <VisitRuleForm businessId={business.id} busy={busy} submit={submit} /> : null}
        {builder === 'voucher' ? <VoucherForm businessId={business.id} busy={busy} submit={submit} /> : null}
        {builder === 'raffle' ? <RaffleForm businessId={business.id} busy={busy} submit={submit} /> : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <RuleList title="Acquisition offers" empty="No offers yet." rows={snapshot.offers.map((item) => ({ id: item.id, title: item.title, detail: item.rewardTitle, active: item.active, table: 'loyality_offers' as const }))} reload={load} />
        <RuleList title="Visit rewards" empty="No visit rules yet." rows={snapshot.visitRules.map((item) => ({ id: item.id, title: item.name, detail: t('Visit {number}: {title}', { number: item.triggerVisitCount, title: item.rewardTitle }), active: item.active, table: 'loyality_visit_rules' as const }))} reload={load} />
        <RuleList title="Voucher menu" empty="No voucher options yet." rows={snapshot.catalog.map((item) => ({ id: item.id, title: item.title, detail: t('{points} points', { points: item.pointsCost }), active: item.active, table: 'loyality_voucher_catalog' as const }))} reload={load} />
      </section>

      <RaffleList rows={snapshot.raffles} reload={load} />
      </> : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t('Program status')}>
          <StatusCard label="Published offers" value={snapshot.offers.filter((item) => item.active).length} detail="Active private acquisition links" />
          <StatusCard label="Visit rewards" value={snapshot.visitRules.filter((item) => item.active).length} detail="Rules applied to recorded visits" />
          <StatusCard label="Voucher options" value={snapshot.catalog.filter((item) => item.active).length} detail="Rewards customers can work toward" />
          <StatusCard label="Prize draws" value={snapshot.raffles.filter((item) => item.status === 'active').length} detail="Currently accepting eligible entries" />
        </section>
      )}
    </div>
  )
}

function StatusCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  const { t } = useLanguage()
  return <article className="min-w-0 rounded-[2rem] border border-[var(--border)] bg-card p-5 shadow-sm"><span className="text-xs font-black uppercase tracking-[.14em] text-[#b8862e]">{t(label)}</span><strong className="mt-3 block text-4xl">{value}</strong><p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{t(detail)}</p></article>
}

type SubmitProps = { businessId: string; busy: boolean; submit: (action: () => Promise<unknown>) => Promise<void> }

function OfferForm({ businessId, busy, submit }: SubmitProps) {
  const [kind, setKind] = useState<LoyalityRewardKind>('item')
  function onSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); void submit(() => loyalityService.createOffer({ businessId, title: String(data.get('title')), description: String(data.get('description')), sourceLabel: String(data.get('source')), rewardTitle: String(data.get('rewardTitle')), rewardKind: kind, rewardValue: kind === 'item' ? null : Number(data.get('value')), rewardDescription: String(data.get('rewardDescription')) })) }
  return <BuilderForm onSubmit={onSubmit} busy={busy}><Field name="title" label="Offer name" placeholder="First visit offer" /><Field name="source" label="Source label" placeholder="Instagram, flyer, front desk…" /><WideField name="description" label="What customers see" placeholder="Claim this before your first visit." /><Field name="rewardTitle" label="Voucher name" placeholder="Welcome treat" /><div><TranslatedLabel text="Voucher type" /><RewardKindSelect value={kind} onChange={setKind} /></div>{kind !== 'item' ? <Field name="value" type="number" min="0" step="0.01" label={kind === 'amount' ? 'Dollar value' : 'Discount percent'} placeholder="10" /> : null}<WideField name="rewardDescription" label="Exactly what the voucher provides" placeholder="One complimentary welcome item." /></BuilderForm>
}

function VisitRuleForm({ businessId, busy, submit }: SubmitProps) {
  const [kind, setKind] = useState<LoyalityRewardKind>('item')
  function onSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); void submit(() => loyalityService.createVisitRule({ businessId, name: String(data.get('name')), triggerVisitCount: Number(data.get('visit')), repeatEvery: data.get('repeat') ? Number(data.get('repeat')) : null, rewardTitle: String(data.get('rewardTitle')), rewardKind: kind, rewardValue: kind === 'item' ? null : Number(data.get('value')), rewardDescription: String(data.get('description')) })) }
  return <BuilderForm onSubmit={onSubmit} busy={busy}><Field name="name" label="Rule name" placeholder="Seven-visit punch card" /><Field name="visit" type="number" min="1" label="Reward on visit number" placeholder="7" /><Field name="repeat" type="number" min="1" label="Repeat every (optional)" placeholder="7" /><Field name="rewardTitle" label="Voucher name" placeholder="Free signature item" /><div><TranslatedLabel text="Voucher type" /><RewardKindSelect value={kind} onChange={setKind} /></div>{kind !== 'item' ? <Field name="value" type="number" min="0" step="0.01" label="Value" placeholder="10" /> : null}<WideField name="description" label="Exactly what the customer receives" placeholder="One complimentary signature item." /></BuilderForm>
}

function VoucherForm({ businessId, busy, submit }: SubmitProps) {
  const [kind, setKind] = useState<LoyalityRewardKind>('item')
  function onSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); void submit(() => loyalityService.createCatalogItem({ businessId, title: String(data.get('title')), description: String(data.get('description')), voucherKind: kind, voucherValue: kind === 'item' ? null : Number(data.get('value')), pointsCost: Number(data.get('points')) })) }
  return <BuilderForm onSubmit={onSubmit} busy={busy}><Field name="title" label="Voucher name" placeholder="Signature item voucher" /><Field name="points" type="number" min="0" label="Points required" placeholder="100" /><div><TranslatedLabel text="Voucher type" /><RewardKindSelect value={kind} onChange={setKind} /></div>{kind !== 'item' ? <Field name="value" type="number" min="0" step="0.01" label="Value" placeholder="10" /> : null}<WideField name="description" label="What this voucher provides" placeholder="One specific item on a future visit." /></BuilderForm>
}

function RaffleForm({ businessId, busy, submit }: SubmitProps) {
  function onSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); void submit(() => loyalityService.createRaffle({ businessId, title: String(data.get('title')), prizeDescription: String(data.get('description')), minimumPurchase: Number(data.get('minimum')), entriesPerPurchase: Number(data.get('entries')), endsAt: new Date(String(data.get('endsAt'))).toISOString() })) }
  return <BuilderForm onSubmit={onSubmit} busy={busy}><Field name="title" label="Prize draw name" placeholder="Monthly customer thank-you" /><Field name="minimum" type="number" min="0" step="0.01" label="Minimum purchase" placeholder="25" /><Field name="entries" type="number" min="1" label="Entries per purchase" placeholder="1" /><Field name="endsAt" type="datetime-local" label="Closes on" /><WideField name="description" label="Prize" placeholder="Describe the exact prize." /></BuilderForm>
}

function BuilderForm({ children, onSubmit, busy }: { children: React.ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void; busy: boolean }) { const { t } = useLanguage(); return <form onSubmit={onSubmit} className="mt-6 grid gap-4 rounded-3xl bg-[var(--muted)]/55 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">{children}<div className="flex items-end"><Button className="h-12 w-full rounded-full" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : <Plus />}{t('Create and activate')}</Button></div></form> }
function TranslatedLabel({ text }: { text: string }) { const { t } = useLanguage(); return <Label>{t(text)}</Label> }
function Field({ label, placeholder, ...props }: React.ComponentProps<typeof Input> & { label: string }) { const { t } = useLanguage(); return <div><Label htmlFor={String(props.name)}>{t(label)}</Label><Input id={String(props.name)} required className={inputClass} placeholder={typeof placeholder === 'string' ? t(placeholder) : placeholder} {...props} /></div> }
function WideField({ label, placeholder, ...props }: React.ComponentProps<typeof Textarea> & { label: string }) { const { t } = useLanguage(); return <div className="sm:col-span-2 lg:col-span-3"><Label htmlFor={String(props.name)}>{t(label)}</Label><Textarea id={String(props.name)} required placeholder={typeof placeholder === 'string' ? t(placeholder) : placeholder} {...props} /></div> }

function RuleList({ title, empty, rows, reload }: { title: string; empty: string; rows: Array<{ id: string; title: string; detail: string; active: boolean; table: 'loyality_offers' | 'loyality_visit_rules' | 'loyality_voucher_catalog' }>; reload: () => Promise<void> }) {
  const { t } = useLanguage()
  return <div className="min-w-0 rounded-[2rem] border border-[var(--border)] bg-card p-5 shadow-sm"><h2 className="text-xl font-black">{t(title)}</h2><div className="mt-4 space-y-3">{rows.length ? rows.map((row) => <div key={row.id} className="flex min-w-0 flex-col items-stretch gap-3 rounded-2xl border border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><strong className="block truncate">{row.title}</strong><span className="mt-1 block break-words text-xs text-[var(--muted-foreground)]">{row.detail}</span></div><Button size="sm" variant={row.active ? 'outline' : 'default'} className="w-full rounded-full sm:w-auto sm:shrink-0" onClick={async () => { await loyalityService.setActive(row.table, row.id, !row.active); await reload() }}>{row.active ? t('Pause') : t('Activate')}</Button></div>) : <p className="text-sm text-[var(--muted-foreground)]">{t(empty)}</p>}</div></div>
}

function RaffleList({ rows, reload }: { rows: LoyalityBusinessSnapshot['raffles']; reload: () => Promise<void> }) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const { language, t } = useLanguage()
  const locale = language === 'es' ? 'es-ES' : language === 'tl' ? 'fil-PH' : 'en-US'

  async function update(id: string, action: () => Promise<void>, success: string) {
    setBusyId(id)
    try {
      await action()
      toast.success(success)
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? t(error.message) : t('This prize draw could not be updated.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-card p-5 shadow-sm sm:p-7">
      <p className="text-xs font-black uppercase tracking-[.18em] text-[#b8862e]">{t('Prize draws')}</p>
      <div className="mt-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-black tracking-[-.03em]">{t('Manage raffles')}</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t('Pause, reactivate, cancel, or remove an unused raffle.')}</p>
        </div>
        <Button className="w-full rounded-full sm:w-auto" variant="outline" onClick={() => document.getElementById('loyality-raffle-builder')?.scrollIntoView({ behavior: 'smooth' })}>
          <Plus /> {t('Create raffle')}
        </Button>
      </div>
      <div className="mt-5 space-y-3">
        {rows.length ? rows.map((row) => {
          const isBusy = busyId === row.id
          const canDelete = row.status !== 'active'
          return (
            <article key={row.id} className="grid gap-4 rounded-2xl border border-[var(--border)] p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-base">{row.title}</strong>
                  <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider">{t(row.status)}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{row.prizeDescription}</p>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">{t('Closes {date} · {count} {entries} per qualifying purchase', { date: new Date(row.endsAt).toLocaleString(locale), count: row.entriesPerPurchase, entries: t(row.entriesPerPurchase === 1 ? 'entry' : 'entries') })}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                {row.status === 'active' ? (
                  <Button size="sm" variant="outline" className="rounded-full" disabled={isBusy} onClick={() => void update(row.id, () => loyalityService.setRaffleStatus(row.id, 'draft'), t('Raffle paused.'))}><Pause /> {t('Pause')}</Button>
                ) : row.status === 'draft' ? (
                  <Button size="sm" className="rounded-full" disabled={isBusy} onClick={() => void update(row.id, () => loyalityService.setRaffleStatus(row.id, 'active'), t('Raffle active.'))}><Play /> {t('Activate')}</Button>
                ) : null}
                {(row.status === 'active' || row.status === 'draft') ? (
                  <Button size="sm" variant="outline" className="rounded-full" disabled={isBusy} onClick={() => void update(row.id, () => loyalityService.setRaffleStatus(row.id, 'cancelled'), t('Raffle cancelled.'))}><XCircle /> {t('Cancel')}</Button>
                ) : null}
                {canDelete ? (
                  <Button size="sm" variant="outline" className="rounded-full" disabled={isBusy} onClick={() => {
                    if (!window.confirm(t('Delete “{title}”? This is only allowed when no entries exist.', { title: row.title }))) return
                    void update(row.id, () => loyalityService.deleteRaffle(row.id), t('Unused raffle deleted.'))
                  }}><Trash2 /> {t('Delete')}</Button>
                ) : null}
              </div>
            </article>
          )
        }) : <p className="text-sm text-[var(--muted-foreground)]">{t('No raffles yet.')}</p>}
      </div>
    </section>
  )
}
