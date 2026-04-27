import { zodResolver } from '@hookform/resolvers/zod'
import { Archive, Copy, Gift, Hotel, QrCode, UserRoundPlus } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useArchivePartnerReferrer,
  useBusinessOwnerData,
  useCreatePartnerReferrer,
  usePartnerCreditLedger,
  usePartnerPerformance,
  usePartnerReferrals,
  usePartnerReferrers,
  useRedeemPartnerCredit,
} from '@/hooks/use-business-owner-data'
import { useLanguage } from '@/lib/language'
import { partnerReferrerDraftSchema, type PartnerReferrerDraftFormValues } from '@/types/forms'

export function PartnersPage() {
  const { business } = useBusinessOwnerData()
  const { t } = useLanguage()
  const referrers = usePartnerReferrers(business?.id)
  const referrals = usePartnerReferrals(business?.id)
  const performance = usePartnerPerformance(business?.id)
  const partnerCredits = usePartnerCreditLedger(business?.id)
  const createPartnerReferrer = useCreatePartnerReferrer(business?.id)
  const archivePartnerReferrer = useArchivePartnerReferrer(business?.id)
  const redeemPartnerCredit = useRedeemPartnerCredit(business?.id)

  const form = useForm<PartnerReferrerDraftFormValues>({
    resolver: zodResolver(partnerReferrerDraftSchema),
    defaultValues: {
      businessId: business?.id ?? '',
      sourceLabel: '',
      contactEmail: '',
      notes: '',
    },
  })

  const activeCount = performance.data?.filter((entry) => entry.active).length ?? 0
  const totalCredits = performance.data?.reduce((sum, entry) => sum + entry.creditsEarned, 0) ?? 0
  const recentReferrals = (referrals.data ?? []).slice(0, 6)
  const unreedeemedCredits = (partnerCredits.data ?? []).filter((entry) => !entry.redeemedAt)

  return (
    <div className="space-y-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl tracking-tight text-primary">Partner Referrals</h1>
          <p className="text-lg text-on-surface-variant/85">
            Track receptionist and front-desk referrals, then reward partners after the first paid order.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge variant="accent" className="rounded-full border-primary-container/25 bg-primary-container/12 px-5 py-3 text-primary">
            {activeCount} active contacts
          </Badge>
          <Badge variant="accent" className="rounded-full border-secondary-container/25 bg-secondary-container/15 px-5 py-3 text-secondary">
            {totalCredits} partner credits earned
          </Badge>
        </div>
      </div>

      <div className="grid gap-10 xl:grid-cols-[420px_1fr]">
        <div className="space-y-8">
          <div className="space-y-2 border-b border-outline-variant/10 pb-4">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
              Partner Setup
            </span>
            <h2 className="font-serif text-3xl text-primary">Add Receptionist Code</h2>
          </div>

          <div className="quest-panel-dark rounded-[2rem] p-8">
            <form
              className="space-y-5"
              onSubmit={form.handleSubmit(async (values) => {
                if (!business?.id) return

                await createPartnerReferrer.mutateAsync({
                  ...values,
                  businessId: business.id,
                })
                form.reset({
                  businessId: business.id,
                  sourceLabel: '',
                  contactEmail: '',
                  notes: '',
                })
              })}
            >
              <div className="grid gap-3">
                <Label htmlFor="source-label">Referral Source</Label>
                <Input
                  id="source-label"
                  className="h-12 rounded-2xl border border-primary-container/15 bg-[#201815] text-primary"
                  placeholder="Ana - Harbor View Hotel"
                  {...form.register('sourceLabel')}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input
                  id="contact-email"
                  className="h-12 rounded-2xl border border-primary-container/15 bg-[#201815] text-primary"
                  placeholder="optional@email.com"
                  {...form.register('contactEmail')}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="partner-notes">Notes</Label>
                <Textarea
                  id="partner-notes"
                  className="min-h-28 rounded-2xl border border-primary-container/15 bg-[#201815] text-primary"
                  placeholder="Reward terms, front-desk context, or handoff notes"
                  {...form.register('notes')}
                />
              </div>

              <Button type="submit" variant="secondary" className="h-14 w-full rounded-full" disabled={form.formState.isSubmitting}>
                <UserRoundPlus className="size-4" />
                {form.formState.isSubmitting ? t('Saving...') : 'Create Partner Code'}
              </Button>
            </form>
          </div>

          <div className="quest-panel rounded-[2rem] p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-primary-container/25 bg-primary-container/10 text-primary-container">
                  <Gift className="size-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl text-primary">Partner Credit Rule</h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant/80">
                    Each referral source earns 1 partner credit after the referred customer places their first paid order.
                  </p>
                </div>
              </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-2 border-b border-outline-variant/10 pb-4">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
              Active Directory
            </span>
            <h2 className="font-serif text-3xl text-primary">Partner Contacts</h2>
          </div>

          {(referrers.data ?? []).length ? (
            <div className="grid gap-5">
              {(referrers.data ?? []).map((referrer) => {
                const stats = performance.data?.find((entry) => entry.partnerReferrerId === referrer.id)
                const partnerUrl =
                  business?.id && typeof window !== 'undefined'
                    ? `${window.location.origin}/promo?partner=${referrer.code}&business=${business.id}`
                    : ''

                return (
                  <div key={referrer.id} className="quest-panel rounded-[2rem] p-6">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex items-start gap-5">
                        <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#4b3621] font-serif text-2xl text-white shadow-lg">
                          {referrer.contactName.charAt(0)}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="font-serif text-3xl leading-tight text-primary">{referrer.contactName}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-on-surface-variant/70">{referrer.code}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="accent" className="border-primary-container/25 bg-primary-container/12 text-primary">
                              {stats?.referralsAttributed ?? 0} attributed
                            </Badge>
                            <Badge variant="accent" className="border-secondary-container/25 bg-secondary-container/15 text-secondary">
                              {stats?.creditsEarned ?? 0} credits earned
                            </Badge>
                            <Badge variant="accent" className="border-success/25 bg-success/12 text-success">
                              {stats?.creditsRedeemed ?? 0} redeemed
                            </Badge>
                          </div>
                          {referrer.notes ? (
                            <p className="max-w-xl text-sm leading-relaxed text-on-surface-variant/80">{referrer.notes}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 xl:items-end">
                        <div className="rounded-3xl border border-primary-container/15 bg-[#17100d]/80 p-4">
                          {partnerUrl ? <QRCodeSVG value={partnerUrl} size={112} /> : <QrCode className="size-28 text-on-surface-variant/40" />}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full"
                            onClick={async () => {
                              if (!partnerUrl) return
                              await navigator.clipboard.writeText(partnerUrl)
                              toast.success('Partner referral link copied')
                            }}
                          >
                            <Copy className="size-4" />
                            Copy Link
                          </Button>
                          {referrer.active ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-full border-red-300 text-red-400 hover:bg-red-500/10"
                              onClick={() => archivePartnerReferrer.mutate(referrer.id)}
                            >
                              <Archive className="size-4" />
                              Archive
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="quest-panel rounded-[2rem] p-16 text-center">
              <Hotel className="mx-auto mb-6 size-16 text-on-surface-variant/30" />
              <h3 className="mb-2 font-serif text-2xl text-primary">No referral sources yet</h3>
              <p className="text-on-surface-variant/80">Create your first referral source link to start tracking referred purchases.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="space-y-6">
          <div className="space-y-2 border-b border-outline-variant/10 pb-4">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
              Recent Activity
            </span>
            <h2 className="font-serif text-3xl text-primary">Attributed Customers</h2>
          </div>

          <div className="quest-panel divide-y divide-outline-variant/10 overflow-hidden">
            {recentReferrals.length ? (
              recentReferrals.map((referral) => (
                <div key={referral.id} className="flex flex-col gap-4 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-serif text-2xl text-primary">{referral.customer.fullName}</p>
                      <p className="text-sm text-on-surface-variant/80">{referral.customer.email}</p>
                    </div>
                    <Badge
                      variant="accent"
                      className={
                        referral.status === 'credited'
                          ? 'border-success/25 bg-success/12 text-success'
                          : 'border-primary-container/25 bg-primary-container/12 text-primary'
                      }
                    >
                      {referral.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-on-surface-variant/75">
                    Source: {referral.partnerReferrer.contactName}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-on-surface-variant/70">No partner referrals yet.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2 border-b border-outline-variant/10 pb-4">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
              Offline Redemption
            </span>
            <h2 className="font-serif text-3xl text-primary">Outstanding Partner Credits</h2>
          </div>

          <div className="quest-panel divide-y divide-outline-variant/10 overflow-hidden">
            {unreedeemedCredits.length ? (
              unreedeemedCredits.map((entry) => {
                const referral = referrals.data?.find((item) => item.id === entry.partnerReferralId)
                return (
                  <div key={entry.id} className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-serif text-2xl text-primary">
                        {referral?.partnerReferrer.contactName ?? 'Referral Source'}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-on-surface-variant/70">
                        {entry.creditUnits} partner credit
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-full"
                      onClick={() => redeemPartnerCredit.mutate(entry.id)}
                    >
                      Mark Redeemed
                    </Button>
                  </div>
                )
              })
            ) : (
              <div className="p-12 text-center text-on-surface-variant/70">No outstanding partner credits.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
