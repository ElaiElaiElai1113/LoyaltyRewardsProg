import { zodResolver } from '@hookform/resolvers/zod'
import { BadgeCheck, Gift, HeartHandshake, Sparkles, TicketPercent, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'

import heroImage from '@/assets/hero.png'
import { Badge } from '@/components/ui/badge'
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

const benefits = [
  {
    icon: WalletCards,
    title: 'Earn rewards',
    body: 'Collect points and credits when you shop with participating local businesses.',
  },
  {
    icon: TicketPercent,
    title: 'Unlock perks',
    body: 'Find member offers, rewards, gift cards, and promotions in one place.',
  },
  {
    icon: HeartHandshake,
    title: 'Share invites',
    body: 'Invite friends and track rewards as the network grows around you.',
  },
]

const joinInputClass =
  'border-[var(--primary)]/22 bg-[var(--cream)]/84 text-[var(--espresso)] shadow-none placeholder:text-[var(--espresso)]/50 focus-visible:ring-[var(--primary)]/25'
const joinLabelClass = 'text-[var(--espresso)]/70'

function homePathForRole(role: string) {
  if (role === 'platform-admin') return '/admin/portal'
  if (role === 'business-owner' || role === 'business-staff') return '/business/dashboard'
  return '/dashboard'
}

export function JoinRewardsPage() {
  const { profile, signUp } = useAuth()
  const [signUpComplete, setSignUpComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues,
  })

  if (profile && !signUpComplete) {
    return <Navigate replace to={homePathForRole(profile.role)} />
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-surface px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--rose-brown)_16%,transparent),transparent_30%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--champagne)_28%,transparent),transparent_32%)]" />
      <div className="relative mx-auto grid min-h-[calc(100svh-3rem)] max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)] lg:items-stretch">
        <section className="relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(145deg,var(--espresso)_0%,color-mix(in_srgb,var(--espresso)_74%,var(--rose-brown))_62%,color-mix(in_srgb,var(--espresso)_58%,var(--rose-brown))_100%)] px-6 py-7 text-[var(--cream)] shadow-panel sm:px-8 lg:px-10">
          <img src={heroImage} alt="" className="absolute inset-0 size-full object-cover opacity-18 mix-blend-screen" />
          <div className="absolute inset-0 bg-[var(--espresso)]/35" />
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[linear-gradient(90deg,var(--blush),var(--champagne),var(--rose-brown))]" />

          <div className="relative z-10 flex h-full flex-col justify-between gap-8">
            <div className="flex items-center justify-between gap-4">
              <Badge className="border-[var(--champagne)]/30 bg-white/10 text-[var(--cream)]">
                Join the Rewards Club
              </Badge>
              <Link to="/signin" className="text-sm font-bold text-[var(--cream)]/72 transition hover:text-[var(--cream)]">
                Sign in
              </Link>
            </div>

            <div className="max-w-3xl space-y-5">
              <h1 className="font-serif text-[clamp(3rem,7vw,6.8rem)] font-semibold leading-[0.92] tracking-[0.01em]">
                Rewards for the places you already enjoy.
              </h1>
              <p className="max-w-2xl text-base font-medium leading-7 text-[var(--cream)]/84 sm:text-lg">
                Create a free member account to earn points, discover local perks, redeem rewards,
                and keep every visit connected to your rewards balance.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full bg-[var(--champagne)] text-[var(--espresso)] hover:bg-[var(--cream)]">
                  <a href="#join-form">Create free account</a>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full border-[var(--champagne)]/40 bg-white/5 text-[var(--cream)] hover:bg-white/10">
                  <Link to="/rewards">Browse rewards</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="rounded-[1rem] border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <benefit.icon className="size-5 text-[var(--champagne)]" />
                  <h2 className="mt-3 font-serif text-xl leading-tight text-[var(--cream)]">{benefit.title}</h2>
                  <p className="mt-2 text-xs font-medium leading-5 text-[var(--cream)]/74">{benefit.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="join-form" className="flex items-center">
          <div className="w-full rounded-[1.75rem] border border-[var(--primary)]/22 bg-[linear-gradient(145deg,#fff8ec_0%,#f6dfc7_100%)] p-6 text-[var(--espresso)] shadow-panel sm:p-8">
            {signUpComplete ? (
              <div className="space-y-7 py-8 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-[1.35rem] bg-[var(--primary)]/12 text-[var(--primary)]">
                  <BadgeCheck className="size-8" />
                </div>
                <div className="space-y-3">
                  <h2 className="font-serif text-4xl leading-tight text-[var(--espresso)]">Welcome to the Rewards Club.</h2>
                  <p className="mx-auto max-w-md text-sm font-medium leading-6 text-[var(--espresso)]/72">
                    Your account request is saved. Check your email if verification is required, then sign in to start earning.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild className="rounded-full bg-[var(--espresso)] text-[var(--cream)] hover:bg-[var(--rose-brown)]">
                    <Link to="/signin">Go to sign in</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-[var(--espresso)]/20 bg-[var(--cream)]/40 text-[var(--espresso)] hover:bg-[var(--cream)]/70">
                    <Link to="/rewards">View rewards</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(async (values) => {
                  try {
                    setError(null)
                    await signUp({ ...values, role: 'customer' })
                    form.reset(defaultValues)
                    setSignUpComplete(true)
                  } catch (submissionError) {
                    if (
                      submissionError instanceof Error &&
                      submissionError.message.includes('profile could not be loaded')
                    ) {
                      form.reset(defaultValues)
                      setSignUpComplete(true)
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
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--primary)]/12 text-[var(--primary)]">
                    <Sparkles className="size-6" />
                  </div>
                  <h2 className="font-serif text-3xl text-[var(--espresso)]">Create your free account</h2>
                  <p className="text-sm font-medium leading-6 text-[var(--espresso)]/72">
                    Join once and keep your rewards connected across the network.
                  </p>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="join-name" className={joinLabelClass}>Full name</Label>
                  <Input id="join-name" className={joinInputClass} placeholder="Your name" {...form.register('fullName')} />
                  {form.formState.errors.fullName ? (
                    <p className="text-xs font-bold text-error">{form.formState.errors.fullName.message}</p>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="join-email" className={joinLabelClass}>Email address</Label>
                  <Input id="join-email" className={joinInputClass} type="email" placeholder="your@email.com" {...form.register('email')} />
                  {form.formState.errors.email ? (
                    <p className="text-xs font-bold text-error">{form.formState.errors.email.message}</p>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="join-password" className={joinLabelClass}>Password</Label>
                  <Input id="join-password" className={joinInputClass} type="password" placeholder="••••••••" {...form.register('password')} />
                  {form.formState.errors.password ? (
                    <p className="text-xs font-bold text-error">{form.formState.errors.password.message}</p>
                  ) : null}
                </div>

                {error ? (
                  <div className="rounded-[1rem] border border-error/20 bg-error/10 p-4 text-sm font-bold text-error">
                    {error}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="h-14 w-full rounded-full bg-[var(--espresso)] text-[var(--cream)] shadow-soft hover:bg-[var(--rose-brown)]"
                  isLoading={form.formState.isSubmitting}
                >
                  <Gift className="size-4" />
                  Join the Rewards Club
                </Button>

                <p className="text-center text-xs font-medium text-[var(--espresso)]/62">
                  Already a member? <Link to="/signin" className="font-bold text-[var(--primary)] hover:underline">Sign in</Link>
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
