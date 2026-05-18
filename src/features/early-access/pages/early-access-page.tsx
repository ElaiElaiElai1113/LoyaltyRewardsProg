import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, BadgeCheck, Coins, Mail, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import heroImage from '@/assets/medellinrewards-hero.webp'
import { LanguagePicker } from '@/components/language-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { earlyAccessService } from '@/integrations/supabase/services/early-access-service'
import { useLanguage } from '@/lib/language'
import { earlyAccessLeadSchema, type EarlyAccessLeadFormValues } from '@/types/forms'
import {
  earlyAccessMessageLines,
  earlyAccessSubscribeButtonLabel,
  earlyAccessSubscribeFields,
} from '../early-access-content'

const defaultValues: EarlyAccessLeadFormValues = {
  fullName: '',
  email: '',
  whatsapp: '',
  notes: '',
  marketingConsent: false,
}

const inputClass =
  'h-12 rounded-xl border-[#d9b98e] bg-[#fffaf2] px-3.5 text-sm font-semibold text-[#24190f] shadow-none placeholder:text-[#8b735f] focus-visible:border-[#9c6a22] focus-visible:ring-[#9c6a22]/18'
const labelClass = 'text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-[#6f4f3d]'
const errorClass = 'text-xs font-bold text-error'

export function EarlyAccessPage() {
  const { t } = useLanguage()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const rewardsLine = earlyAccessMessageLines[2]
  const rewardsProgramPhrase = 'highest-paying rewards program'
  const rewardsBackPhrase = '20-100% back'
  const rewardsProgramIndex = rewardsLine.indexOf(rewardsProgramPhrase)
  const rewardsBackIndex = rewardsLine.indexOf(rewardsBackPhrase)
  const noExtraLine = earlyAccessMessageLines[3]
  const noExtraPhrase = 'No extra spending.'

  const form = useForm<EarlyAccessLeadFormValues>({
    resolver: zodResolver(earlyAccessLeadSchema),
    defaultValues,
  })

  return (
    <main className="relative isolate min-h-screen overflow-x-hidden bg-[#21140d] text-[#fff7ea]">
      <img src={heroImage} alt="" className="absolute inset-0 -z-30 size-full object-cover opacity-42 saturate-[0.9]" />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgb(24_13_8/.97)_0%,rgb(24_13_8/.91)_48%,rgb(24_13_8/.66)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(24_13_8/.36)_0%,rgb(24_13_8/.82)_100%)]" />

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="font-serif text-2xl font-semibold text-[#fff7ea]">
            Medellin Rewards
          </Link>
          <LanguagePicker compact className="text-[#fff7ea]" />
        </header>

        <div className="grid flex-1 gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)] lg:items-center lg:gap-12 lg:py-10">
          <section className="max-w-3xl space-y-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#f2c978]/42 bg-[#f2c978]/14 px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#f2c978]">
              <Sparkles className="size-4" />
              {t('Early access')}
            </p>

            <div className="space-y-5">
              <p className="font-serif text-[clamp(3rem,9vw,5.8rem)] font-semibold leading-[0.85] tracking-normal text-[#fff7ea]">
                {earlyAccessMessageLines[0]}
              </p>

              <div className="max-w-2xl space-y-4 text-base font-semibold leading-7 text-[#fff7ea]/86 sm:text-lg sm:leading-8">
                <p>{earlyAccessMessageLines[1]}</p>
                <p>
                  {rewardsLine.slice(0, rewardsProgramIndex)}
                  <span className="text-[#f2c978]">{rewardsProgramPhrase}</span>
                  {rewardsLine.slice(rewardsProgramIndex + rewardsProgramPhrase.length, rewardsBackIndex)}
                  <span className="text-[#f2c978]">{rewardsBackPhrase}</span>
                  {rewardsLine.slice(rewardsBackIndex + rewardsBackPhrase.length)}
                </p>
                <p>
                  <span className="font-extrabold text-[#fff7ea]">{noExtraPhrase}</span>
                  {noExtraLine.slice(noExtraPhrase.length)}
                </p>
                <p>{earlyAccessMessageLines[4]}</p>
              </div>

              <div className="space-y-4 border-l-2 border-[#f2c978] pl-4">
                <p className="font-serif text-[clamp(2.2rem,7vw,4.2rem)] font-semibold leading-[0.9] text-[#fff7ea]">
                  {earlyAccessMessageLines[5]}
                </p>
              </div>

              <div className="space-y-1 text-sm font-bold leading-6 text-[#ead9c2] sm:text-base">
                <p>{earlyAccessMessageLines[6]}</p>
                <p>{earlyAccessMessageLines[7]}</p>
              </div>
            </div>

            <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                { icon: Coins, value: '20-100%', label: 'Back on daily buys' },
                { icon: ShieldCheck, value: 'No extra', label: 'spending required' },
                { icon: BadgeCheck, value: 'Early', label: 'exclusive benefits' },
              ].map((item) => (
                <div key={item.label} className="border-t border-[#fff7ea]/16 pt-3">
                  <item.icon className="mb-3 size-5 text-[#f2c978]" />
                  <p className="font-serif text-3xl leading-none text-[#fff7ea]">{item.value}</p>
                  <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-[#ead9c2]/78">{item.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex items-center">
            <div className="w-full rounded-[1.35rem] border border-[#f2c978]/42 bg-[#fff7ec] p-5 text-[#24190f] shadow-panel sm:p-6 lg:p-7">
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
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#9c6a22]">{t('Early adopter list')}</p>
                      <h2 className="font-serif text-3xl leading-tight text-[#24190f]">{earlyAccessSubscribeButtonLabel}</h2>
                    </div>
                  </div>
                  <p className="text-sm font-medium leading-6 text-[#6f4f3d]">
                    Enter your WhatsApp number and/or email
                  </p>
                </div>

                {earlyAccessSubscribeFields.map((field) => (
                  <div key={field.name} className="grid gap-3">
                    <Label htmlFor={`early-${field.name}`} className={labelClass}>{field.label}</Label>
                    <Input
                      id={`early-${field.name}`}
                      className={inputClass}
                      type={field.type}
                      placeholder={field.placeholder}
                      {...form.register(field.name)}
                    />
                    {form.formState.errors[field.name] ? <p className={errorClass}>{t(form.formState.errors[field.name]?.message ?? '')}</p> : null}
                  </div>
                ))}

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
                  {earlyAccessSubscribeButtonLabel}
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
      </div>
    </main>
  )
}
