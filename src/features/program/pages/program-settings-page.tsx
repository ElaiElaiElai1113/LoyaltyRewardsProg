import { Copy, Globe2, Trash2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { programService, type ProgramAdminSettings, type ProgramDomain } from '@/features/program/program-service'
import { usePagination } from '@/hooks/use-pagination'
import { getCustomDomainCount, isPlatformHostname } from '@/lib/program-domain'
import { useLanguage } from '@/lib/language'

type Translator = (text: string | null | undefined, values?: Record<string, string | number>) => string

function programDomainStatusLabel(status: string, t: Translator) {
  if (status === 'verified') return t('Verified')
  if (status === 'failed') return t('Failed')
  if (status === 'pending') return t('Pending')
  return status.replaceAll('_', ' ')
}

export function ProgramSettingsPage() {
  const { t } = useLanguage()
  const [values, setValues] = useState<ProgramAdminSettings | null>(null)
  const [domains, setDomains] = useState<ProgramDomain[]>([])
  const [domainLimit, setDomainLimit] = useState(0)
  const [newDomain, setNewDomain] = useState('')
  const [domainBusy, setDomainBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const domainPagination = usePagination(domains, 5)

  async function loadDomains() {
    const result = await programService.listDomains()
    setDomains(result.domains)
    setDomainLimit(Number(result.entitlements.customDomains ?? 0))
  }

  useEffect(() => {
    void programService.getAdminSettings().then(setValues).catch(() => toast.error(t('Program settings could not be loaded.')))
    void loadDomains().catch(() => toast.error(t('Domains could not be loaded.')))
  }, [t])
  if (!values) return <p className="text-sm text-[var(--muted-foreground)]">{t('Loading program settings...')}</p>

  function field<K extends keyof ProgramAdminSettings>(key: K, value: ProgramAdminSettings[K]) {
    setValues((current) => current ? { ...current, [key]: value } : current)
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!values) return
    setSaving(true)
    try {
      await programService.updateAdminSettings(values)
      toast.success(t('Program settings saved.'))
    } catch {
      toast.error(t('Settings could not be saved.'))
    } finally {
      setSaving(false)
    }
  }

  async function addDomain(event: FormEvent) {
    event.preventDefault()
    setDomainBusy(true)
    try {
      await programService.addDomain(newDomain)
      setNewDomain('')
      await loadDomains()
      toast.success(t('Domain added. Add the displayed TXT record before verification.'))
    } catch {
      toast.error(t('Domain could not be added.'))
    } finally {
      setDomainBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-lg">
        <CardHeader><CardTitle>{t('Program settings')}</CardTitle><CardDescription>{t('Brand, regional, reward, and email defaults for this rewards program.')}</CardDescription></CardHeader>
        <CardContent>
          <form className="grid gap-5 md:grid-cols-2" onSubmit={submit}>
          <Field label={t('Program name')}><Input required value={values.name} onChange={(e) => field('name', e.target.value)} /></Field>
          <Field label={t('Support email')}><Input required type="email" value={values.supportEmail} onChange={(e) => field('supportEmail', e.target.value)} /></Field>
          <Field label={t('Country code')}><Input required maxLength={2} value={values.countryCode} onChange={(e) => field('countryCode', e.target.value.toUpperCase())} /></Field>
          <Field label={t('Currency')}><Input required maxLength={3} value={values.currency} onChange={(e) => field('currency', e.target.value.toUpperCase())} /></Field>
          <Field label={t('Locale')}><Input required value={values.locale} onChange={(e) => field('locale', e.target.value)} /></Field>
          <Field label={t('Timezone')}><Input required value={values.timezone} onChange={(e) => field('timezone', e.target.value)} /></Field>
          <Field label={t('Primary color')}><Input type="color" value={values.primaryColor} onChange={(e) => field('primaryColor', e.target.value)} /></Field>
          <Field label={t('Accent color')}><Input type="color" value={values.accentColor} onChange={(e) => field('accentColor', e.target.value)} /></Field>
          <Field label={t('Logo URL')}><Input value={values.logoUrl} onChange={(e) => field('logoUrl', e.target.value)} /></Field>
          <Field label={t('Reward name')}><Input required value={values.rewardName} onChange={(e) => field('rewardName', e.target.value)} /></Field>
          <Field label={t('Default earn rate')}><Input required type="number" min="0" step="0.01" value={values.defaultEarnRate} onChange={(e) => field('defaultEarnRate', Number(e.target.value))} /></Field>
          <Field label={t('Referral bonus')}><Input required type="number" min="0" value={values.referralBonus} onChange={(e) => field('referralBonus', Number(e.target.value))} /></Field>
          <Field label={t('Member price (cents)')}><Input required type="number" min="0" value={values.membershipPriceCents} onChange={(e) => field('membershipPriceCents', Number(e.target.value))} /></Field>
          <Field label={t('Email sender name')}><Input value={values.emailFromName} onChange={(e) => field('emailFromName', e.target.value)} /></Field>
          <Field label={t('Email sender address')}><Input type="email" value={values.emailFromAddress} onChange={(e) => field('emailFromAddress', e.target.value)} /></Field>
          <div className="flex items-end"><Button disabled={saving}>{saving ? t('Saving...') : t('Save settings')}</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>{t('Domains')}</CardTitle>
          <CardDescription>{t('Connect custom hostnames and prove ownership with a DNS TXT record. Custom domains used: {used} of {limit}.', { used: getCustomDomainCount(domains.map((domain) => domain.hostname)), limit: domainLimit })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={addDomain}>
            <Input aria-label={t('Custom domain')} required placeholder="rewards.example.com" value={newDomain} onChange={(event) => setNewDomain(event.target.value)} />
            <Button disabled={domainBusy || domainLimit === 0}>
              <Globe2 className="size-4" />
              {domainBusy ? t('Adding...') : t('Add domain')}
            </Button>
          </form>
          <div className="divide-y divide-[var(--border)]">
            {domainPagination.pageItems.map((domain) => (
              <div className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center" key={domain.id}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{domain.hostname}</p>
                    {domain.isPrimary ? <Badge variant="secondary">{t('Primary')}</Badge> : null}
                    <Badge variant={domain.verificationStatus === 'verified' ? 'success' : 'outline'}>{programDomainStatusLabel(domain.verificationStatus, t)}</Badge>
                  </div>
                  {domain.verificationStatus !== 'verified' ? (
                    <p className="mt-2 break-all text-xs text-[var(--muted-foreground)]">
                      TXT _rewards-verification.{domain.hostname} = {domain.verificationToken}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  {domain.verificationStatus !== 'verified' ? (
                    <Button type="button" size="icon" variant="ghost" title={t('Copy verification token')} aria-label={t('Copy verification token')} onClick={() => void navigator.clipboard.writeText(domain.verificationToken).then(() => toast.success(t('Verification token copied.')))}>
                      <Copy className="size-4" />
                    </Button>
                  ) : null}
                  {!domain.isPrimary && !isPlatformHostname(domain.hostname) ? (
                    <Button type="button" size="icon" variant="ghost" title={t('Remove domain')} aria-label={t('Remove domain')} onClick={() => void programService.removeDomain(domain).then(loadDomains).catch(() => toast.error(t('Domain could not be removed.')))}>
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <PaginationControls ariaLabel={t('Program domains pagination')} {...domainPagination} onPageChange={domainPagination.setPage} />
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}
