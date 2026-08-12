import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { programService } from '@/features/program/program-service'
import { useTenant } from '@/hooks/use-tenant'

export function ProgramBillingPage() {
  const { program } = useTenant()
  const [planAdministration, setPlanAdministration] = useState<Record<string, unknown> | null>(null)
  useEffect(() => { void programService.getPlanAdministration().then((value) => setPlanAdministration(value as Record<string, unknown> | null)).catch((error) => toast.error(error.message)) }, [])
  const planValue = planAdministration?.subscription_plans
  const plan = (Array.isArray(planValue) ? planValue[0] : planValue) as Record<string, unknown> | undefined
  return (
    <Card className="rounded-lg">
      <CardHeader><CardTitle>Plan administration</CardTitle><CardDescription>Access plan assigned to {program.name} by Rewards Platform operations.</CardDescription></CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div><p className="text-sm text-[var(--muted-foreground)]">Current plan</p><p className="text-xl font-semibold">{String(plan?.name ?? 'Not configured')}</p></div>
          <Badge variant={planAdministration?.status === 'active' ? 'tenant' : 'secondary'}>{String(planAdministration?.status ?? 'Needs assignment')}</Badge>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4">
          <Badge variant="outline">Managed by operations</Badge>
          <p className="mt-3 font-semibold">RewardMe does not collect payments online.</p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
            Plan assignments and access changes are handled directly by the Rewards Platform operations team. No card or payment details are collected from this page.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
