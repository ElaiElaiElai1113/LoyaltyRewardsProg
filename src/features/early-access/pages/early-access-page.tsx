import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, BadgeCheck, Mail, MessageCircle, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import heroImage from '@/assets/medellinrewards-hero.webp'
import { LanguagePicker } from '@/components/language-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { earlyAccessService } from '@/integrations/supabase/services/early-access-service'
import { useLanguage } from '@/lib/language'
import { earlyAccessLeadSchema, type EarlyAccessLeadFormValues } from '@/types/forms'

const defaultValues: EarlyAccessLeadFormValues = {
  fullName: '',
  email: '',
  whatsapp: '',
  notes: '',
  marketingConsent: false,
}

const inputClass =
  'h-11 rounded-xl border-[#d9b98e] bg-[#fffaf2] px-3.5 text-sm text-[#24190f] shadow-none placeholder:text-[#8b735f] focus-visible:border-[#9c6a22] focus-visible:ring-[#9c6a22]/18'
const labelClass = 'text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-[#6f4f3d]'
const errorClass = 'text-xs font-bold text-error'

export function EarlyAccessPage() {
  const { t } = useLanguage()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<EarlyAccessLeadFormValues>({
    resolver: zodResolver(earlyAccessLeadSchema),
    defaultValues,
  })

  return (
    <main className="relative isolate min-h-screen overflow-x-hidden bg-[#f7ecdf] px-3 py-3 text-[#24190f] sm:px-5 sm:py-5 lg:px-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_4%,rgb(244_216_204/.48),transparent_28%),radial-gradient(circle_at_86%_18%,rgb(132_158_146/.28),transparent_28%),linear-gradient(180deg,#fffaf4_0%,#f7ecdf_44%,#f0dcc4_100%)]" />

      <div className="relative mx-auto grid min-h-[calc(100svh-1.5rem)] max-w-7xl gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(390px,470px)] lg:items-stretch">
        <section className="relative overflow-hidden rounded-[1.4rem] bg-[#21140d] p-5 text-[#fff7ea] shadow-panel sm:rounded-[1.75rem] sm:p-8 lg:p-10">
          <img src={heroImage} alt="" className="absolute inset-0 size-full object-cover opacity-34 saturate-[.92]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(24_13_8/.94)_0%,rgb(24_13_8/.82)_48%,rgb(24_13_8/.48)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(0deg,rgb(39_63_59/.78),transparent)]" />
          <div className="absolute bottom-0 left-0 h-1 w-full bg-[linear-gradient(90deg,#84a092,#f2c978,#d99c84)]" />

          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <header className="flex items-center justify-between gap-4">
              <Link to="/" className="font-serif text-2xl font-semibold text-[#fff7ea]">
                Medellin Rewards
              </Link>
              <LanguagePicker compact className="text-[#fff7ea]" />
            </header>

            <article className="max-w-3xl space-y-6">
              <p className="flex w-fit items-center gap-2 rounded-full border border-[#84a092]/34 bg-[#84a092]/16 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#d8ede4]">
                <Sparkles className="size-4" />
                {t('Early adopter list')}
              </p>
              <h1 className="max-w-3xl text-wrap font-serif text-[clamp(2.7rem,9vw,4rem)] font-semibold leading-[0.9] sm:text-[clamp(4.2rem,7vw,6.8rem)]">
                {t('A note before we launch.')}
              </h1>
              <div className="max-w-2xl space-y-4 text-base font-semibold leading-7 text-[#fff7ea]/84 sm:text-lg sm:leading-8">
                <p>
                  {t('We are building Medellin Rewards for people who want more value from the places they already visit.')}
                </p>
                <p>
                  {t('When we start, members will be able to spend with participating local businesses and earn 20-100% back as reward points, depending on the offer.')}
                </p>
                <p>
                  {t('Join the early adopter list and we will send you the first invite when the program opens.')}
                </p>
              </div>
            </article>

            <div className="grid gap-2 rounded-[1.1rem] border border-[#fff7ea]/14 bg-[#fff7ea]/8 p-2 backdrop-blur sm:grid-cols-3">
              {[
                ['20-100%', 'Back in reward points'],
                ['Early', 'First launch invite'],
                ['Local', 'Partner perks and offers'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-[0.9rem] p-3">
                  <p className="font-serif text-3xl leading-none text-[#f2c978]">{value}</p>
                  <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#fff7ea]/70">{t(label)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-[1.4rem] border border-[#ddb886] bg-[#fff7ec] p-5 shadow-panel sm:rounded-[1.75rem] sm:p-6 lg:p-7">
            {isSubmitted ? (
              <div className="space-y-6 py-10 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-[1.2rem] bg-[#273f3b]/10 text-[#273f3b]">
                  <BadgeCheck className="size-8" />
                </div>
                <div className="space-y-3">
                  <h2 className="font-serif text-4xl leading-tight text-[#24190f]">{t("You're on the early list.")}</h2>
                  <p className="mx-auto max-w-sm text-sm font-medium leading-6 text-[#6f4f3d]">
                    {t('We saved your details. We will reach out when Medellin Rewards is ready for early adopters.')}
                  </p>
                </div>
                <Button asChild className="rounded-full bg-[#273f3b] text-[#fff7ea] hover:bg-[#1e312e]">
                  <Link to="/">{t('Back to home')}</Link>
                </Button>
              </div>
            ) : (
              <form
                className="space-y-5"
                onSubmit={form.handleSubmit(async (values) => {
                  try {
                    setSubmitError(null)
                    await earlyAccessService.createLead(values)
                    form.reset(defaultValues)
                    setIsSubmitted(true)
                  } catch (error) {
                    setSubmitError(error instanceof Error ? error.message : t('Unable to join the early access list.'))
                  }
                })}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#273f3b]/10 text-[#273f3b]">
                      <Mail className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#9c6a22]">{t('Get notified')}</p>
                      <h2 className="font-serif text-3xl leading-tight text-[#24190f]">{t('Become an early adopter')}</h2>
                    </div>
                  </div>
                  <p className="text-sm font-medium leading-6 text-[#6f4f3d]">
                    {t('Leave your email, WhatsApp, or both. We will only use this to send launch updates and early access details.')}
                  </p>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="early-name" className={labelClass}>{t('Name')}</Label>
                  <Input id="early-name" className={inputClass} placeholder={t('Your name')} {...form.register('fullName')} />
                  {form.formState.errors.fullName ? <p className={errorClass}>{t(form.formState.errors.fullName.message ?? '')}</p> : null}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="early-email" className={labelClass}>{t('Email')}</Label>
                  <Input id="early-email" className={inputClass} type="email" placeholder="you@example.com" {...form.register('email')} />
                  {form.formState.errors.email ? <p className={errorClass}>{t(form.formState.errors.email.message ?? '')}</p> : null}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="early-whatsapp" className={labelClass}>{t('WhatsApp number')}</Label>
                  <Input id="early-whatsapp" className={inputClass} type="tel" placeholder="+57 300 000 0000" {...form.register('whatsapp')} />
                  {form.formState.errors.whatsapp ? <p className={errorClass}>{t(form.formState.errors.whatsapp.message ?? '')}</p> : null}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="early-notes" className={labelClass}>{t('Anything we should know?')}</Label>
                  <Textarea
                    id="early-notes"
                    className="min-h-20 rounded-xl border-[#d9b98e] bg-[#fffaf2] px-3.5 py-3 text-sm text-[#24190f] shadow-none placeholder:text-[#8b735f] focus-visible:border-[#9c6a22] focus-visible:ring-[#9c6a22]/18"
                    placeholder={t('Optional')}
                    {...form.register('notes')}
                  />
                  {form.formState.errors.notes ? <p className={errorClass}>{t(form.formState.errors.notes.message ?? '')}</p> : null}
                </div>

                <label className="flex items-start gap-2 rounded-xl border border-[#ddb886] bg-[#fffaf2] p-3 text-xs font-semibold leading-5 text-[#6f4f3d]">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 rounded border-[#d9b98e] accent-[#273f3b]"
                    {...form.register('marketingConsent')}
                  />
                  <span>{t('I agree to be contacted about Medellin Rewards launch updates and early access.')}</span>
                </label>
                {form.formState.errors.marketingConsent ? <p className={errorClass}>{t(form.formState.errors.marketingConsent.message ?? '')}</p> : null}

                {submitError ? (
                  <div className="rounded-xl border border-error/20 bg-error/10 p-3 text-sm font-bold text-error">
                    {t(submitError)}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-full bg-[#21140d] text-[#fff7ea] shadow-soft hover:bg-[#273f3b]"
                  isLoading={form.formState.isSubmitting}
                >
                  <MessageCircle className="size-4" />
                  {t('Join early access')}
                  <ArrowRight className="size-4" />
                </Button>

                <p className="text-center text-xs font-medium text-[#6f4f3d]">
                  {t('Prefer the full member signup?')} <Link to="/join" className="font-bold text-[#273f3b] hover:underline">{t('Go to member signup')}</Link>
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
