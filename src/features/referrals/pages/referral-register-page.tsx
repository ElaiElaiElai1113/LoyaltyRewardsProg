import { zodResolver } from '@hookform/resolvers/zod'
import { Gift, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'

import { LanguagePicker } from '@/components/language-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { authSchema, type AuthFormValues } from '@/types/forms'

const defaultValues: AuthFormValues = {
  fullName: '',
  email: '',
  password: '',
  role: 'customer',
}

function LoadingSpinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2Z"
      />
    </svg>
  )
}

export function ReferralRegisterPage() {
  const [searchParams] = useSearchParams()
  const { signUp } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [signUpComplete, setSignUpComplete] = useState(false)
  const referrerId = searchParams.get('ref')
  const businessId = searchParams.get('business')

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues,
  })

  const hasReferral = Boolean(referrerId)

  return (
    <main className="min-h-screen bg-transparent px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-10 lg:grid-cols-[1fr_480px]">
        <section className="flex min-h-[32rem] flex-col justify-between overflow-hidden rounded-[2.5rem] bg-[linear-gradient(135deg,#18215a,#283593_52%,#c026d3)] px-8 py-12 text-white shadow-card md:px-14 md:py-16">
          <div className="flex items-center justify-between gap-4">
            <LanguagePicker className="text-white/80" />
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles className="size-6" />
            </div>
          </div>

          <div className="max-w-4xl space-y-8 py-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-secondary-container">
              <Gift className="size-4" />
              Party Invite
            </div>
            <h1 className="font-serif text-5xl leading-[0.98] tracking-tight md:text-8xl">
              {hasReferral ? 'Create your account to claim the invite.' : 'Create your rewards account.'}
            </h1>
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-white/85 md:text-xl">
              {hasReferral
                ? 'After staff approves the invite, both you and your friend receive a reward credit.'
                : 'Join the loyalty program to earn XP, track reward credits, and redeem rewards.'}
            </p>
          </div>

          <Link to="/signin" className="text-sm font-bold text-white/75 transition hover:text-white">
            Already have an account? Sign in
          </Link>
        </section>

        <section className="flex items-center">
          <div className="w-full quest-panel p-8 md:p-10">
            {signUpComplete ? (
              <div className="space-y-8 text-center">
                <div className="space-y-3">
                  <h2 className="font-serif text-4xl tracking-tight text-primary">Welcome aboard!</h2>
                  <p className="text-sm font-medium leading-relaxed text-on-surface-variant/80">
                    Your invite status is pending. Staff will review it before reward credits are added.
                  </p>
                </div>
                <Button asChild size="lg" className="rounded-full">
                  <Link to="/signin">Go to sign in</Link>
                </Button>
              </div>
            ) : (
              <form
                className="space-y-7"
                onSubmit={form.handleSubmit(async (values) => {
                  try {
                    setError(null)
                    if (referrerId) {
                      sessionStorage.setItem('referralCode', referrerId)
                      if (businessId) {
                        sessionStorage.setItem('referralBusinessId', businessId)
                      }
                    }
                    await signUp({ ...values, role: 'customer' })
                    setSignUpComplete(true)
                    form.reset(defaultValues)
                  } catch (submissionError) {
                    if (
                      submissionError instanceof Error &&
                      submissionError.message.includes('profile could not be loaded')
                    ) {
                      setSignUpComplete(true)
                      form.reset(defaultValues)
                      return
                    }

                    setError(
                      submissionError instanceof Error
                        ? submissionError.message
                        : 'Unable to create the account.',
                    )
                  }
                })}
              >
                <div className="space-y-2 text-center">
                  <h2 className="font-serif text-4xl tracking-tight text-primary">Create Account</h2>
                  <p className="text-sm font-medium text-on-surface-variant/80">
                    Use a new email address to claim this referral offer.
                  </p>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="referral-signup-name">Full Name</Label>
                  <Input id="referral-signup-name" placeholder="Your name" {...form.register('fullName')} />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="referral-signup-email">Email Address</Label>
                  <Input id="referral-signup-email" placeholder="your@email.com" {...form.register('email')} />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="referral-signup-password">Password</Label>
                  <Input
                    id="referral-signup-password"
                    type="password"
                    placeholder="••••••••"
                    {...form.register('password')}
                  />
                </div>

                {error ? <p className="text-center text-sm font-bold text-red-500">{error}</p> : null}

                <Button
                  type="submit"
                  size="lg"
                  className="h-14 w-full rounded-full font-bold tracking-wide"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <LoadingSpinner />
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
