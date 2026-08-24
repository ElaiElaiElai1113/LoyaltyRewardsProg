import { BarChart3, Gift, LoaderCircle, Plus, QrCode, Repeat2, TicketCheck, UsersRound } from 'lucide-react'
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
import {
  loyalityService,
  type LoyalityBusinessSnapshot,
  type LoyalityRewardKind,
} from '@/features/loyality/loyality-service'

type Builder = 'offer' | 'visit' | 'voucher' | 'raffle' | null

const inputClass = 'h-12 rounded-2xl'

function RewardKindSelect({ value, onChange }: { value: LoyalityRewardKind; onChange: (value: LoyalityRewardKind) => void }) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as LoyalityRewardKind)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="item">Specific item</SelectItem>
        <SelectItem value="amount">Dollar voucher</SelectItem>
        <SelectItem value="discount">Percentage discount</SelectItem>
      </SelectContent>
    </Select>
  )
}

function Metric({ value, label, icon: Icon }: { value: number; label: string; icon: typeof BarChart3 }) {
  return <div className="rounded-3xl border border-white/15 bg-white/8 p-4"><Icon className="size-5 text-[#ff6b4a]" /><strong className="mt-3 block text-3xl">{value}</strong><span className="text-xs font-bold uppercase tracking-wider text-white/60">{label}</span></div>
}

export function LoyalityBusinessGrowthPage() {
  const { business, isBusinessLoading } = useBusinessOwnerData()
  const [snapshot, setSnapshot] = useState<LoyalityBusinessSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [builder, setBuilder] = useState<Builder>(null)

  const load = useCallback(async () => {
    if (!business?.id) return
    setIsLoading(true)
    try { setSnapshot(await loyalityService.getBusinessSnapshot(business.id)) }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Loyality tools could not be loaded.') }
    finally { setIsLoading(false) }
  }, [business?.id])

  useEffect(() => { void load() }, [load])

  const activeOffer = useMemo(() => snapshot?.offers.find((offer) => offer.active) ?? null, [snapshot])
  const offerUrl = activeOffer && typeof window !== 'undefined' ? `${window.location.origin}/offer/${activeOffer.publicToken}?source=business` : ''

  if (isBusinessLoading || isLoading) return <LoadingState title="Opening Loyality" description="Loading offers, visit rules, vouchers, and customer activity." />
  if (!business || !snapshot) return <EmptyState title="Business setup required" description="Assign this account to the Loyality business before using its growth tools." />

  async function submit(action: () => Promise<unknown>) {
    setBusy(true)
    try { await action(); toast.success('Saved. The new rule is active.'); setBuilder(null); await load() }
    catch (error) { toast.error(error instanceof Error ? error.message : 'This item could not be saved.') }
    finally { setBusy(false) }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-7">
      <section className="rounded-[2rem] bg-[#173b3f] px-6 py-8 text-white shadow-xl lg:grid lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:px-10">
        <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#b9e769]">Private loyalty control room</p><h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">Turn today’s customer into the next visit.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-white/70">One business, one branded program. Create trackable offers, reward return visits, issue specific vouchers, and see what brings customers back.</p></div>
        <div className="mt-7 grid grid-cols-2 gap-3 lg:mt-0">
          <Metric value={snapshot.counts.claims} label="Offer claims" icon={UsersRound} />
          <Metric value={snapshot.counts.visits} label="Recorded visits" icon={Repeat2} />
          <Metric value={snapshot.counts.activeVouchers} label="Active vouchers" icon={Gift} />
          <Metric value={snapshot.counts.raffleEntries} label="Prize entries" icon={TicketCheck} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(330px,.85fr)]">
        <div className="rounded-[2rem] border border-[var(--border)] bg-card p-5 shadow-sm sm:p-7">
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#ff6b4a]">Start here</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Record a customer visit</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">Ask the customer to open their member QR. Scan it with your phone camera, enter the sale amount, and confirm. The visit count, rewards, and raffle entries update automatically.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row"><Link to="/business/members"><Button className="w-full rounded-full sm:w-auto"><QrCode />Find customer or use QR</Button></Link><Button variant="outline" className="w-full rounded-full sm:w-auto" onClick={() => setBuilder('voucher')}><Gift />Create voucher option</Button></div>
        </div>
        <div className="rounded-[2rem] border border-[var(--border)] bg-card p-5 shadow-sm sm:p-7">
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#ff6b4a]">Acquisition QR</p><h2 className="mt-2 text-2xl font-black">Share your active offer</h2>
          {offerUrl ? <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row"><div className="rounded-2xl bg-white p-3"><QRCodeSVG value={offerUrl} size={132} fgColor="#173b3f" level="H" /></div><div className="min-w-0"><strong>{activeOffer?.title}</strong><p className="mt-2 break-all text-xs text-[var(--muted-foreground)]">{offerUrl}</p><Button className="mt-3 rounded-full" size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(offerUrl); toast.success('Offer link copied.') }}>Copy link</Button></div></div> : <p className="mt-4 text-sm text-[var(--muted-foreground)]">Create an offer below to receive a trackable QR.</p>}
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--border)] bg-card p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#ff6b4a]">Simple builders</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Choose what you want to create</h2><p className="mt-2 text-sm text-[var(--muted-foreground)]">Each rule belongs only to this business.</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{([['offer','Offer'],['visit','Visit reward'],['voucher','Voucher'],['raffle','Raffle']] as const).map(([id,label]) => <Button key={id} variant={builder === id ? 'default' : 'outline'} className="rounded-full" onClick={() => setBuilder(id)}><Plus />{label}</Button>)}</div></div>
        {builder === 'offer' ? <OfferForm businessId={business.id} busy={busy} submit={submit} /> : null}
        {builder === 'visit' ? <VisitRuleForm businessId={business.id} busy={busy} submit={submit} /> : null}
        {builder === 'voucher' ? <VoucherForm businessId={business.id} busy={busy} submit={submit} /> : null}
        {builder === 'raffle' ? <RaffleForm businessId={business.id} busy={busy} submit={submit} /> : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <RuleList title="Acquisition offers" empty="No offers yet." rows={snapshot.offers.map((item) => ({ id: item.id, title: item.title, detail: item.rewardTitle, active: item.active, table: 'loyality_offers' as const }))} reload={load} />
        <RuleList title="Visit rewards" empty="No visit rules yet." rows={snapshot.visitRules.map((item) => ({ id: item.id, title: item.name, detail: `Visit ${item.triggerVisitCount}: ${item.rewardTitle}`, active: item.active, table: 'loyality_visit_rules' as const }))} reload={load} />
        <RuleList title="Voucher menu" empty="No voucher options yet." rows={snapshot.catalog.map((item) => ({ id: item.id, title: item.title, detail: `${item.pointsCost} points`, active: item.active, table: 'loyality_voucher_catalog' as const }))} reload={load} />
      </section>
    </div>
  )
}

type SubmitProps = { businessId: string; busy: boolean; submit: (action: () => Promise<unknown>) => Promise<void> }

function OfferForm({ businessId, busy, submit }: SubmitProps) {
  const [kind, setKind] = useState<LoyalityRewardKind>('item')
  function onSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); void submit(() => loyalityService.createOffer({ businessId, title: String(data.get('title')), description: String(data.get('description')), sourceLabel: String(data.get('source')), rewardTitle: String(data.get('rewardTitle')), rewardKind: kind, rewardValue: kind === 'item' ? null : Number(data.get('value')), rewardDescription: String(data.get('rewardDescription')) })) }
  return <BuilderForm onSubmit={onSubmit} busy={busy}><Field name="title" label="Offer name" placeholder="First visit offer" /><Field name="source" label="Source label" placeholder="Instagram, flyer, front desk…" /><WideField name="description" label="What customers see" placeholder="Claim this before your first visit." /><Field name="rewardTitle" label="Voucher name" placeholder="Welcome treat" /><div><Label>Voucher type</Label><RewardKindSelect value={kind} onChange={setKind} /></div>{kind !== 'item' ? <Field name="value" type="number" min="0" step="0.01" label={kind === 'amount' ? 'Dollar value' : 'Discount percent'} placeholder="10" /> : null}<WideField name="rewardDescription" label="Exactly what the voucher provides" placeholder="One complimentary welcome item." /></BuilderForm>
}

function VisitRuleForm({ businessId, busy, submit }: SubmitProps) {
  const [kind, setKind] = useState<LoyalityRewardKind>('item')
  function onSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); void submit(() => loyalityService.createVisitRule({ businessId, name: String(data.get('name')), triggerVisitCount: Number(data.get('visit')), repeatEvery: data.get('repeat') ? Number(data.get('repeat')) : null, rewardTitle: String(data.get('rewardTitle')), rewardKind: kind, rewardValue: kind === 'item' ? null : Number(data.get('value')), rewardDescription: String(data.get('description')) })) }
  return <BuilderForm onSubmit={onSubmit} busy={busy}><Field name="name" label="Rule name" placeholder="Seven-visit punch card" /><Field name="visit" type="number" min="1" label="Reward on visit number" placeholder="7" /><Field name="repeat" type="number" min="1" label="Repeat every (optional)" placeholder="7" /><Field name="rewardTitle" label="Voucher name" placeholder="Free signature item" /><div><Label>Voucher type</Label><RewardKindSelect value={kind} onChange={setKind} /></div>{kind !== 'item' ? <Field name="value" type="number" min="0" step="0.01" label="Value" placeholder="10" /> : null}<WideField name="description" label="Exactly what the customer receives" placeholder="One complimentary signature item." /></BuilderForm>
}

function VoucherForm({ businessId, busy, submit }: SubmitProps) {
  const [kind, setKind] = useState<LoyalityRewardKind>('item')
  function onSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); void submit(() => loyalityService.createCatalogItem({ businessId, title: String(data.get('title')), description: String(data.get('description')), voucherKind: kind, voucherValue: kind === 'item' ? null : Number(data.get('value')), pointsCost: Number(data.get('points')) })) }
  return <BuilderForm onSubmit={onSubmit} busy={busy}><Field name="title" label="Voucher name" placeholder="Signature item voucher" /><Field name="points" type="number" min="0" label="Points required" placeholder="100" /><div><Label>Voucher type</Label><RewardKindSelect value={kind} onChange={setKind} /></div>{kind !== 'item' ? <Field name="value" type="number" min="0" step="0.01" label="Value" placeholder="10" /> : null}<WideField name="description" label="What this voucher provides" placeholder="One specific item on a future visit." /></BuilderForm>
}

function RaffleForm({ businessId, busy, submit }: SubmitProps) {
  function onSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); void submit(() => loyalityService.createRaffle({ businessId, title: String(data.get('title')), prizeDescription: String(data.get('description')), minimumPurchase: Number(data.get('minimum')), entriesPerPurchase: Number(data.get('entries')), endsAt: new Date(String(data.get('endsAt'))).toISOString() })) }
  return <BuilderForm onSubmit={onSubmit} busy={busy}><Field name="title" label="Prize draw name" placeholder="Monthly customer thank-you" /><Field name="minimum" type="number" min="0" step="0.01" label="Minimum purchase" placeholder="25" /><Field name="entries" type="number" min="1" label="Entries per purchase" placeholder="1" /><Field name="endsAt" type="datetime-local" label="Closes on" /><WideField name="description" label="Prize" placeholder="Describe the exact prize." /></BuilderForm>
}

function BuilderForm({ children, onSubmit, busy }: { children: React.ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void; busy: boolean }) { return <form onSubmit={onSubmit} className="mt-6 grid gap-4 rounded-3xl bg-[var(--muted)]/55 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">{children}<div className="flex items-end"><Button className="h-12 w-full rounded-full" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : <Plus />}Create and activate</Button></div></form> }
function Field({ label, ...props }: React.ComponentProps<typeof Input> & { label: string }) { return <div><Label htmlFor={String(props.name)}>{label}</Label><Input id={String(props.name)} required className={inputClass} {...props} /></div> }
function WideField({ label, ...props }: React.ComponentProps<typeof Textarea> & { label: string }) { return <div className="sm:col-span-2 lg:col-span-3"><Label htmlFor={String(props.name)}>{label}</Label><Textarea id={String(props.name)} required {...props} /></div> }

function RuleList({ title, empty, rows, reload }: { title: string; empty: string; rows: Array<{ id: string; title: string; detail: string; active: boolean; table: 'loyality_offers' | 'loyality_visit_rules' | 'loyality_voucher_catalog' }>; reload: () => Promise<void> }) {
  return <div className="rounded-[2rem] border border-[var(--border)] bg-card p-5 shadow-sm"><h2 className="text-xl font-black">{title}</h2><div className="mt-4 space-y-3">{rows.length ? rows.map((row) => <div key={row.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] p-4"><div className="min-w-0"><strong className="block truncate">{row.title}</strong><span className="mt-1 block text-xs text-[var(--muted-foreground)]">{row.detail}</span></div><Button size="sm" variant={row.active ? 'outline' : 'default'} className="shrink-0 rounded-full" onClick={async () => { await loyalityService.setActive(row.table, row.id, !row.active); await reload() }}>{row.active ? 'Pause' : 'Activate'}</Button></div>) : <p className="text-sm text-[var(--muted-foreground)]">{empty}</p>}</div></div>
}
