import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Gift, ScanLine, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { QrScanner } from '@/features/gift-cards/components/qr-scanner'
import {
  useBusinessMembers,
  useBusinessOwnerData,
  useRecordBusinessMemberPurchase,
  useResolveMemberForBusinessScan,
} from '@/hooks/use-business-owner-data'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/lib/language'
import { cn, formatPoints, getInitials } from '@/lib/utils'
import type { BusinessMember } from '@/types/domain'
import { memberPurchaseSchema, type MemberPurchaseFormValues } from '@/types/forms'

function normalizeMemberCode(input: string) {
  const value = input.trim()
  if (!value) return ''

  const withoutPrefix = value.replace(/^MRMEM:/i, '')
  try {
    const url = new URL(withoutPrefix)
    const lastSegment = url.pathname.split('/').filter(Boolean).at(-1)
    return (lastSegment ?? withoutPrefix).trim()
  } catch {
    return withoutPrefix.trim()
  }
}

export function MembersPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const { business, metrics } = useBusinessOwnerData()
  const members = useBusinessMembers(business?.id)
  const resolveMember = useResolveMemberForBusinessScan(business?.id)
  const recordPurchase = useRecordBusinessMemberPurchase(profile, business?.id)
  const [resolvedMember, setResolvedMember] = useState<BusinessMember | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const form = useForm<MemberPurchaseFormValues>({
    resolver: zodResolver(memberPurchaseSchema),
    defaultValues: {
      memberCode: '',
      amount: 50,
      note: '',
    },
  })

  const watchedAmount = useWatch({
    control: form.control,
    name: 'amount',
  })

  const earnRate = business?.earnRate ?? 0
  const estimatedPoints = watchedAmount && Number.isFinite(watchedAmount)
    ? Math.floor(watchedAmount * earnRate)
    : 0

  async function handleResolveMember(rawCode?: string) {
    const memberCode = normalizeMemberCode(rawCode ?? form.getValues('memberCode'))
    if (!memberCode) {
      setActionError(t('Scan or enter a member code'))
      return
    }

    try {
      setActionError(null)
      form.setValue('memberCode', memberCode, { shouldValidate: true })
      const member = await resolveMember.mutateAsync(memberCode)
      setResolvedMember(member)
    } catch (error) {
      setResolvedMember(null)
      setActionError(error instanceof Error ? error.message : t('Member not found.'))
    }
  }

  return (
    <div className="space-y-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl tracking-tight text-primary">{t('Customers')}</h1>
          <p className="text-lg text-on-surface-variant/85">
            {t('Scan a member QR code, enter the in-store purchase amount, and award points automatically.')}
          </p>
        </div>
        <Badge variant="accent" className="w-fit rounded-full bg-primary/5 px-5 py-3 text-primary">
          {metrics?.totalMembers ?? members.data?.length ?? 0} {t('active customers')}
        </Badge>
      </div>

      <div className="grid gap-10 xl:grid-cols-[460px_1fr]">
        <div className="space-y-8">
          <div className="space-y-2 pb-4 border-b border-outline-variant/10">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
              {t('Quick Action')}
            </span>
            <h2 className="font-serif text-3xl text-primary">{t('Record Member Purchase')}</h2>
          </div>

          <div className="rounded-[2rem] border border-[var(--border)] bg-white p-8 shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Camera className="size-4" />
                <p className="text-sm font-semibold">{t('Scan the member QR code or paste the member code below.')}</p>
              </div>
              <QrScanner onDetected={(value) => void handleResolveMember(value)} />
            </div>

            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(async (values) => {
                if (!resolvedMember) {
                  setActionError(t('Resolve a member before recording a purchase.'))
                  return
                }

                try {
                  setActionError(null)
                  const normalizedCode = normalizeMemberCode(values.memberCode)
                  const order = await recordPurchase.mutateAsync({
                    memberCode: normalizedCode,
                    amount: values.amount,
                    note: values.note?.trim() || undefined,
                  })
                  setResolvedMember((current) =>
                    current
                      ? {
                          ...current,
                          points: current.points + order.pointsEarned,
                        }
                      : current,
                  )
                  form.reset({
                    memberCode: normalizedCode,
                    amount: 50,
                    note: '',
                  })
                } catch (error) {
                  setActionError(error instanceof Error ? error.message : t('Failed to record the member purchase.'))
                }
              })}
            >
              <div className="grid gap-3">
                <Label htmlFor="memberCode" className="text-sm font-semibold">
                  {t('Member Code')}
                </Label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <ScanLine className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant/55" />
                    <Input
                      id="memberCode"
                      placeholder={t('Scan or paste member code')}
                      className="pl-11"
                      {...form.register('memberCode')}
                    />
                  </div>
                  <Button type="button" variant="secondary" className="rounded-full px-6" onClick={() => void handleResolveMember()}>
                    <Search className="size-4" />
                    {t('Find Member')}
                  </Button>
                </div>
                {form.formState.errors.memberCode ? (
                  <p className="text-xs text-red-500">{t(form.formState.errors.memberCode.message ?? '')}</p>
                ) : null}
              </div>

              <div className="rounded-3xl border border-primary-container/15 bg-[var(--muted)] p-5 shadow-sm">
                {resolvedMember ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-container font-serif text-lg text-primary-foreground shadow-lg">
                        {getInitials(resolvedMember.fullName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-xl text-primary">{resolvedMember.fullName}</p>
                        <p className="truncate text-sm text-on-surface-variant/85">{resolvedMember.email}</p>
                        <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">
                          {resolvedMember.referralCode}
                        </p>
                      </div>
                      <Badge
                        variant="accent"
                        className="rounded-full border-primary-container/25 bg-primary-container/12 px-4 py-2 text-primary"
                      >
                        {formatPoints(resolvedMember.points)} {t('points')}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-full',
                          resolvedMember.verificationStatus === 'verified'
                            ? 'border-success/20 bg-success/10 text-success'
                            : 'border-warning/20 bg-warning/10 text-warning',
                        )}
                      >
                        {resolvedMember.verificationStatus === 'verified' ? t('Verified') : t('Verification required')}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-serif text-xl text-primary">{t('No member resolved')}</p>
                    <p className="text-sm text-on-surface-variant/85">
                      {t('Scan a QR code, paste a member code, or select a member from the list to continue.')}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="amount" className="text-sm font-semibold">
                  {t('Purchase Amount (USD)')}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="h-12 rounded-2xl border border-primary-container/15 bg-[var(--card)] text-primary focus-visible:ring-primary-container/25"
                  {...form.register('amount', { valueAsNumber: true })}
                />
                {form.formState.errors.amount ? (
                  <p className="text-xs text-red-500">{t(form.formState.errors.amount.message ?? '')}</p>
                ) : null}
                <p className="text-xs font-medium text-on-surface-variant/75">
                  {t('At {rate} points per $1, this purchase will award about {points} points.', {
                    rate: earnRate,
                    points: estimatedPoints,
                  })}
                </p>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="note" className="text-sm font-semibold">
                  {t('Transaction Note')}
                </Label>
                <Input
                  id="note"
                  placeholder={t('e.g., Cashier transaction at front desk')}
                  className="h-12 rounded-2xl border border-primary-container/15 bg-[var(--card)] text-primary placeholder:text-on-surface-variant/55 focus-visible:ring-primary-container/25"
                  {...form.register('note')}
                />
                {form.formState.errors.note ? (
                  <p className="text-xs text-red-500">{t(form.formState.errors.note.message ?? '')}</p>
                ) : null}
              </div>

              <Button
                type="submit"
                size="lg"
                variant="secondary"
                className="h-14 w-full rounded-full font-semibold"
                disabled={recordPurchase.isPending || !resolvedMember}
              >
                {recordPurchase.isPending ? t('Recording...') : t('Record Purchase and Award Points')}
              </Button>
              {actionError ? <p className="text-sm font-bold text-red-500">{t(actionError)}</p> : null}
            </form>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-2 pb-4 border-b border-outline-variant/10">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
              {t('Customer Base')}
            </span>
            <h2 className="font-serif text-3xl text-primary">{t('Your Customers')}</h2>
          </div>

          {members.isLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-5 rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-5">
                    <Skeleton className="size-14 rounded-2xl" />
                    <div className="space-y-3">
                      <Skeleton className="h-7 w-44" />
                      <Skeleton className="h-4 w-56" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-28 rounded-full" />
                </div>
              ))}
            </div>
          ) : members.data?.length ? (
            <div className="grid gap-4">
              {members.data.map((member) => {
                const selected = member.id === resolvedMember?.id

                return (
                  <div
                    key={member.id}
                    className={cn(
                      'rounded-xl border border-[var(--border)] bg-white shadow-sm flex flex-col gap-5 rounded-[2rem] p-6 transition-all md:flex-row md:items-center md:justify-between',
                      selected
                        ? 'border-primary-container/35 bg-primary-container/[0.08] shadow-sm'
                        : 'hover:border-primary-container/35 hover:bg-[var(--muted)] hover:shadow-sm',
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-container font-serif text-lg text-primary-foreground shadow-lg">
                        {getInitials(member.fullName)}
                      </div>
                      <div>
                        <p className="font-serif text-2xl leading-tight text-primary">{member.fullName}</p>
                        <p className="mt-1 text-sm font-medium text-on-surface-variant/90">{member.email}</p>
                        <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-on-surface-variant/70">
                          {member.referralCode ?? member.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge
                        variant="accent"
                        className="flex items-center gap-1.5 rounded-full border border-primary-container/25 bg-primary-container/12 px-4 py-2 text-primary"
                      >
                        <Gift className="size-3" />
                        {formatPoints(member.points)} {t('points')}
                      </Badge>
                      <Button
                        variant={selected ? 'default' : 'outline'}
                        className={cn(
                          'rounded-full',
                          !selected &&
                            'border-primary-container/30 bg-[var(--card)] text-primary hover:border-primary-container/60 hover:bg-primary-container/10 hover:text-primary',
                        )}
                        onClick={() => {
                          setResolvedMember(member)
                          form.setValue('memberCode', member.referralCode ?? member.id, { shouldValidate: true })
                          setActionError(null)
                        }}
                      >
                        {selected ? t('Selected') : t('Use for checkout')}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              className="rounded-[2rem]"
              icon={<Users className="size-8" />}
              title={t('No customers yet')}
              description={t("Customers will appear here once they've purchased from your business.")}
            />
          )}
        </div>
      </div>
    </div>
  )
}
