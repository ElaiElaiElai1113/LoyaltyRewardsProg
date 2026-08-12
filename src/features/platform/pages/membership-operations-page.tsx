import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, CheckCircle2, ClipboardList, History, Loader2, RefreshCw, ShieldCheck, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { manualMembershipKeys } from '@/hooks/use-manual-membership'
import { manualMembershipService } from '@/integrations/supabase/services/manual-membership-service'
import type { ManualMembershipRequest, ManualMembershipRequestStatus } from '@/types/domain'

type OperationsAction = 'approve' | 'reject' | 'renew' | 'cancel'
type StatusFilter = 'all' | ManualMembershipRequestStatus

const statusStyles: Record<ManualMembershipRequestStatus, string> = {
  pending: 'border-amber-600/25 bg-amber-50 text-amber-950',
  approved: 'border-success/25 bg-success/10 text-success',
  rejected: 'border-error/25 bg-error/10 text-error',
  canceled: 'border-[var(--border)] bg-[var(--muted)] text-on-surface-variant',
}

function readableDate(value?: string | null, includeTime = false) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat(undefined, includeTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(new Date(value))
}

export function MembershipOperationsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [selectedRequest, setSelectedRequest] = useState<ManualMembershipRequest | null>(null)
  const [action, setAction] = useState<OperationsAction | null>(null)
  const [note, setNote] = useState('')
  const [effectiveUntil, setEffectiveUntil] = useState('')
  const requests = useQuery({ queryKey: manualMembershipKeys.operations, queryFn: () => manualMembershipService.getOperationsRequests() })
  const events = useQuery({ queryKey: manualMembershipKeys.operationsEvents, queryFn: () => manualMembershipService.getOperationsEvents() })

  const filteredRequests = useMemo(
    () => (requests.data ?? []).filter((request) => statusFilter === 'all' || request.status === statusFilter),
    [requests.data, statusFilter],
  )
  const counts = useMemo(() => ({
    pending: (requests.data ?? []).filter((request) => request.status === 'pending').length,
    approved: (requests.data ?? []).filter((request) => request.status === 'approved').length,
    closed: (requests.data ?? []).filter((request) => request.status === 'rejected' || request.status === 'canceled').length,
  }), [requests.data])

  function refreshOperations() {
    void queryClient.invalidateQueries({ queryKey: manualMembershipKeys.operations })
    void queryClient.invalidateQueries({ queryKey: manualMembershipKeys.operationsEvents })
  }

  const completeAction = useMutation({
    mutationFn: async () => {
      if (!selectedRequest || !action) throw new Error('Select a membership action first.')
      if (note.trim().length < 3) throw new Error('Add an operations note of at least 3 characters.')
      const endDate = effectiveUntil ? new Date(`${effectiveUntil}T23:59:59`).toISOString() : null
      if (action === 'approve' || action === 'reject') {
        return manualMembershipService.reviewRequest({ requestId: selectedRequest.id, decision: action, reviewerNote: note, effectiveUntil: endDate })
      }
      if (action === 'renew') {
        return manualMembershipService.renewMembership({ programId: selectedRequest.programId, profileId: selectedRequest.profileId, reviewerNote: note, effectiveUntil: endDate })
      }
      return manualMembershipService.cancelMembership({ programId: selectedRequest.programId, profileId: selectedRequest.profileId, reason: note })
    },
    onSuccess: () => {
      refreshOperations()
      toast.success('Membership operation recorded in the audit history.')
      closeAction()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function openAction(request: ManualMembershipRequest, nextAction: OperationsAction) {
    setSelectedRequest(request)
    setAction(nextAction)
    setNote('')
    setEffectiveUntil('')
  }

  function closeAction() {
    if (completeAction.isPending) return
    setSelectedRequest(null)
    setAction(null)
    setNote('')
    setEffectiveUntil('')
  }

  const isLoading = requests.isLoading || events.isLoading
  const hasError = requests.isError || events.isError
  const actionTitle = action === 'approve' ? 'Approve request' : action === 'reject' ? 'Decline request' : action === 'renew' ? 'Renew membership' : 'Cancel membership'

  return (
    <div className="space-y-8" data-membership-operations>
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-primary"><ShieldCheck className="size-4" />Authorized staff only</div>
          <h1 className="mt-2 font-serif text-4xl text-primary sm:text-5xl">Membership operations</h1>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-on-surface-variant/80 sm:text-base">Review RewardMe enrollment and cancellation requests, manage active terms, and preserve a permanent audit trail. No online payment or card data is collected.</p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto" onClick={() => { void requests.refetch(); void events.refetch() }} disabled={isLoading}><RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />Refresh queue</Button>
      </header>

      <section className="grid grid-cols-3 gap-3" aria-label="Membership operations summary">
        <Metric label="Pending" value={counts.pending} icon={ClipboardList} />
        <Metric label="Approved" value={counts.approved} icon={CheckCircle2} />
        <Metric label="Closed" value={counts.closed} icon={XCircle} />
      </section>

      <section className="space-y-4" aria-labelledby="membership-queue-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.1em] text-on-surface-variant/70">Review workspace</p><h2 id="membership-queue-title" className="mt-1 font-serif text-3xl text-primary">Request queue</h2></div>
          <div className="w-full sm:w-56"><Label className="sr-only">Filter request status</Label><Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem><SelectItem value="canceled">Canceled</SelectItem><SelectItem value="all">All requests</SelectItem></SelectContent></Select></div>
        </div>

        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 rounded-3xl border border-[var(--border)] bg-card text-sm text-on-surface-variant"><Loader2 className="size-5 animate-spin" />Loading operations queue…</div>
        ) : hasError ? (
          <div className="rounded-3xl border border-error/25 bg-error/5 p-6"><h3 className="font-bold">Operations data could not be loaded.</h3><p className="mt-2 text-sm text-on-surface-variant">No records were changed. Retry the secure connection.</p><Button className="mt-4" variant="outline" onClick={() => { void requests.refetch(); void events.refetch() }}>Retry</Button></div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--border)] bg-card p-8 text-center"><ClipboardList className="mx-auto size-8 text-on-surface-variant" /><h3 className="mt-3 font-serif text-2xl text-primary">No {statusFilter === 'all' ? '' : statusFilter} requests</h3><p className="mt-2 text-sm text-on-surface-variant">Choose another status or refresh when a member submits a request.</p>{statusFilter !== 'all' ? <Button className="mt-4" variant="outline" onClick={() => setStatusFilter('all')}>View all requests</Button> : null}</div>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((request) => (
              <article className="rounded-3xl border border-[var(--border)] bg-card p-5 shadow-soft sm:p-6" key={request.id}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={statusStyles[request.status]}>{request.status}</Badge><Badge variant="outline" className="capitalize">{request.requestKind} · {request.requestedTier}</Badge></div>
                    <h3 className="mt-3 break-words font-serif text-2xl text-primary">{request.memberName || 'RewardMe member'}</h3>
                    <div className="mt-2 grid gap-1 text-sm text-on-surface-variant sm:grid-cols-2 sm:gap-x-6"><p className="break-all">{request.memberEmail || 'No email recorded'}</p><p>{request.memberPhone || 'No phone recorded'}</p><p>Requested {readableDate(request.requestedAt, true)}</p><p>{request.programName || 'RewardMe'}</p></div>
                    {request.memberNote ? <div className="mt-4 rounded-xl bg-[var(--muted)] p-3 text-sm leading-6"><strong>Member note:</strong> {request.memberNote}</div> : null}
                    {request.reviewerNote ? <div className="mt-3 text-sm leading-6 text-on-surface-variant"><strong>Operations note:</strong> {request.reviewerNote}</div> : null}
                    {request.membershipStatus ? <p className="mt-3 text-sm font-semibold capitalize text-primary">Membership: {request.membershipTier} · {request.membershipStatus} · through {readableDate(request.membershipEnd)}</p> : null}
                  </div>
                  <div className="grid w-full shrink-0 grid-cols-2 gap-2 lg:w-auto lg:min-w-72">
                    {request.status === 'pending' ? <><Button onClick={() => openAction(request, 'approve')}><CheckCircle2 className="size-4" />Approve</Button><Button variant="outline" onClick={() => openAction(request, 'reject')}><XCircle className="size-4" />Decline</Button></> : null}
                    {request.membershipStatus === 'active' && request.status === 'approved' ? <><Button variant="outline" onClick={() => openAction(request, 'renew')}><CalendarClock className="size-4" />Renew</Button><Button variant="outline" onClick={() => openAction(request, 'cancel')}><XCircle className="size-4" />Cancel</Button></> : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="membership-audit-title">
        <div><p className="text-xs font-bold uppercase tracking-[0.1em] text-on-surface-variant/70">Immutable record</p><h2 id="membership-audit-title" className="mt-1 flex items-center gap-2 font-serif text-3xl text-primary"><History className="size-6" />Recent audit history</h2></div>
        {!isLoading && !hasError && (events.data?.length ?? 0) === 0 ? <div className="rounded-2xl border border-dashed border-[var(--border)] bg-card p-6 text-sm text-on-surface-variant">Audit entries will appear here after the first request is submitted.</div> : null}
        <ol className="grid gap-3 md:grid-cols-2">
          {events.data?.slice(0, 20).map((event) => {
            const request = requests.data?.find((item) => item.id === event.requestId) ?? requests.data?.find((item) => item.profileId === event.profileId)
            return <li className="rounded-2xl border border-[var(--border)] bg-card p-4" key={event.id}><div className="flex items-start justify-between gap-3"><p className="font-bold capitalize text-primary">{event.eventType.replaceAll('_', ' ')}</p><time className="shrink-0 text-xs text-on-surface-variant">{readableDate(event.createdAt, true)}</time></div><p className="mt-1 text-sm text-on-surface-variant">{request?.memberName ?? 'RewardMe member'} · {event.tier} · {event.fromStatus ? `${event.fromStatus} → ` : ''}{event.toStatus}</p>{event.reason ? <p className="mt-2 text-sm leading-6 text-on-surface-variant">{event.reason}</p> : null}</li>
          })}
        </ol>
      </section>

      <Dialog open={Boolean(selectedRequest && action)} onOpenChange={(open) => { if (!open) closeAction() }}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader><DialogTitle>{actionTitle}</DialogTitle><DialogDescription>{selectedRequest ? `${selectedRequest.memberName || 'RewardMe member'} · ${selectedRequest.requestedTier} ${selectedRequest.requestKind}` : ''}. This action is written to the permanent audit history.</DialogDescription></DialogHeader>
          <div className="grid gap-4">
            {(action === 'approve' || action === 'renew') ? <div className="grid gap-2"><Label htmlFor="membership-effective-until">Effective until (optional)</Label><Input id="membership-effective-until" type="date" value={effectiveUntil} onChange={(event) => setEffectiveUntil(event.target.value)} /><p className="text-xs text-on-surface-variant">Leave blank to apply the plan default: one month for Regular or one year for Gold.</p></div> : null}
            <div className="grid gap-2"><Label htmlFor="membership-operations-note">Operations note</Label><Textarea id="membership-operations-note" maxLength={2000} placeholder="Record the identity check, decision, or reason" value={note} onChange={(event) => setNote(event.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3"><Button type="button" variant="outline" onClick={closeAction} disabled={completeAction.isPending}>Go back</Button><Button type="button" onClick={() => completeAction.mutate()} disabled={note.trim().length < 3 || completeAction.isPending}>{completeAction.isPending ? 'Saving…' : 'Confirm action'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof ClipboardList }) {
  return <div className="min-w-0 rounded-2xl border border-primary/12 bg-card p-3 shadow-soft sm:p-5"><Icon className="size-5 text-primary" /><p className="mt-3 font-serif text-3xl text-primary sm:text-4xl">{value}</p><p className="truncate text-[0.65rem] font-bold uppercase tracking-[0.08em] text-on-surface-variant/70 sm:text-xs">{label}</p></div>
}
