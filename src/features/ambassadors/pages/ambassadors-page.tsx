import { zodResolver } from '@hookform/resolvers/zod'
import { BadgeCheck, Camera, Crown, Gift, HeartHandshake, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'

import heroImage from '@/assets/hero.png'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ambassadorService } from '@/integrations/supabase/services/ambassador-service'
import { useBusinesses } from '@/hooks/use-customer-data'
import { ambassadorLeadSchema, type AmbassadorLeadFormValues } from '@/types/forms'

const defaultValues: AmbassadorLeadFormValues = {
  fullName: '',
  email: '',
  phone: '',
  city: '',
  instagram: '',
  tiktok: '',
  otherSocial: '',
  notes: '',
  marketingConsent: false,
}

const perks = [
  {
    icon: Gift,
    title: 'Curated perks',
    body: 'Get early access to local rewards, member offers, and shareable moments.',
  },
  {
    icon: Camera,
    title: 'Creator-ready invites',
    body: 'Share through socials, group chats, guides, and everyday recommendations.',
  },
  {
    icon: HeartHandshake,
    title: 'Community access',
    body: 'Connect people with cafes, shops, and experiences that feel worth recommending.',
  },
]

const creatorSignals = ['Lifestyle creators', 'Social connectors', 'Community hosts']

const compactLabelClass = 'ml-0 text-[0.58rem] tracking-[0.18em] sm:text-[0.62rem]'
const compactInputClass = 'h-9 rounded-xl px-3 py-2 text-sm shadow-none sm:h-10'
const compactTextareaClass = 'min-h-14 rounded-xl px-3 py-2 text-sm shadow-none sm:min-h-16'
const compactErrorClass = 'text-[0.62rem] font-bold leading-3 text-error'

export function AmbassadorsPage() {
  const [searchParams] = useSearchParams()
  const businesses = useBusinesses()
  const businessId = searchParams.get('business')
  const linkedBusiness = businesses.data?.find((business) => business.id === businessId) ?? null
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<AmbassadorLeadFormValues>({
    resolver: zodResolver(ambassadorLeadSchema),
    defaultValues,
  })

  return (
    <main className="ornate-page relative isolate h-[100svh] overflow-hidden px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <div className="mx-auto grid h-full max-w-7xl gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(390px,480px)] xl:grid-cols-[minmax(0,1fr)_500px] xl:items-stretch">
        <section className="relative hidden overflow-hidden rounded-[1.6rem] warm-hero px-8 py-7 text-white shadow-card lg:block xl:px-10">
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 -z-10 size-full object-cover opacity-25 mix-blend-screen"
          />
          <div className="absolute inset-0 -z-10 bg-[var(--espresso)]/45" />

          <div className="flex h-full min-h-0 flex-col justify-between gap-6">
            <div className="flex items-center justify-between gap-4">
              <Badge className="border-white/15 bg-white/10 text-white">
                Creator circle invites
              </Badge>
              <Link to="/shop" className="text-sm font-bold text-white/72 transition hover:text-white">
                View rewards
              </Link>
            </div>

            <div className="max-w-4xl space-y-5">
              {linkedBusiness ? (
                <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2">
                  {linkedBusiness.logoUrl ? (
                    <img src={linkedBusiness.logoUrl} alt={linkedBusiness.name} className="size-8 rounded-full object-cover" />
                  ) : (
                    <span className="flex size-8 items-center justify-center rounded-full bg-white/15 text-xs font-black uppercase">
                      {linkedBusiness.name.slice(0, 1)}
                    </span>
                  )}
                  <span className="text-sm font-bold uppercase tracking-[0.12em] text-white/90">{linkedBusiness.name}</span>
                </div>
              ) : null}

              <div className="space-y-4">
                <h1 className="font-serif text-[clamp(3.4rem,6vw,6rem)] font-semibold leading-[0.92] tracking-[0.01em]">
                  Share what you love. Unlock member rewards.
                </h1>
                <p className="max-w-2xl text-sm font-medium leading-6 text-white/82 xl:text-base">
                  For creators, hosts, and social connectors who recommend places, perks,
                  and experiences their circle will actually use.
                </p>
                <div className="flex flex-wrap gap-2">
                  {creatorSignals.map((signal) => (
                    <span key={signal} className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/78">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {perks.map((perk) => (
                <div key={perk.title} className="rounded-[1rem] border border-white/12 bg-white/10 p-3 backdrop-blur">
                  <perk.icon className="size-4 text-white" />
                  <h2 className="mt-3 font-serif text-base leading-tight text-white">{perk.title}</h2>
                  <p className="mt-1.5 text-[0.68rem] font-medium leading-4 text-white/72">{perk.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-0 items-stretch">
          <div className="h-full min-h-0 w-full overflow-hidden rounded-[1.4rem] border border-[#d8a36a]/30 bg-[linear-gradient(145deg,var(--card)_0%,#fff7ef_58%,#f7e2cf_100%)] p-3 text-card-foreground shadow-card sm:p-4 lg:rounded-[1.6rem] lg:p-5 xl:p-6">
            {isSubmitted ? (
              <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-[1.2rem] bg-primary-container/12 text-primary">
                  <BadgeCheck className="size-7" />
                </div>
                <div className="space-y-3">
                  <h2 className="font-serif text-3xl leading-tight text-primary sm:text-4xl">
                    You&apos;re part of the best rewards platform in the world!
                  </h2>
                  <p className="mx-auto max-w-md text-sm font-medium leading-6 text-on-surface-variant/80">
                    We saved your creator request. Curated discounts and next steps will be sent after our team reviews your details.
                  </p>
                </div>
                <Button asChild variant="secondary" size="lg" className="rounded-full">
                  <Link to="/shop">Browse rewards</Link>
                </Button>
              </div>
            ) : (
              <form
                className="flex h-full min-h-0 flex-col gap-2.5"
                onSubmit={form.handleSubmit(async (values) => {
                  try {
                    setSubmitError(null)
                    await ambassadorService.createLead(values, businessId)
                    form.reset(defaultValues)
                    setIsSubmitted(true)
                  } catch (error) {
                    setSubmitError(error instanceof Error ? error.message : 'Unable to submit ambassador request.')
                  }
                })}
              >
                <div className="space-y-1 text-center">
                  <div className="mx-auto hidden size-9 items-center justify-center rounded-xl bg-[#c9891f]/12 text-[#a26618] sm:flex">
                    <Crown className="size-5" />
                  </div>
                  <h2 className="font-serif text-2xl leading-none text-primary sm:text-3xl">Join the Creator Circle</h2>
                  <p className="text-xs font-medium leading-5 text-on-surface-variant/80">
                    Tell us where you share recommendations and how we can reach you.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="grid gap-1">
                    <Label htmlFor="ambassador-name" className={compactLabelClass}>Full name</Label>
                    <Input id="ambassador-name" className={compactInputClass} placeholder="Alex Rivera" {...form.register('fullName')} />
                    {form.formState.errors.fullName ? <p className={compactErrorClass}>{form.formState.errors.fullName.message}</p> : null}
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="ambassador-email" className={compactLabelClass}>Email</Label>
                    <Input id="ambassador-email" className={compactInputClass} type="email" placeholder="alex@example.com" {...form.register('email')} />
                    {form.formState.errors.email ? <p className={compactErrorClass}>{form.formState.errors.email.message}</p> : null}
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="ambassador-phone" className={compactLabelClass}>Phone</Label>
                    <Input id="ambassador-phone" className={compactInputClass} placeholder="Optional" {...form.register('phone')} />
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="ambassador-city" className={compactLabelClass}>Location</Label>
                    <Input id="ambassador-city" className={compactInputClass} placeholder="Medellin" {...form.register('city')} />
                    {form.formState.errors.city ? <p className={compactErrorClass}>{form.formState.errors.city.message}</p> : null}
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="grid gap-1">
                    <Label htmlFor="ambassador-instagram" className={compactLabelClass}>Instagram</Label>
                    <Input id="ambassador-instagram" className={compactInputClass} placeholder="@yourhandle or profile link" {...form.register('instagram')} />
                    {form.formState.errors.instagram ? <p className={compactErrorClass}>{form.formState.errors.instagram.message}</p> : null}
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="ambassador-tiktok" className={compactLabelClass}>TikTok</Label>
                    <Input id="ambassador-tiktok" className={compactInputClass} placeholder="@yourhandle or profile link" {...form.register('tiktok')} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="ambassador-other" className={compactLabelClass}>Other social link</Label>
                    <Input id="ambassador-other" className={compactInputClass} placeholder="YouTube, blog, community, or another profile" {...form.register('otherSocial')} />
                  </div>
                </div>

                <div className="grid gap-1">
                  <Label htmlFor="ambassador-notes" className={compactLabelClass}>Where do you usually recommend places?</Label>
                  <Textarea
                    id="ambassador-notes"
                    className={compactTextareaClass}
                    placeholder="Group chats, hotel guests, Instagram stories, neighborhood guides..."
                    {...form.register('notes')}
                  />
                  {form.formState.errors.notes ? <p className={compactErrorClass}>{form.formState.errors.notes.message}</p> : null}
                </div>

                <label className="flex items-start gap-2 rounded-xl border border-outline-variant/20 bg-surface-low p-2.5 text-xs font-medium leading-5 text-on-surface-variant/85 sm:p-3">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 rounded border-outline-variant accent-[var(--primary)]"
                    {...form.register('marketingConsent')}
                  />
                  <span>
                    I am 18 or older and agree to be contacted with rewards, discounts, and ambassador next steps.
                  </span>
                </label>
                {form.formState.errors.marketingConsent ? (
                  <p className={compactErrorClass}>{form.formState.errors.marketingConsent.message}</p>
                ) : null}

                {submitError ? (
                  <div className="rounded-xl border border-error/20 bg-error/10 p-2.5 text-xs font-bold text-error">
                    {submitError}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="mt-auto h-11 w-full rounded-full text-sm sm:h-12"
                  isLoading={form.formState.isSubmitting}
                >
                  <Mail className="size-4" />
                  Submit ambassador request
                </Button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
