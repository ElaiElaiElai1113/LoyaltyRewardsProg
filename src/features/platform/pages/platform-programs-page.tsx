import { Building2, CheckCircle2, Globe2, Plus, Search, Users } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { platformService, type PlatformProgram } from '@/features/platform/platform-service'
import { platformBrand } from '@/features/platform/platform-brand'

const defaults = {
  name: '',
  slug: '',
  countryCode: 'US',
  locale: 'en-US',
  currency: 'USD',
  timezone: 'UTC',
  planCode: 'launch',
}

export function PlatformProgramsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [programs, setPrograms] = useState<PlatformProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? 'all')
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'name')
  const [page, setPage] = useState(Math.max(1, Number(searchParams.get('page') ?? 1)))
  const [selected, setSelected] = useState<PlatformProgram | null>(null)
  const [form, setForm] = useState(defaults)

  async function loadPrograms() {
    setIsLoading(true)
    setPrograms(await platformService.listPrograms())
    setIsLoading(false)
  }

  useEffect(() => {
    void loadPrograms()
  }, [])
  useEffect(() => {
    const next = new URLSearchParams()
    if (query) next.set('q', query)
    if (statusFilter !== 'all') next.set('status', statusFilter)
    if (sort !== 'name') next.set('sort', sort)
    if (page > 1) next.set('page', String(page))
    setSearchParams(next, { replace: true })
  }, [page, query, setSearchParams, sort, statusFilter])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setIsCreating(true)
    try {
      const programId = await platformService.createProgram(form)
      toast.success(`${form.name} was provisioned.`)
      setForm(defaults)
      setShowForm(false)
      await loadPrograms()
      toast.message(`Program ID: ${programId}`, {
        description: 'Billing is deferred. The platform subdomain can be configured now.',
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Program could not be created.')
    } finally {
      setIsCreating(false)
    }
  }

  async function toggleStatus(program: PlatformProgram) {
    const nextStatus = program.status === 'active' ? 'suspended' : 'active'
    if (nextStatus === 'suspended' && !window.confirm(`Suspend ${program.name}? Members and tenant administrators will lose operational access.`)) return
    try {
      await platformService.updateProgramStatus(program.id, nextStatus)
      toast.success(`${program.name} is now ${nextStatus}.`)
      await loadPrograms()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Program status could not be updated.')
    }
  }

  const filteredPrograms = programs.filter((program) => {
    const matchesQuery = `${program.name} ${program.slug} ${program.primaryDomain ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())
    const matchesStatus = statusFilter === 'all' || program.status === statusFilter
    return matchesQuery && matchesStatus
  }).sort((left, right) => left.slug === 'pinas'
    ? -1
    : right.slug === 'pinas'
      ? 1
      : sort === 'status'
    ? left.status.localeCompare(right.status) || left.name.localeCompare(right.name)
    : sort === 'plan'
      ? left.planName.localeCompare(right.planName) || left.name.localeCompare(right.name)
      : left.name.localeCompare(right.name))
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filteredPrograms.length / pageSize))
  const visiblePrograms = filteredPrograms.slice((Math.min(page, totalPages) - 1) * pageSize, Math.min(page, totalPages) * pageSize)

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--muted-foreground)]">{platformBrand.name}</p>
          <h1 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">Reward programs</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">
            Manage tenant lifecycle, domains, plans, and operational access.
          </p>
        </div>
        <Button onClick={() => setShowForm((value) => !value)}>
          <Plus className="size-4" />
          New program
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Programs" value={programs.length} icon={Building2} />
        <Metric label="Active" value={programs.filter((item) => item.status === 'active').length} icon={CheckCircle2} />
        <Metric label="Verified domains" value={programs.filter((item) => item.domainStatus === 'verified').length} icon={Globe2} />
        <Metric label="Configured plans" value={programs.filter((item) => item.planName !== 'No plan').length} icon={Users} />
      </div>

      {showForm ? (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Provision a rewards program</CardTitle>
            <CardDescription>The tenant starts in draft status with a platform subdomain and incomplete subscription.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5 md:grid-cols-2 lg:grid-cols-4" onSubmit={submit}>
              <Field label="Program name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })} /></Field>
              <Field label="Slug"><Input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} /></Field>
              <Field label="Country code"><Input required maxLength={2} value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value.toUpperCase() })} /></Field>
              <Field label="Currency"><Input required maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} /></Field>
              <Field label="Locale"><Input required value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })} /></Field>
              <Field label="Timezone"><Input required value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} /></Field>
              <Field label="Plan">
                <select className="h-12 w-full rounded-lg border border-[var(--border)] bg-card px-3 text-sm" value={form.planCode} onChange={(e) => setForm({ ...form, planCode: e.target.value })}>
                  <option value="launch">Launch</option><option value="growth">Growth</option><option value="scale">Scale</option>
                </select>
              </Field>
              <div className="flex items-end"><Button className="w-full" disabled={isCreating}>{isCreating ? 'Provisioning...' : 'Create program'}</Button></div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3 border-y border-[var(--border)] py-4 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-[var(--muted-foreground)]" />
          <Input aria-label="Search programs" className="pl-9" placeholder="Search program, slug, or domain" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} />
        </label>
        <select aria-label="Filter program status" className="h-12 border border-[var(--border)] bg-[var(--card)] px-3 text-sm" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="archived">Archived</option>
        </select>
        <select aria-label="Sort programs" className="h-12 border border-[var(--border)] bg-[var(--card)] px-3 text-sm" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }}>
          <option value="name">Sort: Name</option>
          <option value="status">Sort: Status</option>
          <option value="plan">Sort: Plan</option>
        </select>
      </div>

      <Card className="overflow-hidden rounded-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)]">
                <tr><th className="px-5 py-3">Program</th><th className="px-5 py-3">Region</th><th className="px-5 py-3">Domain</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Subscription</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Access</th></tr>
              </thead>
              <tbody>
                {visiblePrograms.map((program) => (
                  <tr key={program.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="size-3 rounded-full" style={{ backgroundColor: program.primaryColor }} /><div><p className="font-semibold">{program.name}{program.slug === 'pinas' ? <Badge className="ml-2 align-middle" variant="tenant">Flagship</Badge> : null}</p><p className="text-xs text-[var(--muted-foreground)]">{program.slug}</p></div></div></td>
                    <td className="px-5 py-4">{program.countryCode} · {program.currency}</td>
                    <td className="px-5 py-4"><p>{program.primaryDomain ?? 'Not assigned'}</p><p className="text-xs capitalize text-[var(--muted-foreground)]">{program.domainStatus}</p></td>
                    <td className="px-5 py-4">{program.planName}</td>
                    <td className="px-5 py-4 capitalize">{program.subscriptionStatus.replace('_', ' ')}</td>
                    <td className="px-5 py-4"><Badge variant={program.status === 'active' ? 'tenant' : 'secondary'}>{program.status}</Badge></td>
                    <td className="px-5 py-4"><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setSelected(program)}>Details</Button><Button variant="ghost" size="sm" onClick={() => void toggleStatus(program)}>{program.status === 'active' ? 'Suspend' : 'Activate'}</Button></div></td>
                  </tr>
                ))}
                {!isLoading && visiblePrograms.length === 0 ? <tr><td colSpan={7} className="px-5 py-12 text-center text-[var(--muted-foreground)]"><p>No programs match these filters.</p><Button className="mt-4" variant="outline" size="sm" onClick={() => { setQuery(''); setStatusFilter('all'); setPage(1) }}>Clear filters</Button></td></tr> : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {filteredPrograms.length > pageSize ? <div className="flex items-center justify-between"><p className="text-sm text-[var(--muted-foreground)]">Page {Math.min(page, totalPages)} of {totalPages}</p><div className="flex gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div> : null}

      {selected ? (
        <section className="border-y border-[var(--border)] py-6" aria-label={`${selected.name} usage`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-sm text-[var(--muted-foreground)]">Tenant usage</p><h2 className="text-2xl font-semibold">{selected.name}</h2></div>
            <Button size="icon" variant="ghost" title="Close tenant details" onClick={() => setSelected(null)}>×</Button>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            <Usage label="Administrators" value={selected.usage.administrators} limit={selected.entitlements.administrators} />
            <Usage label="Businesses" value={selected.usage.businesses} limit={selected.entitlements.businesses} />
            <Usage label="Members" value={selected.usage.members} limit={selected.entitlements.members} />
            <Usage label="Custom domains" value={selected.usage.customDomains} limit={selected.entitlements.customDomains} />
            <Usage label="Storage" value={selected.usage.storageMb} limit={selected.entitlements.storageMb} unit=" MB" />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {Object.entries(selected.entitlements.features).map(([feature, enabled]) => <Badge key={feature} variant={enabled ? 'success' : 'outline'}>{feature}: {enabled ? 'on' : 'off'}</Badge>)}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return <div className="flex items-center gap-4 border-b border-[var(--border)] py-4"><Icon className="size-5 text-[var(--tenant-accent)]" /><div><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-[var(--muted-foreground)]">{label}</p></div></div>
}

function Usage({ label, value, limit, unit = '' }: { label: string; value: number | null; limit: number; unit?: string }) {
  const knownValue = value ?? 0
  const percentage = limit > 0 ? Math.min(100, Math.round((knownValue / limit) * 100)) : 0
  return <div><div className="flex justify-between gap-3 text-sm"><span>{label}</span><span className="font-semibold">{value === null ? 'Unavailable' : `${value}${unit} / ${limit}${unit}`}</span></div><div className="mt-2 h-2 overflow-hidden bg-[var(--muted)]"><div className="h-full bg-[var(--tenant-accent)]" style={{ width: `${percentage}%` }} /></div></div>
}
