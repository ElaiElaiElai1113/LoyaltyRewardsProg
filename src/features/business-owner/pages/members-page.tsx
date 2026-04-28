import { zodResolver } from '@hookform/resolvers/zod'
import { Gift, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useAwardPoints,
  useBusinessMembers,
  useBusinessOwnerData,
} from '@/hooks/use-business-owner-data'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/lib/language'
import { cn, formatPoints, getInitials } from '@/lib/utils'
import {
  rewardAdjustmentSchema,
  type RewardAdjustmentFormValues,
} from '@/types/forms'

export function MembersPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const { business, metrics } = useBusinessOwnerData()
  const members = useBusinessMembers(business?.id)
  const awardPoints = useAwardPoints(profile, business?.id)
  const [actionError, setActionError] = useState<string | null>(null)

  const form = useForm<RewardAdjustmentFormValues>({
    resolver: zodResolver(rewardAdjustmentSchema),
    defaultValues: {
      profileId: '',
      delta: 10,
      reason: '',
    },
  })

  const selectedProfileId = useWatch({
    control: form.control,
    name: 'profileId',
  })
  const selectedMember = members.data?.find((member) => member.id === selectedProfileId) ?? null

  return (
    <div className="space-y-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl tracking-tight text-primary">{t('Customers')}</h1>
          <p className="text-lg text-on-surface-variant/85">
            {t('Look up a customer, review their balance, and award points for in-store purchases.')}
          </p>
        </div>
        <Badge variant="accent" className="w-fit rounded-full bg-primary/5 px-5 py-3 text-primary">
          {metrics?.totalMembers ?? members.data?.length ?? 0} {t('active customers')}
        </Badge>
      </div>

      <div className="grid gap-10 xl:grid-cols-[420px_1fr]">
        <div className="space-y-8">
          <div className="space-y-2 pb-4 border-b border-outline-variant/10">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
              {t('Quick Action')}
            </span>
            <h2 className="font-serif text-3xl text-primary">{t('Award Points')}</h2>
          </div>

          <div className="quest-panel-dark rounded-[2rem] p-8">
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(async (values) => {
                try {
                  setActionError(null)
                  await awardPoints.mutateAsync(values)
                  form.reset({
                    profileId: '',
                    delta: 10,
                    reason: '',
                  })
                } catch (error) {
                  setActionError(error instanceof Error ? error.message : t('Failed to award points.'))
                }
              })}
            >
              <div className="grid gap-3">
                <Label htmlFor="profileId" className="text-sm font-semibold">
                  {t('Customer')}
                </Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant/55" />
                  <Input
                    id="profileId"
                    list="business-member-options"
                    placeholder={t('Search by customer ID')}
                    className="h-12 rounded-2xl border border-primary-container/15 bg-[#201815] pl-11 text-primary placeholder:text-on-surface-variant/55 focus-visible:ring-primary-container/25"
                    {...form.register('profileId')}
                  />
                </div>
                <datalist id="business-member-options">
                  {(members.data ?? []).map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName} - {member.email}
                    </option>
                  ))}
                </datalist>
                {form.formState.errors.profileId ? (
                  <p className="text-xs text-red-500">{form.formState.errors.profileId.message}</p>
                ) : null}
              </div>

              <div className="rounded-3xl border border-primary-container/15 bg-[#181210] p-5 shadow-[inset_0_0_0_1px_rgba(244,168,79,0.04)]">
                {selectedMember ? (
                  <div className="flex items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#4b3621] font-serif text-lg text-white shadow-lg">
                      {getInitials(selectedMember.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-xl text-primary">{selectedMember.fullName}</p>
                      <p className="truncate text-sm text-on-surface-variant/85">{selectedMember.email}</p>
                    </div>
                    <Badge
                      variant="accent"
                      className="rounded-full border-primary-container/25 bg-primary-container/12 px-4 py-2 text-primary"
                    >
                      {formatPoints(selectedMember.points)} {t('points')}
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-serif text-xl text-primary">{t('No customer selected')}</p>
                    <p className="text-sm text-on-surface-variant/85">
                      {t('Choose a customer to preview their current balance before awarding points.')}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="delta" className="text-sm font-semibold">
                  {t('Points to Award')}
                </Label>
                <Input
                  id="delta"
                  type="number"
                  className="h-12 rounded-2xl border border-primary-container/15 bg-[#201815] text-primary focus-visible:ring-primary-container/25"
                  {...form.register('delta', { valueAsNumber: true })}
                />
                {form.formState.errors.delta ? (
                  <p className="text-xs text-red-500">{form.formState.errors.delta.message}</p>
                ) : null}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="reason" className="text-sm font-semibold">
                  {t('Reason')}
                </Label>
                <Input
                  id="reason"
                  placeholder={t('e.g., In-store purchase $12.50')}
                  className="h-12 rounded-2xl border border-primary-container/15 bg-[#201815] text-primary placeholder:text-on-surface-variant/55 focus-visible:ring-primary-container/25"
                  {...form.register('reason')}
                />
                {form.formState.errors.reason ? (
                  <p className="text-xs text-red-500">{form.formState.errors.reason.message}</p>
                ) : null}
              </div>

              <Button
                type="submit"
                size="lg"
                variant="secondary"
                className="h-14 w-full rounded-full font-semibold"
                disabled={awardPoints.isPending}
              >
                {awardPoints.isPending ? t('Awarding...') : t('Award Points')}
              </Button>
              {actionError ? <p className="text-sm font-bold text-red-500">{actionError}</p> : null}
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
            <div className="quest-panel rounded-[2rem] p-12 text-center text-on-surface-variant/80">
              {t('Loading customers...')}
            </div>
          ) : members.data?.length ? (
            <div className="grid gap-4">
              {members.data.map((member) => {
                const selected = member.id === selectedProfileId

                return (
                  <div
                    key={member.id}
                    className={cn(
                      'quest-panel flex flex-col gap-5 rounded-[2rem] p-6 transition-all md:flex-row md:items-center md:justify-between',
                      selected
                        ? 'border-primary-container/35 bg-primary-container/[0.08] shadow-[0_0_0_1px_rgba(244,168,79,0.18),0_20px_40px_rgba(8,5,3,0.34)]'
                        : 'hover:border-primary-container/35 hover:bg-[#1a1310] hover:shadow-[0_0_0_1px_rgba(244,168,79,0.18),0_20px_40px_rgba(8,5,3,0.28)]',
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#4b3621] font-serif text-lg text-white shadow-lg">
                        {getInitials(member.fullName)}
                      </div>
                      <div>
                        <p className="font-serif text-2xl leading-tight text-primary">{member.fullName}</p>
                        <p className="mt-1 text-sm font-medium text-on-surface-variant/90">{member.email}</p>
                        <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-on-surface-variant/70">
                          ID: {member.id}
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
                            'border-primary-container/30 bg-[#18110e]/70 text-primary hover:border-primary-container/60 hover:bg-primary-container/10 hover:text-primary',
                        )}
                        onClick={() => form.setValue('profileId', member.id, { shouldValidate: true })}
                      >
                        {selected ? t('Selected') : t('Select')}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="quest-panel rounded-[2rem] p-16 text-center">
              <Users className="mx-auto mb-6 size-16 text-on-surface-variant/30" />
              <h3 className="mb-2 font-serif text-2xl text-primary">{t('No customers yet')}</h3>
              <p className="mx-auto max-w-md text-on-surface-variant/80">
                {t("Customers will appear here once they've purchased from your business.")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
