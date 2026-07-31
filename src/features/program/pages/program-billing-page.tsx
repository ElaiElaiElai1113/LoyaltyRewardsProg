import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { programService } from '@/features/program/program-service'
import { useTenant } from '@/hooks/use-tenant'

export function ProgramBillingPage() {
  const { program } = useTenant()
  const [billing, setBilling] = useState<Record<string, unknown> | null>(null)
  useEffect(() => { void programService.getBilling().then((value) => setBilling(value as Record<string, unknown>)).catch((error) => toast.error(error.message)) }, [])
  const planValue = billing?.subscription_plans
  const plan = (Array.isArray(planValue) ? planValue[0] : planValue) as Record<string, unknown> | undefined
  return (
    <Card className="rounded-lg">
      <CardHeader><CardTitle>Billing</CardTitle><CardDescription>SaaS subscription for {program.name}. Member billing remains separate.</CardDescription></CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div><p className="text-sm text-[var(--muted-foreground)]">Current plan</p><p className="text-xl font-semibold">{String(plan?.name ?? 'Not configured')}</p></div>
          <Badge variant={billing?.status === 'active' ? 'tenant' : 'secondary'}>{String(billing?.status ?? 'incomplete')}</Badge>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4">
          <Badge variant="outline">Managed offline</Badge>
          <p className="mt-3 font-semibold">Online billing is intentionally disabled.</p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
            Plan changes, renewals, and billing questions are handled directly by the Rewards Platform operations team. No payment is collected from this page.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
