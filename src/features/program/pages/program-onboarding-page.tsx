import { ArrowLeft, ArrowRight, Check, Palette, Settings2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { platformService } from '@/features/platform/platform-service'
import { tenantStorageKey } from '@/lib/tenant-storage'

const initialValues = {
  name: '',
  slug: '',
  countryCode: 'US',
  locale: 'en-US',
  currency: 'USD',
  timezone: 'UTC',
  primaryColor: '#176b5b',
  accentColor: '#f2b134',
  logoUrl: '',
  supportEmail: '',
  planCode: 'launch',
}

const planOptions = {
  launch: { administrators: 2, businesses: 10, members: 1000, domains: 1, storage: '2 GB' },
  growth: { administrators: 10, businesses: 100, members: 10000, domains: 3, storage: '10 GB' },
  scale: { administrators: 50, businesses: 1000, members: 100000, domains: 10, storage: '50 GB' },
} as const

export function ProgramOnboardingPage() {
  const [step, setStep] = useState(0)
  const [values, setValues] = useState<typeof initialValues>(() => {
    if (typeof window === 'undefined') return initialValues
    try {
      const stored = window.localStorage.getItem(tenantStorageKey('program-onboarding-draft'))
      return stored ? { ...initialValues, ...JSON.parse(stored) } : initialValues
    } catch {
      return initialValues
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [created, setCreated] = useState<{ id: string; hostname: string } | null>(null)
  const steps = ['Identity', 'Brand', 'Review']

  useEffect(() => {
    window.localStorage.setItem(tenantStorageKey('program-onboarding-draft'), JSON.stringify(values))
  }, [values])

  function update(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (step < steps.length - 1) {
      if (step === 0) {
        setIsSubmitting(true)
        try {
          if (!await platformService.isProgramSlugAvailable(values.slug)) {
            toast.error('That platform slug is already in use.')
            return
          }
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Program slug could not be checked.')
          return
        } finally {
          setIsSubmitting(false)
        }
      }
      setStep((current) => current + 1)
      return
    }
    setIsSubmitting(true)
    try {
      const id = await platformService.createProgram(values)
      window.localStorage.removeItem(tenantStorageKey('program-onboarding-draft'))
      setCreated({ id, hostname: `${values.slug}.rewardsplatform.app` })
      toast.success(`${values.name} was created.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The rewards program could not be created.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (created) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-5 py-12 text-[var(--foreground)]">
        <div className="mx-auto max-w-3xl">
          <Check className="size-10 text-success" />
          <h1 className="mt-5 text-3xl font-semibold">{values.name} is ready for configuration</h1>
          <p className="mt-3 text-[var(--muted-foreground)]">The program was created without billing and your account is its first program administrator.</p>
          <dl className="mt-8 divide-y divide-[var(--border)] border-y border-[var(--border)]">
            <Result label="Program ID" value={created.id} />
            <Result label="Platform hostname" value={created.hostname} />
            <Result label="Plan" value={values.planCode} />
            <Result label="Status" value="Draft" />
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild><Link to={`/program/settings?tenant=${encodeURIComponent(values.slug)}`}>Open program settings</Link></Button>
            <Button asChild variant="outline"><Link to="/">Return home</Link></Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-8 text-[var(--foreground)] sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header>
          <p className="text-sm font-semibold uppercase text-[var(--muted-foreground)]">New rewards program</p>
          <h1 className="mt-2 text-3xl font-semibold">Set up your program</h1>
          {values.name ? <p className="mt-2 text-sm text-[var(--muted-foreground)]">Draft progress is saved automatically on this device.</p> : null}
        </header>

        <div className="mt-8 grid grid-cols-3 border-y border-[var(--border)]">
          {steps.map((label, index) => (
            <div className="flex items-center gap-2 py-4 text-sm" key={label}>
              <span className={`flex size-7 items-center justify-center rounded-full border ${index <= step ? 'border-[var(--tenant-accent)] bg-[var(--tenant-accent-soft)]' : 'border-[var(--border)]'}`}>{index + 1}</span>
              <span className={index <= step ? 'font-semibold' : 'text-[var(--muted-foreground)]'}>{label}</span>
            </div>
          ))}
        </div>

        <form className="mt-8" onSubmit={submit}>
          {step === 0 ? (
            <section className="grid gap-5 md:grid-cols-2">
              <Field label="Program name"><Input required value={values.name} onChange={(event) => {
                const name = event.target.value
                setValues((current) => ({ ...current, name, slug: current.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))
              }} /></Field>
              <Field label="Platform slug"><Input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={values.slug} onChange={(event) => update('slug', event.target.value.toLowerCase())} /></Field>
              <Field label="Country code"><Input required maxLength={2} value={values.countryCode} onChange={(event) => update('countryCode', event.target.value.toUpperCase())} /></Field>
              <Field label="Currency"><Input required maxLength={3} value={values.currency} onChange={(event) => update('currency', event.target.value.toUpperCase())} /></Field>
              <Field label="Locale"><Input required value={values.locale} onChange={(event) => update('locale', event.target.value)} /></Field>
              <Field label="Timezone"><Input required value={values.timezone} onChange={(event) => update('timezone', event.target.value)} /></Field>
            </section>
          ) : null}

          {step === 1 ? (
            <section className="grid gap-5 md:grid-cols-2">
              <Field label="Support email"><Input required type="email" value={values.supportEmail} onChange={(event) => update('supportEmail', event.target.value)} /></Field>
              <Field label="Logo URL"><Input type="url" value={values.logoUrl} onChange={(event) => update('logoUrl', event.target.value)} /></Field>
              <Field label="Primary color"><Input type="color" value={values.primaryColor} onChange={(event) => update('primaryColor', event.target.value)} /></Field>
              <Field label="Accent color"><Input type="color" value={values.accentColor} onChange={(event) => update('accentColor', event.target.value)} /></Field>
              <div className="md:col-span-2 flex min-h-28 items-center gap-4 border-y border-[var(--border)] py-5" style={{ '--preview-primary': values.primaryColor, '--preview-accent': values.accentColor } as React.CSSProperties}>
                <span className="flex size-12 items-center justify-center rounded-full text-white" style={{ backgroundColor: values.primaryColor }}><Palette className="size-5" /></span>
                <div><p className="font-semibold">{values.name || 'Program preview'}</p><p className="text-sm" style={{ color: values.accentColor }}>Rewards, configured for your region</p></div>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="space-y-6">
              <Field label="Initial plan">
                <select className="h-12 w-full border border-[var(--border)] bg-[var(--card)] px-3 text-sm" value={values.planCode} onChange={(event) => update('planCode', event.target.value)}>
                  <option value="launch">Launch</option>
                  <option value="growth">Growth</option>
                  <option value="scale">Scale</option>
                </select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                {Object.entries(planOptions).map(([code, plan]) => (
                  <button type="button" className={`border p-4 text-left ${values.planCode === code ? 'border-[var(--tenant-accent)] bg-[var(--tenant-accent-soft)]' : 'border-[var(--border)]'}`} key={code} onClick={() => update('planCode', code)}>
                    <span className="font-semibold capitalize">{code}</span>
                    <span className="mt-3 block text-xs leading-5 text-[var(--muted-foreground)]">{plan.administrators} admins<br />{plan.businesses.toLocaleString()} businesses<br />{plan.members.toLocaleString()} members<br />{plan.domains} domains<br />{plan.storage} storage</span>
                  </button>
                ))}
              </div>
              <dl className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
                <Result label="Program" value={values.name} />
                <Result label="Platform hostname" value={`${values.slug}.rewardsplatform.app`} />
                <Result label="Region" value={`${values.countryCode} / ${values.currency} / ${values.timezone}`} />
                <Result label="Support" value={values.supportEmail} />
              </dl>
              <p className="text-sm text-[var(--muted-foreground)]">No payment is collected. Subscription billing remains inactive until it is configured separately.</p>
            </section>
          ) : null}

          <footer className="mt-10 flex items-center justify-between border-t border-[var(--border)] pt-6">
            <Button type="button" variant="ghost" disabled={step === 0 || isSubmitting} onClick={() => setStep((current) => current - 1)}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button disabled={isSubmitting}>
              {step === steps.length - 1 ? <Settings2 className="size-4" /> : null}
              {isSubmitting ? 'Creating...' : step === steps.length - 1 ? 'Create program' : 'Continue'}
              {step < steps.length - 1 ? <ArrowRight className="size-4" /> : null}
            </Button>
          </footer>
        </form>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}

function Result({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-1 py-4 sm:grid-cols-[180px_1fr]"><dt className="text-sm text-[var(--muted-foreground)]">{label}</dt><dd className="break-all text-sm font-semibold capitalize">{value}</dd></div>
}
