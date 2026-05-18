import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { earlyAccessService } from '@/integrations/supabase/services/early-access-service'
import { useLanguage } from '@/lib/language'
import { earlyAccessLeadSchema, type EarlyAccessLeadFormValues } from '@/types/forms'
import {
  earlyAccessMessageLines,
  earlyAccessSubscribeButtonLabel,
  earlyAccessSubscribeFields,
  earlyAccessSubscribePrompt,
} from '../early-access-content'

const defaultValues: EarlyAccessLeadFormValues = {
  fullName: '',
  email: '',
  whatsapp: '',
  notes: '',
  marketingConsent: true,
}

const inputClass =
  'h-12 w-full rounded-md border border-black bg-white px-3.5 text-base text-black placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-black/20'
const labelClass = 'text-xs font-bold uppercase text-neutral-700'
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
    <main className="min-h-screen overflow-x-hidden bg-white text-neutral-950">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-5 py-10 sm:px-8 lg:px-12">
        <section className="w-full space-y-7">
          <p className="text-6xl font-semibold leading-none sm:text-7xl lg:text-8xl">
            {earlyAccessMessageLines[0]}
          </p>

          <div className="max-w-4xl space-y-5 text-xl font-medium leading-8 text-neutral-950 sm:text-2xl sm:leading-10">
            <p>{earlyAccessMessageLines[1]}</p>
            <p>{earlyAccessMessageLines[2]}</p>
            <p>{earlyAccessMessageLines[3]}</p>
            <p>{earlyAccessMessageLines[4]}</p>
          </div>

          <div className="space-y-5">
            <p className="text-5xl font-semibold leading-none sm:text-6xl">
              {earlyAccessMessageLines[5]}
            </p>

            {isSubmitted ? (
              <div className="max-w-xl space-y-3 border-l-2 border-black pl-4">
                <h2 className="text-3xl font-semibold leading-tight text-black">{t("You're on the early list.")}</h2>
                <p className="text-base font-medium leading-7 text-neutral-700">
                  {t('We saved your details. We will reach out when Medellin Rewards is ready for early adopters.')}
                </p>
              </div>
            ) : (
              <form
                className="max-w-xl space-y-5"
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
                <p className="text-base font-medium leading-7 text-neutral-700">
                  {earlyAccessSubscribePrompt}
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  {earlyAccessSubscribeFields.map((field) => (
                    <div key={field.name} className="grid gap-3">
                      <label htmlFor={`early-${field.name}`} className={labelClass}>{field.label}</label>
                      <input
                        id={`early-${field.name}`}
                        className={inputClass}
                        type={field.type}
                        placeholder={field.placeholder}
                        {...form.register(field.name)}
                      />
                      {form.formState.errors[field.name] ? (
                        <p className={errorClass}>{t(form.formState.errors[field.name]?.message ?? '')}</p>
                      ) : null}
                    </div>
                  ))}
                </div>

                {submitError ? (
                  <div className="rounded-md border border-black p-3 text-sm font-bold text-black">
                    {t(submitError)}
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="h-12 rounded-md bg-black px-8 text-base font-bold text-white disabled:opacity-60"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? t('Submitting...') : earlyAccessSubscribeButtonLabel}
                </button>
              </form>
            )}
          </div>

          <div className="space-y-1 text-lg font-semibold leading-7 text-neutral-950 sm:text-xl">
            <p>{earlyAccessMessageLines[6]}</p>
            <p>{earlyAccessMessageLines[7]}</p>
          </div>
        </section>
      </div>
    </main>
  )
}
