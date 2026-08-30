import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'
import { z } from 'zod'

import { BrandLogo } from '@/components/brand-logo'
import { LanguagePicker } from '@/components/language-picker'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { earlyAccessService } from '@/integrations/supabase/services/early-access-service'
import { useTenant } from '@/hooks/use-tenant'
import { useLanguage } from '@/lib/language'
import {
  earlyAccessMessageLines,
  earlyAccessSubscribeButtonLabel,
} from '../early-access-content'
import { sendEarlyAccessWelcomeEmail } from '../welcome-email-service'

const earlyAccessModalSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name').max(80, 'Keep your name under 80 characters'),
  whatsapp: z.string().trim().min(5, 'Enter your WhatsApp number').max(40, 'Keep WhatsApp under 40 characters'),
  instagram: z.string().trim().max(120, 'Keep Instagram under 120 characters').optional(),
  email: z.string().trim().min(1, 'Enter your email').pipe(z.email('Enter a valid email')),
})

type EarlyAccessModalFormValues = z.infer<typeof earlyAccessModalSchema>

const defaultValues: EarlyAccessModalFormValues = {
  fullName: '',
  whatsapp: '',
  instagram: '',
  email: '',
}

const inputClass =
  'h-12 w-full rounded-md border border-black bg-white px-3.5 text-base text-black placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-black/20'
const labelClass = 'text-xs font-bold uppercase text-neutral-700'
const errorClass = 'text-xs font-bold text-error'
const earlyAccessParagraphClass = 'max-w-3xl text-[1.125rem] font-medium leading-8 text-neutral-950'

export function EarlyAccessPage() {
  const { t } = useLanguage()
  const { program } = useTenant()
  const [searchParams] = useSearchParams()
  const isMembershipRequest = program.slug === 'pinas' && searchParams.get('interest') === 'membership'
  const isRewardMeInvitation = program.slug === 'pinas'
  const isWondertownInvitation = program.slug === 'wondertown'
  const usesAssignedInvitation = isRewardMeInvitation || isWondertownInvitation
  const invitationTitle = isMembershipRequest
    ? 'Request Regular or Gold access'
    : isWondertownInvitation
      ? 'Ask the Wondertown demo team for help'
      : 'Request RewardMe program information'
  const invitationBody = isMembershipRequest
    ? 'RewardMe does not collect membership payments online. Leave your details and the team will contact you about eligibility, reference prices, terms, and manual activation.'
    : isWondertownInvitation
      ? 'Wondertown is a fictional test city. Use this form if you need help choosing a demo role or completing an end-to-end test.'
      : 'Leave your details if you would like help choosing the current RewardMe membership or business path.'
  const invitationPoints = isWondertownInvitation
    ? ['No real payment or customer data', 'Permanent fictional demo roles', 'Guided member and business workflows']
    : ['No payment card is collected here', 'Terms and eligibility are confirmed before activation', 'Your request is reviewed by the RewardMe team']
  const invitationSubmitLabel = isMembershipRequest
    ? 'Send membership request'
    : isWondertownInvitation
      ? 'Request demo help'
      : 'Send information request'
  const tenantText = (text: string) => t(text).replaceAll('Medellin Rewards', program.name)
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const leadForm = useForm<EarlyAccessModalFormValues>({
    resolver: zodResolver(earlyAccessModalSchema),
    defaultValues,
  })

  const openLeadModal = () => {
    setSubmitError(null)
    setLeadModalOpen(true)
  }

  return (
    <main className={usesAssignedInvitation
      ? 'product-public-shell min-h-screen overflow-x-hidden bg-[var(--background)] font-sans text-[var(--foreground)]'
      : 'early-access-neutral min-h-screen overflow-x-hidden bg-white font-sans text-neutral-950'}>
      <div className={usesAssignedInvitation
        ? 'mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-12'
        : 'mx-auto flex min-h-screen max-w-5xl items-center px-5 py-10 sm:px-8 lg:px-12'}>
        <section className="w-full space-y-7">
          {usesAssignedInvitation ? (
            <header className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
              <Link to="/" aria-label={t('Back to home')}><BrandLogo markClassName="h-11 max-w-48" /></Link>
              <div className="flex items-center gap-3">
                <LanguagePicker className="text-[var(--muted-foreground)]" compact />
                <Link className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border)] px-4 text-sm font-bold" to="/"><ArrowLeft className="size-4" aria-hidden="true" /> {t('Home')}</Link>
              </div>
            </header>
          ) : (
            <div className="flex justify-end">
              <LanguagePicker className="text-neutral-700" compact />
            </div>
          )}

          {usesAssignedInvitation ? (
            <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1.25fr_.75fr] lg:py-20">
              <div className="space-y-6">
                <p className="text-xs font-black uppercase tracking-[.2em] text-[var(--tenant-accent)]">{t(isWondertownInvitation ? 'Demo support' : 'Program access')}</p>
                <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-[1.02] sm:text-6xl">{t(invitationTitle)}</h1>
                <p className="max-w-2xl text-base font-medium leading-7 text-[var(--muted-foreground)] sm:text-lg">{t(invitationBody)}</p>
                <ul className="grid gap-3" aria-label={t('What happens next')}>
                  {invitationPoints.map((point) => <li className="flex items-start gap-3 text-sm font-semibold" key={point}><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--tenant-accent)]" aria-hidden="true" />{t(point)}</li>)}
                </ul>
              </div>

              <div className="rounded-3xl border border-[var(--border)] bg-card p-6 text-card-foreground shadow-soft sm:p-8">
                {isSubmitted ? (
                  <div className="space-y-3" role="status">
                    <CheckCircle2 className="size-10 text-[var(--tenant-accent)]" aria-hidden="true" />
                    <h2 className="font-serif text-2xl font-semibold">{t(isMembershipRequest ? 'Your membership request was received.' : 'Your request was received.')}</h2>
                    <p className="text-sm font-medium leading-6 text-[var(--muted-foreground)]">{t(isWondertownInvitation ? 'The Wondertown demo team will follow up with the next testing step.' : 'The RewardMe team will contact you about the appropriate next step.')}</p>
                    <Link className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground" to={isWondertownInvitation ? '/guide' : '/membership'}>{t(isWondertownInvitation ? 'Open the demo guide' : 'Review membership options')}</Link>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div><p className="text-xs font-black uppercase tracking-[.18em] text-[var(--tenant-accent)]">{t('Next step')}</p><h2 className="mt-2 font-serif text-2xl font-semibold">{t('Send your contact details')}</h2></div>
                    <p className="text-sm font-medium leading-6 text-[var(--muted-foreground)]">{t('The form asks for contact details only. It does not collect a card or process a charge.')}</p>
                    <button type="button" className="min-h-12 w-full rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:opacity-90" onClick={openLeadModal}>{t(invitationSubmitLabel)}</button>
                    <Link className="flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-5 text-center text-sm font-bold" to={isWondertownInvitation ? '/join' : '/membership'}>{t(isWondertownInvitation ? 'Create a demo member account' : 'Back to membership')}</Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-5">
                {earlyAccessMessageLines.slice(0, 6).map((line) => (
                  <p key={line} className={earlyAccessParagraphClass}>
                    {tenantText(line)}
                  </p>
                ))}

                {isSubmitted ? (
                  <div className="max-w-xl space-y-3 border-l-2 border-black pl-4">
                    <h2 className="text-xl font-semibold leading-tight text-black">{t("You're on the early list.")}</h2>
                    <p className="text-base font-medium leading-7 text-neutral-700">{tenantText('We saved your details. We will reach out when Medellin Rewards is ready for early adopters.')}</p>
                  </div>
                ) : (
                  <button type="button" className="h-12 rounded-md bg-[#16a34a] px-8 text-base font-bold text-white transition hover:bg-[#15803d]" onClick={openLeadModal}>{t(earlyAccessSubscribeButtonLabel)}</button>
                )}
              </div>

              <div className="space-y-1">
                {earlyAccessMessageLines.slice(6, 8).map((line) => (
                  <p key={line} className={earlyAccessParagraphClass}>
                    {tenantText(line)}
                  </p>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <Dialog open={leadModalOpen} onOpenChange={setLeadModalOpen}>
        <DialogContent className={usesAssignedInvitation
          ? 'max-w-lg rounded-3xl border border-[var(--border)] bg-card p-6 text-card-foreground shadow-xl sm:p-8'
          : 'early-access-neutral max-w-lg rounded-3xl border border-neutral-200 bg-white p-6 text-black shadow-xl sm:p-8'}>
          <form
            className="space-y-5"
            onSubmit={leadForm.handleSubmit(async (values) => {
              try {
                setSubmitError(null)
                const instagram = values.instagram?.trim() ?? ''
                const lead = await earlyAccessService.createLead({
                  fullName: values.fullName,
                  whatsapp: values.whatsapp,
                  email: values.email ?? '',
                  notes: [
                    isMembershipRequest ? 'Interest: RewardMe Regular or Gold membership' : '',
                    instagram ? `Instagram: ${instagram}` : '',
                  ].filter(Boolean).join('; '),
                  marketingConsent: true,
                }, { source: isMembershipRequest ? 'rewardme-membership-interest' : 'early-access-page' })
                if (lead.email) {
                  try {
                    await sendEarlyAccessWelcomeEmail({
                      fullName: lead.fullName,
                      email: lead.email,
                    })
                  } catch (emailError) {
                    console.warn('Unable to send early access welcome email.', emailError)
                  }
                }
                leadForm.reset(defaultValues)
                setIsSubmitted(true)
                setLeadModalOpen(false)
              } catch (error) {
                setSubmitError(error instanceof Error ? error.message : t('Unable to join the early access list.'))
              }
            })}
          >
            <DialogHeader>
              <DialogTitle className={usesAssignedInvitation ? 'text-xl font-bold text-[var(--foreground)]' : 'text-xl font-bold text-black'}>{usesAssignedInvitation ? t(invitationTitle) : t('Join early access')}</DialogTitle>
              <DialogDescription className={usesAssignedInvitation ? 'text-sm font-semibold leading-6 text-[var(--muted-foreground)]' : 'text-sm font-semibold leading-6 text-neutral-700'}>
                {usesAssignedInvitation ? t('No payment details are required. The team will contact you about the next step.') : tenantText('Leave your details and we will contact you when Medellin Rewards opens.')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              <label htmlFor="early-access-name" className={labelClass}>{t('Name')}</label>
              <input id="early-access-name" className={inputClass} placeholder={t('Your name')} {...leadForm.register('fullName')} />
              {leadForm.formState.errors.fullName ? <p className={errorClass}>{t(leadForm.formState.errors.fullName.message ?? '')}</p> : null}
            </div>

            <div className="grid gap-3">
              <label htmlFor="early-access-whatsapp" className={labelClass}>WhatsApp</label>
              <input id="early-access-whatsapp" className={inputClass} placeholder={t('International phone number')} {...leadForm.register('whatsapp')} />
              {leadForm.formState.errors.whatsapp ? <p className={errorClass}>{t(leadForm.formState.errors.whatsapp.message ?? '')}</p> : null}
            </div>

            <div className="grid gap-3">
              <label htmlFor="early-access-instagram" className={labelClass}>{t('Instagram optional')}</label>
              <input id="early-access-instagram" className={inputClass} placeholder={t('@yourhandle')} {...leadForm.register('instagram')} />
              {leadForm.formState.errors.instagram ? <p className={errorClass}>{t(leadForm.formState.errors.instagram.message ?? '')}</p> : null}
            </div>

            <div className="grid gap-3">
              <label htmlFor="early-access-email" className={labelClass}>{t('Email')}</label>
              <input id="early-access-email" className={inputClass} placeholder={t('you@example.com')} {...leadForm.register('email')} />
              {leadForm.formState.errors.email ? <p className={errorClass}>{t(leadForm.formState.errors.email.message ?? '')}</p> : null}
            </div>

            {submitError ? (
              <div className="rounded-md border border-black p-3 text-sm font-bold text-black">
                {t(submitError)}
              </div>
            ) : null}

            <button
              type="submit"
              className="h-12 w-full rounded-md bg-[#16a34a] px-8 text-base font-bold text-white transition hover:bg-[#15803d] disabled:opacity-60"
              disabled={leadForm.formState.isSubmitting}
            >
              {leadForm.formState.isSubmitting ? t('Submitting...') : usesAssignedInvitation ? t(invitationSubmitLabel) : t(earlyAccessSubscribeButtonLabel)}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
