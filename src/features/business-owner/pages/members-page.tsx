import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Copy, Gift, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CompactFilter } from '@/components/ui/compact-filter'
import { CompactRecordList, CompactRecordRow } from '@/components/ui/compact-record-list'
import { CompactSearch } from '@/components/ui/compact-search'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAwardPoints,
  useBusinessMembers,
  useBusinessOwnerData,
  useRegisterCustomer,
} from '@/hooks/use-business-owner-data'
import { useAuth } from '@/hooks/use-auth'
import { useTenant } from '@/hooks/use-tenant'
import { useLanguage } from '@/lib/language'
import { COMPACT_LIST_PAGE_SIZE, usePagination } from '@/hooks/use-pagination'
import { searchMatches } from '@/lib/search'
import { getVerificationStatusLabel } from '@/lib/status-labels'
import { cn, formatCurrency, formatPoints, getInitials } from '@/lib/utils'
import {
  registerCustomerSchema,
  rewardAdjustmentSchema,
  type RegisterCustomerFormValues,
  type RewardAdjustmentFormValues,
} from '@/types/forms'

type CustomerStatusFilter = 'all' | 'under_review' | 'approved' | 'missing_document' | 'rejected'
type RegisteredCustomer = { id: string; email?: string; fullName: string; existing?: boolean }

function matchesCustomerStatusFilter(
  member: { verificationStatus?: 'not_submitted' | 'pending_document' | 'submitted' | 'verified' | 'rejected' },
  filter: CustomerStatusFilter,
) {
  if (filter === 'all') return true
  if (filter === 'under_review') return member.verificationStatus === 'submitted'
  if (filter === 'approved') return member.verificationStatus === 'verified'
  if (filter === 'rejected') return member.verificationStatus === 'rejected'
  return member.verificationStatus !== 'submitted' && member.verificationStatus !== 'verified' && member.verificationStatus !== 'rejected'
}

export function MembersPage() {
  const { profile } = useAuth()
  const { program } = useTenant()
  const { language, t } = useLanguage()
  const { business, metrics } = useBusinessOwnerData()
  const businessCurrency = business?.currency ?? program.currency
  const selectedLocale = language === 'es' ? 'es-ES' : language === 'tl' ? 'fil-PH' : program.locale
  const purchaseCurrencySymbol = new Intl.NumberFormat(selectedLocale, {
    style: 'currency',
    currency: businessCurrency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).formatToParts(0).find((part) => part.type === 'currency')?.value ?? businessCurrency
  const members = useBusinessMembers(business?.id)
  const awardPoints = useAwardPoints(profile, business?.id)
  const registerCustomer = useRegisterCustomer(business?.id)
  const [actionError, setActionError] = useState<string | null>(null)
  const [registerActionError, setRegisterActionError] = useState<string | null>(null)
  const [purchaseAmount, setPurchaseAmount] = useState<string>('')
  const [customerLookup, setCustomerLookup] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [customerStatusFilter, setCustomerStatusFilter] = useState<CustomerStatusFilter>('all')
  const [registeredCustomer, setRegisteredCustomer] = useState<RegisteredCustomer | null>(null)

  const form = useForm<RewardAdjustmentFormValues>({
    resolver: zodResolver(rewardAdjustmentSchema),
    defaultValues: {
      profileId: '',
      delta: 10,
      reason: '',
    },
  })
  const registerForm = useForm<RegisterCustomerFormValues>({
    resolver: zodResolver(registerCustomerSchema),
    defaultValues: {
      fullName: '',
      email: '',
    },
  })

  const selectedProfileId = useWatch({
    control: form.control,
    name: 'profileId',
  })
  const selectedMember = members.data?.find((member) => member.id === selectedProfileId) ?? null
  const memberRows = members.data ?? []
  const customerStatusFilterOptions = [
    { value: 'all', label: t('All'), count: memberRows.length },
    {
      value: 'under_review',
      label: t('Under review'),
      count: memberRows.filter((member) => matchesCustomerStatusFilter(member, 'under_review')).length,
    },
    {
      value: 'approved',
      label: t('Approved'),
      count: memberRows.filter((member) => matchesCustomerStatusFilter(member, 'approved')).length,
    },
    {
      value: 'missing_document',
      label: t('Missing ID'),
      count: memberRows.filter((member) => matchesCustomerStatusFilter(member, 'missing_document')).length,
    },
    {
      value: 'rejected',
      label: t('Rejected'),
      count: memberRows.filter((member) => matchesCustomerStatusFilter(member, 'rejected')).length,
    },
  ]
  const filteredMembers = memberRows.filter(
    (member) =>
      matchesCustomerStatusFilter(member, customerStatusFilter) &&
      searchMatches(memberSearch, [
        member.fullName,
        member.email,
        member.id,
        member.points,
        member.verificationStatus,
        t(getVerificationStatusLabel(member.verificationStatus)),
      ]),
  )
  const pagination = usePagination(
    filteredMembers,
    COMPACT_LIST_PAGE_SIZE,
    `${memberSearch}:${customerStatusFilter}`,
  )
  const calculatedPoints =
    purchaseAmount && business?.earnRate
      ? Math.floor(Number.parseFloat(purchaseAmount) * business.earnRate)
      : null

  return (
    <div className="min-w-0 space-y-16 overflow-hidden">
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

      <div className="grid min-w-0 gap-10 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="min-w-0 space-y-8">
          <div className="space-y-2 pb-4 border-b border-outline-variant/10">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
              {t('Quick Action')}
            </span>
            <h2 className="font-serif text-3xl text-primary">{t('Award Points')}</h2>
          </div>

          <div className="min-w-0 rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-sm sm:p-8">
            <form
              className="min-w-0 space-y-6"
              onSubmit={form.handleSubmit(async (values) => {
                try {
                  setActionError(null)
                  await awardPoints.mutateAsync(values)
                  form.reset({
                    profileId: '',
                    delta: 10,
                    reason: '',
                  })
                  setCustomerLookup('')
                  setPurchaseAmount('')
                } catch (error) {
                  setActionError(error instanceof Error ? t(error.message) : t('Failed to award points.'))
                }
              })}
            >
              <div className="grid gap-3">
                <Label htmlFor="customerLookup" className="text-sm font-semibold">
                  {t('Customer')}
                </Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant/55" />
                  <Input
                    id="customerLookup"
                    list="business-member-options"
                  placeholder={t('Search by name, email, or customer ID')}
                    className="h-12 rounded-2xl border border-primary-container/15 bg-[var(--card)] pl-11 text-primary placeholder:text-on-surface-variant/55 focus-visible:ring-primary-container/25"
                    value={customerLookup}
                    onChange={(event) => {
                      const value = event.target.value
                      const normalized = value.trim().toLowerCase()
                      const match = memberRows.find(
                        (member) =>
                          member.id.toLowerCase() === normalized ||
                          member.email.toLowerCase() === normalized ||
                          member.fullName.toLowerCase() === normalized,
                      )
                      setCustomerLookup(value)
                      form.setValue('profileId', match?.id ?? '', { shouldValidate: Boolean(match) })
                    }}
                  />
                  <input type="hidden" {...form.register('profileId')} />
                </div>
                <datalist id="business-member-options">
                  {(members.data ?? []).map((member) => (
                    <option key={member.id} value={member.email}>
                      {member.fullName} - {t('ID')}: {member.id}
                    </option>
                  ))}
                </datalist>
                {form.formState.errors.profileId ? (
                  <p className="text-xs text-red-500">{t(form.formState.errors.profileId.message)}</p>
                ) : null}
              </div>

              <div className="rounded-3xl border border-primary-container/15 bg-[var(--muted)] p-5 shadow-sm">
                {selectedMember ? (
                  <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary font-serif text-lg text-primary-foreground shadow-lg">
                      {getInitials(selectedMember.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-xl text-primary">{selectedMember.fullName}</p>
                      <p className="truncate text-sm text-on-surface-variant/85">{selectedMember.email}</p>
                    </div>
                    <Badge
                      variant="accent"
                      className="max-w-full rounded-full border-primary-container/25 bg-primary-container/12 px-4 py-2 text-primary"
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
                <Label htmlFor="purchaseAmount" className="text-sm font-semibold">
                  {t('Purchase Amount (optional)')}
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-on-surface-variant/60">
                    {purchaseCurrencySymbol}
                  </span>
                  <Input
                    id="purchaseAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="h-12 rounded-2xl border-outline-variant/20 pl-8 focus:border-primary/30"
                    value={purchaseAmount}
                    onChange={(event) => {
                      const value = event.target.value
                      setPurchaseAmount(value)

                      const amount = Number.parseFloat(value)
                      if (!Number.isNaN(amount) && business?.earnRate) {
                        form.setValue('delta', Math.floor(amount * business.earnRate), { shouldValidate: true })
                      }
                    }}
                  />
                </div>
                {purchaseAmount ? (
                  <p className="text-xs text-on-surface-variant/70">
                    {t('{rate} points per {unit} · {amount} = {points} points', {
                      rate: business?.earnRate ?? 0,
                      unit: formatCurrency(1, businessCurrency, selectedLocale),
                      amount: formatCurrency(Number.parseFloat(purchaseAmount) || 0, businessCurrency, selectedLocale),
                      points: calculatedPoints ?? 0,
                    })}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="delta" className="text-sm font-semibold">
                  {t('Points to Award')}
                </Label>
                <Input
                  id="delta"
                  type="number"
                  className="h-12 rounded-2xl border border-primary-container/15 bg-[var(--card)] text-primary focus-visible:ring-primary-container/25"
                  {...form.register('delta', { valueAsNumber: true })}
                />
                {form.formState.errors.delta ? (
                  <p className="text-xs text-red-500">{t(form.formState.errors.delta.message)}</p>
                ) : null}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="reason" className="text-sm font-semibold">
                  {t('Reason')}
                </Label>
                <Input
                  id="reason"
                  placeholder={`${t('e.g., In-store purchase')} ${formatCurrency(12.5, businessCurrency, selectedLocale)}`}
                  className="h-12 rounded-2xl border border-primary-container/15 bg-[var(--card)] text-primary placeholder:text-on-surface-variant/55 focus-visible:ring-primary-container/25"
                  {...form.register('reason')}
                />
                {form.formState.errors.reason ? (
                  <p className="text-xs text-red-500">{t(form.formState.errors.reason.message)}</p>
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

          <div className="space-y-2 pb-4 border-b border-outline-variant/10">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
              {t('Quick Action')}
            </span>
            <h2 className="font-serif text-3xl text-primary">{t('Register New Customer')}</h2>
          </div>

          <div className="min-w-0 rounded-3xl border border-outline-variant/5 bg-white p-5 shadow-sm sm:p-8">
            <form
              className="min-w-0 space-y-6"
              onSubmit={registerForm.handleSubmit(async (values) => {
                try {
                  setRegisterActionError(null)
                  const customer = await registerCustomer.mutateAsync({
                    name: values.fullName,
                    email: values.email,
                  })
                  setRegisteredCustomer({
                    id: customer.id,
                    email: customer.email,
                    fullName: values.fullName,
                    existing: customer.existing,
                  })
                  setCustomerLookup(customer.email ?? customer.id)
                  form.setValue('profileId', customer.id, { shouldValidate: true })
                  registerForm.reset({
                    fullName: '',
                    email: '',
                  })
                } catch (error) {
                  setRegisterActionError(
                    error instanceof Error ? t(error.message) : t('Failed to register customer.'),
                  )
                }
              })}
            >
              <div className="grid gap-3">
                <Label htmlFor="registerFullName" className="text-sm font-semibold">
                  {t('Full Name')}
                </Label>
                <Input
                  id="registerFullName"
                  type="text"
                  className="h-12 rounded-2xl border-outline-variant/20 focus:border-primary/30"
                  {...registerForm.register('fullName')}
                />
                {registerForm.formState.errors.fullName ? (
                  <p className="text-xs text-red-500">{t(registerForm.formState.errors.fullName.message)}</p>
                ) : null}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="registerEmail" className="text-sm font-semibold">
                  {t('Email Address')}
                </Label>
                <Input
                  id="registerEmail"
                  type="email"
                  className="h-12 rounded-2xl border-outline-variant/20 focus:border-primary/30"
                  {...registerForm.register('email')}
                />
                {registerForm.formState.errors.email ? (
                  <p className="text-xs text-red-500">{t(registerForm.formState.errors.email.message)}</p>
                ) : null}
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-14 w-full rounded-full font-semibold"
                disabled={registerCustomer.isPending}
              >
                {registerCustomer.isPending ? t('Registering...') : t('Register Customer')}
              </Button>
              {registerActionError ? (
                <p className="text-sm font-bold text-red-500">{registerActionError}</p>
              ) : null}
              {registeredCustomer ? (
                <div className="rounded-2xl border border-success/25 bg-success/10 p-4" role="status">
                  <div className="flex items-start gap-3">
                    <Check className="mt-0.5 size-5 shrink-0 text-success" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-primary">
                        {registeredCustomer.existing
                          ? t('Existing customer linked and selected')
                          : t('Customer registered and selected')}
                      </p>
                      <p className="mt-1 text-sm text-on-surface-variant/85">
                        {registeredCustomer.fullName} · {registeredCustomer.email}
                      </p>
                      <p className="mt-2 break-all font-mono text-xs text-primary">
                        {t('Customer ID')}: {registeredCustomer.id}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => void navigator.clipboard.writeText(registeredCustomer.id)}
                      >
                        <Copy className="size-4" />
                        {t('Copy customer ID')}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </form>
          </div>
        </div>

        <div className="min-w-0 space-y-8">
          <div className="flex flex-col gap-4 border-b border-outline-variant/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
                {t('Customer Base')}
              </span>
              <h2 className="font-serif text-3xl text-primary">{t('Your Customers')}</h2>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <CompactSearch
                value={memberSearch}
                onChange={(event) => setMemberSearch(event.target.value)}
                placeholder={t('Search customers')}
                aria-label={t('Search customers')}
                wrapperClassName="min-w-0 max-w-full"
              />
              <CompactFilter
                value={customerStatusFilter}
                onChange={(event) => setCustomerStatusFilter(event.target.value as CustomerStatusFilter)}
                options={customerStatusFilterOptions}
                wrapperClassName="min-w-0 max-w-full w-full sm:w-52"
                aria-label={t('Filter customers by verification status')}
              />
            </div>
          </div>

          {members.isLoading ? (
            <CompactRecordList aria-label={t('Loading customers')}>
              {Array.from({ length: COMPACT_LIST_PAGE_SIZE }).map((_, index) => (
                <CompactRecordRow key={index} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-xl" />
                    <div className="min-w-0 space-y-2">
                      <Skeleton className="h-5 w-36" />
                      <Skeleton className="h-3 w-48 max-w-full" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20 shrink-0 rounded-full" />
                </CompactRecordRow>
              ))}
            </CompactRecordList>
          ) : members.data?.length ? (
            <div className="space-y-3">
              {filteredMembers.length ? (
                <CompactRecordList aria-label={t('Your Customers')}>
                  {pagination.pageItems.map((member) => {
                    const selected = member.id === selectedProfileId

                    return (
                      <CompactRecordRow
                        key={member.id}
                        selected={selected}
                        className="flex min-w-0 flex-col gap-3 overflow-hidden md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex min-w-0 items-start gap-3 md:items-center">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary font-serif text-sm text-primary-foreground shadow-sm">
                            {getInitials(member.fullName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-serif text-lg leading-tight text-primary">{member.fullName}</p>
                            <p className="mt-0.5 truncate text-sm font-medium text-on-surface-variant/90">{member.email}</p>
                            <p className="mt-1 block min-w-0 max-w-full truncate text-[0.6rem] font-bold uppercase tracking-[0.12em] text-on-surface-variant/70">
                              {t('ID')}: {member.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 pl-0 sm:pl-[3.25rem] md:w-auto md:justify-end md:pl-0">
                          <Badge
                            variant="accent"
                            className="flex items-center gap-1 rounded-full border border-primary-container/25 bg-primary-container/12 px-2.5 py-1 text-primary"
                          >
                            <Gift className="size-3" />
                            {formatPoints(member.points)} {t('points')}
                          </Badge>
                          <Badge
                            variant="accent"
                            className={cn(
                              'rounded-full px-2.5 py-1',
                              member.verificationStatus === 'verified'
                                ? 'border-success/25 bg-success/10 text-success'
                                : member.verificationStatus === 'rejected'
                                  ? 'border-red-200 bg-red-50 text-red-600'
                                  : 'border-warning/25 bg-warning/10 text-warning',
                            )}
                          >
                            {t(getVerificationStatusLabel(member.verificationStatus))}
                          </Badge>
                          <Button
                            variant={selected ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                              'h-8 rounded-full px-3',
                              !selected &&
                                'border-primary-container/30 bg-[var(--card)] text-primary hover:border-primary-container/60 hover:bg-primary-container/10 hover:text-primary',
                            )}
                            onClick={() => {
                              form.setValue('profileId', member.id, { shouldValidate: true })
                              setCustomerLookup(member.email)
                            }}
                          >
                            {selected ? t('Selected') : t('Select')}
                          </Button>
                        </div>
                      </CompactRecordRow>
                    )
                  })}
                </CompactRecordList>
              ) : (
                <EmptyState
                  className="rounded-[2rem]"
                  icon={<Users className="size-8" />}
                  title={t('No customers match this search')}
                  description={t('Try a different search or status filter.')}
                />
              )}
              <PaginationControls ariaLabel={t('Business members pagination')} {...pagination} onPageChange={pagination.setPage} />
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
