import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { programService } from '@/features/program/program-service'
import { useTenant } from '@/hooks/use-tenant'
import { useLanguage } from '@/lib/language'

type Translator = (text: string | null | undefined, values?: Record<string, string | number>) => string

function planAdministrationStatusLabel(status: unknown, t: Translator) {
  if (!status) return t('Needs assignment')
  if (status === 'incomplete') return t('Incomplete')
  if (status === 'trialing') return t('Trial')
  if (status === 'active') return t('Active')
  if (status === 'past_due') return t('Past due')
  if (status === 'canceled') return t('Canceled')
  if (status === 'unpaid') return t('Unpaid')
  return String(status).replaceAll('_', ' ')
}

export function ProgramBillingPage() {
  const { program } = useTenant()
  const { t } = useLanguage()
  const [planAdministration, setPlanAdministration] = useState<Record<string, unknown> | null>(null)
  useEffect(() => { void programService.getPlanAdministration().then((value) => setPlanAdministration(value as Record<string, unknown> | null)).catch(() => toast.error(t('Plan details could not be loaded.'))) }, [t])
  const planValue = planAdministration?.subscription_plans
  const plan = (Array.isArray(planValue) ? planValue[0] : planValue) as Record<string, unknown> | undefined
  return (
    <Card className="rounded-lg">
      <CardHeader><CardTitle>{t('Plan administration')}</CardTitle><CardDescription>{t('Access plan assigned to {program} by Rewards Platform operations.', { program: program.name })}</CardDescription></CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div><p className="text-sm text-[var(--muted-foreground)]">{t('Current plan')}</p><p className="text-xl font-semibold">{plan?.name ? String(plan.name) : t('Not configured')}</p></div>
          <Badge variant={planAdministration?.status === 'active' ? 'tenant' : 'secondary'}>{planAdministrationStatusLabel(planAdministration?.status, t)}</Badge>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4">
          <Badge variant="outline">{t('Managed by operations')}</Badge>
          <p className="mt-3 font-semibold">{t('RewardMe does not collect payments online.')}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
            {t('Plan assignments and access changes are handled directly by the Rewards Platform operations team. No card or payment details are collected from this page.')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
