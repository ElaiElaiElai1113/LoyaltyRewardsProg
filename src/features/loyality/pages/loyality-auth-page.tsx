import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  Repeat2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { LoyalityMark } from '@/features/loyality/components/loyality-mark'
import { useAuth } from '@/hooks/use-auth'
import { applyProgramDocumentBrand } from '@/features/tenant/tenant-document-brand'
import { useTenant } from '@/hooks/use-tenant'
import { authService } from '@/integrations/supabase/services/auth-service'
import { getHomePathForRole } from '@/lib/role-routes'
import { resolveSafeInternalRedirect } from '@/lib/safe-internal-redirect'
import { authSchema, type AuthFormValues } from '@/types/forms'
import '@/features/loyality/loyality-app.css'

const defaultValues: AuthFormValues = {
  fullName: '',
  email: '',
  password: '',
  role: 'customer',
}

export function LoyalityAuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signInAutomatically } = useAuth()
  const { program } = useTenant()
  const [showPassword, setShowPassword] = useState(false)
  const [forgotPassword, setForgotPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const saved = sessionStorage.getItem('portalAccessError')
    if (saved) sessionStorage.removeItem('portalAccessError')
    return saved
  })

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues,
  })

  useEffect(() => {
    applyProgramDocumentBrand(program)
  }, [program])

  return (
    <main className="ly-auth">
      <LoyalityAuthStory />
      <section className="ly-auth__form-side">
        <div className="ly-auth-card">
          <Link className="ly-auth-card__back" to="/"><ArrowLeft /> Back to Loyality</Link>
          <div className="ly-auth-card__header">
            <p>Welcome back</p>
            <h2>{forgotPassword ? 'Reset access' : 'Step into your loop.'}</h2>
            <span>
              {forgotPassword
                ? 'Enter your account email and we will send you a secure reset link.'
                : 'Enter your email and password. We will open the workspace assigned to your account.'}
            </span>
          </div>

          {forgotPassword ? (
            <form
              className="ly-auth-form"
              onSubmit={(event) => {
                event.preventDefault()
                const email = form.getValues('email').trim()
                setError(null)
                setMessage(null)
                if (!email) {
                  setError('Enter the email address used for your account.')
                  return
                }
                void authService.resetPassword(email)
                  .then(() => setMessage('Reset link sent. Please check your email.'))
                  .catch((resetError: unknown) => setError(resetError instanceof Error ? resetError.message : 'Unable to send the reset link.'))
              }}
            >
              <div className="ly-field">
                <label htmlFor="loyality-reset-email">Email address</label>
                <input id="loyality-reset-email" type="email" placeholder="you@example.com" {...form.register('email')} />
              </div>
              {message ? <p className="ly-auth__message">{message}</p> : null}
              {error ? <p className="ly-auth__message ly-auth__message--error">{error}</p> : null}
              <button className="ly-auth-submit" type="submit">Send reset link</button>
              <button className="ly-auth-card__back" onClick={() => { setForgotPassword(false); setError(null); setMessage(null) }} type="button">
                <ArrowLeft /> Return to sign in
              </button>
            </form>
          ) : (
            <form
              aria-label="Sign in to Loyality"
              className="ly-auth-form"
              onSubmit={form.handleSubmit(async (values) => {
                try {
                  setError(null)
                  const profile = await signInAutomatically({
                    email: values.email,
                    password: values.password,
                  })
                  navigate(resolveSafeInternalRedirect(searchParams.get('redirect'), getHomePathForRole(profile.role)))
                } catch (signInError) {
                  setError(signInError instanceof Error ? signInError.message : 'Unable to sign in.')
                }
              }, () => setError('Enter a valid email address and password.'))}
            >
              <div className="ly-field">
                <label htmlFor="loyality-email">Email address</label>
                <input id="loyality-email" type="email" autoComplete="email" placeholder="you@example.com" {...form.register('email')} />
              </div>
              <div className="ly-field">
                <label htmlFor="loyality-password">Password</label>
                <div className="ly-password-wrap">
                  <input id="loyality-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Your password" {...form.register('password')} />
                  <button onClick={() => setShowPassword((value) => !value)} type="button" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
              {error ? <p className="ly-auth__message ly-auth__message--error">{error}</p> : null}
              <button className="ly-auth-submit" disabled={form.formState.isSubmitting} type="submit">
                {form.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : <Repeat2 />}
                {form.formState.isSubmitting ? 'Opening your workspace…' : 'Sign in'}
              </button>
              <div className="ly-auth__helper">
                <button onClick={() => { setForgotPassword(true); setError(null) }} type="button">Forgot password?</button>
                <Link to="/join">Create an account</Link>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}

export function LoyalityAuthStory() {
  return (
    <section className="ly-auth__story">
      <Link className="ly-wordmark ly-wordmark--inverse" to="/">
        <span className="ly-wordmark__mark"><LoyalityMark /></span>
        <span><strong>Loyality</strong><small>One business. One loyalty loop.</small></span>
      </Link>
      <div className="ly-auth__story-copy">
        <p className="ly-auth__eyebrow"><Repeat2 /> Your relationship keeps moving</p>
        <h1>Return. <em>Recognized.</em> Rewarded.</h1>
        <p>One simple place for visits, personal offers, vouchers, referrals, and the rewards a business creates for its own customers.</p>
        <div className="ly-auth__loop"><span>Visit</span><span>Scan</span><span>Unlock</span><span>Return</span></div>
      </div>
      <div className="ly-auth__story-footer"><span>Built for real customer relationships</span><span>© 2026 Loyality</span></div>
    </section>
  )
}
