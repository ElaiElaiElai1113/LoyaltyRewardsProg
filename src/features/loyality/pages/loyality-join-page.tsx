import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, BadgeCheck, Eye, EyeOff, LoaderCircle, Repeat2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useSearchParams } from 'react-router'

import { LanguagePicker } from '@/components/language-picker'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/lib/language'
import { getHomePathForRole } from '@/lib/role-routes'
import { PASSWORD_MIN_LENGTH } from '@/lib/password-setup'
import { resolveSafeInternalRedirect } from '@/lib/safe-internal-redirect'
import { memberSignUpSchema, type MemberSignUpFormValues } from '@/types/forms'
import '@/features/loyality/loyality-app.css'
import { LoyalityAuthStory } from './loyality-auth-page'

const defaultValues: MemberSignUpFormValues = {
  fullName: '', email: '', phone: '', password: '', role: 'customer',
}

export function LoyalityJoinPage() {
  const { profile, signUp } = useAuth()
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const [complete, setComplete] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const form = useForm<MemberSignUpFormValues>({ resolver: zodResolver(memberSignUpSchema), defaultValues })
  const redirect = resolveSafeInternalRedirect(searchParams.get('redirect'), '')
  const signInPath = redirect ? `/signin?redirect=${encodeURIComponent(redirect)}` : '/signin'

  if (profile && !complete) return <Navigate replace to={getHomePathForRole(profile.role)} />

  return (
    <main className="ly-auth">
      <LoyalityAuthStory />
      <section className="ly-auth__form-side">
        <div className="ly-auth-card">
          <div className="ly-auth-card__toolbar"><Link className="ly-auth-card__back" to="/"><ArrowLeft /> {t('Back to Loyality')}</Link><LanguagePicker className="ly-auth-card__language" compact condenseOnNarrowScreens /></div>
          {complete ? (
            <div className="ly-auth-card__header">
              <BadgeCheck className="size-12 text-[var(--ly-coral)]" />
              <p className="mt-6">{t('Your loop starts here')}</p>
              <h2>{t('Account created.')}</h2>
              <span>{t('Your customer account is ready. Sign in to open your personal QR and begin recording visits.')}</span>
              {warning ? <p className="ly-auth__message mt-5">{warning}</p> : null}
              <Link className="ly-auth-submit mt-6" to={signInPath}><Repeat2 /> {t('Go to sign in')}</Link>
            </div>
          ) : (
            <>
              <div className="ly-auth-card__header">
                <p>{t('Customer membership')}</p>
                <h2>{t('Join the loop.')}</h2>
                <span>{t('Create one simple account for your visits, vouchers, personal offers, and referral rewards.')}</span>
              </div>
              <form
                className="ly-auth-form"
                onSubmit={form.handleSubmit(async (values) => {
                  try {
                    setError(null)
                    const result = await signUp({ ...values, role: 'customer' })
                    setWarning(result.warning ?? null)
                    form.reset(defaultValues)
                    setComplete(true)
                  } catch (signUpError) {
                    if (signUpError instanceof Error && signUpError.message.includes('profile could not be loaded')) {
                      setComplete(true)
                      return
                    }
                    setError(signUpError instanceof Error ? t(signUpError.message) : t('Unable to create the account.'))
                  }
                })}
              >
                <div className="ly-field">
                  <label htmlFor="loyality-name">{t('Full name')}</label>
                  <input id="loyality-name" placeholder={t('Your name')} autoComplete="name" {...form.register('fullName')} />
                </div>
                <div className="ly-field">
                  <label htmlFor="loyality-join-email">{t('Email address')}</label>
                  <input id="loyality-join-email" placeholder="you@example.com" type="email" autoComplete="email" {...form.register('email')} />
                </div>
                <div className="ly-field">
                  <label htmlFor="loyality-phone">{t('Phone number')}</label>
                  <input id="loyality-phone" placeholder={t('Your mobile number')} type="tel" autoComplete="tel" {...form.register('phone')} />
                </div>
                <div className="ly-field">
                  <label htmlFor="loyality-join-password">{t('Create password')}</label>
                  <div className="ly-password-wrap">
                    <input id="loyality-join-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder={t('At least {count} characters', { count: PASSWORD_MIN_LENGTH })} {...form.register('password')} />
                    <button onClick={() => setShowPassword((value) => !value)} type="button" aria-label={showPassword ? t('Hide password') : t('Show password')}>{showPassword ? <EyeOff /> : <Eye />}</button>
                  </div>
                </div>
                {Object.values(form.formState.errors)[0]?.message ? <p className="ly-auth__message ly-auth__message--error">{t(Object.values(form.formState.errors)[0]?.message)}</p> : null}
                {error ? <p className="ly-auth__message ly-auth__message--error">{error}</p> : null}
                <button className="ly-auth-submit" disabled={form.formState.isSubmitting} type="submit">
                  {form.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : <Repeat2 />}
                  {form.formState.isSubmitting ? t('Creating your account…') : t('Create customer account')}
                </button>
                <div className="ly-auth__helper"><span>{t('Already a member?')}</span><Link to={signInPath}>{t('Sign in')}</Link></div>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
