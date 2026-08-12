import { AlertTriangle, ArrowUpRight, CheckCircle2, CircleDot, KeyRound, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  launchReadinessStatusLabels,
  rewardMeLaunchWorkstreams,
  summarizeLaunchReadiness,
  type LaunchReadinessStatus,
} from '@/features/platform/launch-readiness'

const statusPresentation: Record<LaunchReadinessStatus, { icon: typeof CheckCircle2; iconClass: string; badgeClass: string }> = {
  verified: { icon: CheckCircle2, iconClass: 'text-success', badgeClass: 'border-success/25 bg-success/10 text-success' },
  ready: { icon: CircleDot, iconClass: 'text-primary', badgeClass: 'border-primary/25 bg-primary/10 text-primary' },
  'approval-required': { icon: AlertTriangle, iconClass: 'text-warning', badgeClass: 'border-warning/25 bg-warning/10 text-warning' },
  'external-required': { icon: KeyRound, iconClass: 'text-on-surface-variant', badgeClass: 'border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]' },
}

export function LaunchReadinessPage() {
  const summary = summarizeLaunchReadiness()
  return (
    <div className="space-y-8" data-launch-readiness-dashboard>
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-primary"><ShieldCheck className="size-4" />RewardMe control register</div>
          <h1 className="mt-2 font-serif text-4xl text-primary sm:text-5xl">Launch readiness</h1>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-on-surface-variant/80 sm:text-base">A truthful view of what is verified, executable now, awaiting business approval, or waiting for production inputs. Approval-gated work never becomes active from this page.</p>
        </div>
        <Badge variant="outline" className="w-fit normal-case tracking-normal">Updated 12 Aug 2026</Badge>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Readiness summary">
        <SummaryMetric label="Verified" value={summary.verified} status="verified" />
        <SummaryMetric label="Ready to execute" value={summary.ready} status="ready" />
        <SummaryMetric label="Needs approval" value={summary['approval-required']} status="approval-required" />
        <SummaryMetric label="Needs external input" value={summary['external-required']} status="external-required" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="RewardMe launch workstreams">
        {rewardMeLaunchWorkstreams.map((workstream) => {
          const presentation = statusPresentation[workstream.status]
          const StatusIcon = presentation.icon
          return (
            <Card className="rounded-[1.5rem]" key={workstream.id} data-readiness-status={workstream.status}>
              <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="flex items-start gap-3 text-xl"><StatusIcon className={`mt-0.5 size-5 shrink-0 ${presentation.iconClass}`} />{workstream.title}</CardTitle>
                  <CardDescription className="mt-3 leading-6">{workstream.description}</CardDescription>
                </div>
                <Badge variant="outline" className={`w-fit shrink-0 ${presentation.badgeClass}`}>{launchReadinessStatusLabels[workstream.status]}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 rounded-2xl border border-primary/10 bg-[var(--muted)]/60 p-4 sm:grid-cols-[9rem_1fr]">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-on-surface-variant/70">Owner</p><p className="text-sm font-semibold text-[var(--foreground)]">{workstream.owner}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-on-surface-variant/70">Next action</p><p className="text-sm leading-6 text-on-surface-variant/85">{workstream.nextAction}</p>
                </div>
                {workstream.href && workstream.actionLabel ? <Button asChild variant="outline" size="sm" className="w-full sm:w-auto"><Link to={workstream.href}>{workstream.actionLabel}<ArrowUpRight className="size-4" /></Link></Button> : null}
              </CardContent>
            </Card>
          )
        })}
      </section>

      <aside className="rounded-[1.5rem] border border-warning/25 bg-warning/10 p-5 text-sm leading-6 text-[var(--foreground)] sm:p-6">
        <p className="font-bold">Approval boundary</p>
        <p className="mt-2 text-on-surface-variant/85">This register is operational evidence, not authorization. Owner, legal, tax, accounting, partner, and credential-dependent rows must retain their current status until dated evidence is attached and the corresponding release test passes.</p>
      </aside>
    </div>
  )
}

function SummaryMetric({ label, value, status }: { label: string; value: number; status: LaunchReadinessStatus }) {
  const presentation = statusPresentation[status]
  const Icon = presentation.icon
  return <div className="rounded-[1.25rem] border border-primary/12 bg-card p-4 shadow-soft sm:p-5"><Icon className={`size-5 ${presentation.iconClass}`} /><p className="mt-4 font-serif text-4xl text-primary">{value}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-on-surface-variant/70">{label}</p></div>
}
