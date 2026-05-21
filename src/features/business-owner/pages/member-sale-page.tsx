import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle, DollarSign, IdCard, ReceiptText } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingState } from '@/components/ui/loading-state'
import { Textarea } from '@/components/ui/textarea'
import { createClientRequestId } from '@/features/critical-flows/critical-flow'
import { calculateMemberTransaction } from '@/features/critical-flows/member-transaction'
import {
  useBusinessOwnerData,
  useRecordMemberTransaction,
  useScannedMember,
} from '@/hooks/use-business-owner-data'
import { formatCurrency, formatPoints } from '@/lib/utils'
import { memberTransactionSchema, type MemberTransactionFormValues } from '@/types/forms'
import type { MemberTransaction } from '@/types/domain'

export function MemberSalePage() {
  const { token = '' } = useParams()
  const { business } = useBusinessOwnerData()
  const member = useScannedMember(token)
  const [recordedTransaction, setRecordedTransaction] = useState<MemberTransaction | null>(null)
  const recordTransaction = useRecordMemberTransaction(business?.id, member.data?.id)

  const form = useForm<MemberTransactionFormValues>({
    resolver: zodResolver(memberTransactionSchema),
    defaultValues: {
      purchaseAmount: 50,
      note: '',
    },
  })

  const purchaseAmount = useWatch({
    control: form.control,
    name: 'purchaseAmount',
  })
  const preview = useMemo(() => {
    if (!business || !Number.isFinite(purchaseAmount) || purchaseAmount <= 0) return null

    return calculateMemberTransaction({
      purchaseAmount,
      rewardRatePercent: business.rewardRatePercent,
      commissionRatePercent: business.commissionRatePercent,
    })
  }, [business, purchaseAmount])

  if (member.isLoading || !business) {
    return <LoadingState title="Loading member" description="Preparing the scanned member sale." />
  }

  if (!member.data) {
    return (
      <EmptyState
        icon={<IdCard className="size-8" />}
        title="Member QR not found"
        description="Ask the customer to open their current member QR code and scan again."
      />
    )
  }

  const rewardValue = preview?.rewardValue ?? 0
  const pointsAwarded = preview?.pointsAwarded ?? 0
  const commissionAmount = preview?.commissionAmount ?? 0
  const isMemberVerified = member.data.verificationStatus === 'verified'

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-20">
      <div className="space-y-4 border-b border-outline-variant/10 pb-8">
        <Badge variant={isMemberVerified ? 'accent' : 'outline'} className="w-fit">
          {isMemberVerified ? 'Verified member' : 'Verification required'}
        </Badge>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-serif text-5xl tracking-tight text-primary">Record Member Sale</h1>
            <p className="mt-3 text-lg text-on-surface-variant/85">
              {business.name} can record an outside-app purchase and award rewards automatically.
            </p>
          </div>
          <div className="rounded-2xl border border-outline-variant/20 bg-card px-5 py-4">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">Member</p>
            <p className="font-serif text-2xl text-primary">{member.data.fullName}</p>
            <p className="text-sm text-on-surface-variant/75">{member.data.email}</p>
          </div>
        </div>
      </div>

      {recordedTransaction ? (
        <div className="rounded-3xl border border-success/20 bg-success/10 p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-success/15 text-success">
              <CheckCircle className="size-6" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-3xl text-primary">Transaction recorded</h2>
              <p className="text-on-surface-variant/85">
                Awarded {formatPoints(recordedTransaction.pointsAwarded)} points from a{' '}
                {formatCurrency(recordedTransaction.purchaseAmount)} purchase.
              </p>
              <p className="font-mono text-xs text-on-surface-variant/70">ID: {recordedTransaction.id}</p>
            </div>
          </div>
        </div>
      ) : null}

      <form
        className="grid gap-8 lg:grid-cols-[1fr_340px]"
        onSubmit={form.handleSubmit(async (values) => {
          const transaction = await recordTransaction.mutateAsync({
            token,
            purchaseAmount: values.purchaseAmount,
            note: values.note,
            clientRequestId: createClientRequestId(),
          })
          setRecordedTransaction(transaction)
          form.reset({ purchaseAmount: 50, note: '' })
        })}
      >
        <div className="rounded-3xl border border-outline-variant/20 bg-card p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ReceiptText className="size-5" />
            </div>
            <div>
              <h2 className="font-serif text-3xl text-primary">Purchase Details</h2>
              <p className="text-sm text-on-surface-variant/70">Payment is handled outside Medellin Rewards.</p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="purchaseAmount">Purchase Amount</Label>
              <Input
                id="purchaseAmount"
                type="number"
                min="0.01"
                step="0.01"
                className="h-14 rounded-2xl text-lg"
                {...form.register('purchaseAmount', { valueAsNumber: true })}
              />
              {form.formState.errors.purchaseAmount ? (
                <p className="text-sm font-bold text-red-500">{form.formState.errors.purchaseAmount.message}</p>
              ) : null}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                placeholder="Optional receipt number or cashier note"
                className="min-h-28 rounded-2xl"
                {...form.register('note')}
              />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-outline-variant/20 bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <DollarSign className="size-5" />
              </div>
              <h2 className="font-serif text-2xl text-primary">Preview</h2>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-on-surface-variant/75">Reward rate</span>
                <strong>{business.rewardRatePercent}%</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-on-surface-variant/75">Reward value</span>
                <strong>{formatCurrency(rewardValue)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-on-surface-variant/75">Points awarded</span>
                <strong>{formatPoints(pointsAwarded)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-outline-variant/10 pt-4">
                <span className="text-on-surface-variant/75">Commission owed</span>
                <strong>{formatCurrency(commissionAmount)}</strong>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="h-14 w-full rounded-full font-semibold"
            disabled={!isMemberVerified || !preview || recordTransaction.isPending}
          >
            {recordTransaction.isPending ? 'Recording...' : 'Record Sale'}
          </Button>

          {!isMemberVerified ? (
            <p className="rounded-2xl bg-warning/10 p-4 text-sm font-medium text-warning">
              This member must be verified before reward value can be awarded.
            </p>
          ) : null}
        </div>
      </form>
    </div>
  )
}
