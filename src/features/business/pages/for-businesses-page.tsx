import { BarChart3, CalendarClock, Gift, Handshake, QrCode, ShieldCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const outcomes = [
  {
    icon: QrCode,
    title: 'QR signup portals',
    body: 'Put a scannable rewards invite at checkout, tables, events, and partner desks.',
  },
  {
    icon: Handshake,
    title: 'Partner attribution',
    body: 'Give hotels, hostels, concierges, and local partners their own links and QR codes.',
  },
  {
    icon: Gift,
    title: 'Reward credits',
    body: 'Issue simple customer perks that staff can validate in-store with short-lived codes.',
  },
  {
    icon: BarChart3,
    title: 'Owner reporting',
    body: 'Track members, revenue, orders, reward fulfillment, and partner referral performance.',
  },
]

const proofPoints = [
  'Launch a loyalty program without a custom app build',
  'See which partners send paying customers',
  'Reward repeat visits, referrals, and first orders',
  'Manage products, rewards, promotions, and fulfillment in one portal',
]

export function ForBusinessesPage() {
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (window.location.hash !== '#book-demo') return

    window.requestAnimationFrame(() => {
      document.getElementById('book-demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const lead = {
      name: String(formData.get('name') ?? '').trim(),
      businessName: String(formData.get('businessName') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      notes: String(formData.get('notes') ?? '').trim(),
      createdAt: new Date().toISOString(),
    }

    window.localStorage.setItem('medellinRewardsDemoLead', JSON.stringify(lead))
    event.currentTarget.reset()
    setSubmitted(true)
  }

  return (
    <div className="space-y-20 pb-20">
      <section className="grid min-h-[calc(100vh-9rem)] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-8">
          <Badge variant="accent" className="w-fit">
            Warm-growth loyalty house
          </Badge>
          <div className="space-y-6">
            <h1 className="font-serif text-5xl font-semibold leading-[0.92] tracking-[0.01em] text-primary-container md:text-7xl">
              Turn every visit into a ritual people want to return to.
            </h1>
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-on-surface-variant/85">
              Medellin Rewards helps cafes, venues, and local operators create a loyalty experience
              that feels elevated for guests and measurable for owners, from QR signups to reward
              credits and partner referrals.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="rounded-full">
              <a href="#book-demo">Book Demo</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/shop">View Customer Experience</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {proofPoints.slice(0, 4).map((point) => (
              <div key={point} className="gold-frame rounded-[1.5rem] px-5 py-4 text-sm font-medium text-on-surface-variant">
                {point}
              </div>
            ))}
          </div>
        </div>

        <div className="gold-wash overflow-hidden rounded-[2.25rem] p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary-container)]">Business atelier</p>
              <h2 className="mt-2 font-serif text-4xl text-primary-container">What owners can shape</h2>
            </div>
            <ShieldCheck className="size-10 text-primary" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {outcomes.map((item) => (
              <div key={item.title} className="rounded-[1.6rem] border border-primary-container/12 bg-[rgb(255_251_245_/_0.72)] p-5 backdrop-blur">
                <item.icon className="mb-5 size-7 text-primary" />
                <h3 className="font-serif text-2xl text-primary-container">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant/80">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-6">
          <Badge variant="accent" className="w-fit">Why owners choose it</Badge>
          <h2 className="font-serif text-5xl font-semibold tracking-[0.02em] text-primary-container">
            Make loyalty feel intimate, while keeping the numbers clear.
          </h2>
          <div className="grid gap-3">
            {proofPoints.map((point) => (
              <div key={point} className="flex items-start gap-3 text-on-surface-variant/85">
                <span className="mt-2 size-2 shrink-0 rounded-full bg-secondary-container" />
                <p className="text-sm font-medium leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <form id="book-demo" className="gold-frame rounded-[2rem] p-8" onSubmit={handleSubmit}>
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary-container)]">Book Demo</p>
              <h2 className="mt-2 font-serif text-4xl text-primary">See the business experience</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant/75">
                This demo request is saved on this device for now. No payment or backend lead submission is connected.
              </p>
            </div>
            <CalendarClock className="size-9 text-primary-container" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-3">
              <Label htmlFor="demo-name">Your Name</Label>
              <Input id="demo-name" name="name" required placeholder="Alex Rivera" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="demo-business">Business Name</Label>
              <Input id="demo-business" name="businessName" required placeholder="Harbor Roast" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="demo-email">Email</Label>
              <Input id="demo-email" name="email" type="email" required placeholder="owner@example.com" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="demo-phone">Phone</Label>
              <Input id="demo-phone" name="phone" placeholder="Optional" />
            </div>
            <div className="grid gap-3 sm:col-span-2">
              <Label htmlFor="demo-notes">What do you want to grow?</Label>
              <Textarea
                id="demo-notes"
                name="notes"
                placeholder="Repeat visits, hotel referrals, QR signup, reward credits..."
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {submitted ? (
              <p className="text-sm font-bold text-success">Demo request saved. We can connect this to a lead backend later.</p>
            ) : (
              <p className="text-sm text-on-surface-variant/75">Best for cafes, venues, hotels, and partner-led hospitality brands.</p>
            )}
            <Button type="submit" className="rounded-full">Request Demo</Button>
          </div>
        </form>
      </section>
    </div>
  )
}
