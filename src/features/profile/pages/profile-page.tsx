import { zodResolver } from '@hookform/resolvers/zod'
import { Award, MapPin, Phone, Save } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { MetricCard } from '@/components/metric-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { useProfile, useUpdateProfile } from '@/hooks/use-customer-data'
import { profileSchema, type ProfileFormValues } from '@/types/forms'

export function ProfilePage() {
  const { profile: sessionProfile, syncProfile } = useAuth()
  const profile = useProfile(sessionProfile?.id)
  const updateProfile = useUpdateProfile(sessionProfile?.id)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      location: '',
      favoriteOrder: '',
    },
  })

  useEffect(() => {
    if (!profile.data) {
      return
    }

    form.reset({
      fullName: profile.data.fullName,
      phone: profile.data.phone,
      location: profile.data.location,
      favoriteOrder: profile.data.favoriteOrder,
    })
  }, [form, profile.data])

  return (
    <div className="space-y-16 pb-20">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between border-b border-outline-variant/10 pb-12">
        <div className="space-y-4 max-w-2xl">
          <Badge variant="ritual" className="bg-tertiary/20 text-primary">
            Account Resonance
          </Badge>
          <h1 className="font-serif text-5xl tracking-tight text-primary md:text-7xl leading-[1.1]">
            Your Narrative
          </h1>
          <p className="text-lg leading-relaxed text-on-surface-variant/60 font-medium">
            Keep your member details and preferences close at hand. Your Velvet Brew experience is deeply personal.
          </p>
        </div>

        <div className="flex flex-col items-start gap-4 lg:items-end">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">Status level</span>
          <div className="rounded-2xl bg-secondary-container px-6 py-4 text-primary shadow-ritual flex items-center gap-4">
             <div className="size-10 rounded-full bg-primary flex items-center justify-center">
                <Award className="size-5 text-white" />
             </div>
             <div className="flex flex-col">
                <span className="font-serif text-2xl leading-none">{profile.data?.tier ?? 'Bronze'}</span>
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-primary/50">Current Tier</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid gap-16 lg:grid-cols-[400px_1fr]">
        <div className="space-y-8">
           <div className="space-y-2 pb-4 border-b border-outline-variant/5">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">Snapshots</span>
            <h2 className="font-serif text-3xl text-primary">Vital Signals</h2>
          </div>
          <div className="grid gap-6">
            <MetricCard
              label="Presence"
              value={profile.data?.phone ?? 'N/A'}
              icon={Phone}
              helper="Pickup coordination"
            />
            <MetricCard
              label="Sanctuary"
              value={profile.data?.location ?? 'N/A'}
              icon={MapPin}
              helper="Default shop location"
            />
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-2 pb-4 border-b border-outline-variant/5">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">Preferences</span>
            <h2 className="font-serif text-3xl text-primary">Modify Identity</h2>
          </div>
          <div className="rounded-3xl bg-surface-low p-10 border border-outline-variant/10">
            <form
              className="grid gap-8"
              onSubmit={form.handleSubmit(async (values) => {
                const updatedProfile = await updateProfile.mutateAsync(values)
                syncProfile(updatedProfile)
              })}
            >
              <div className="grid gap-3">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="How shall we address you?" {...form.register('fullName')} />
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div className="grid gap-3">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="+1 (555) 000-0000" {...form.register('phone')} />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="location">Home Shop</Label>
                  <Input id="location" placeholder="e.g., Downtown Velvet" {...form.register('location')} />
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="favoriteOrder">The Chosen Ritual</Label>
                <Input id="favoriteOrder" placeholder="Your favorite drink..." {...form.register('favoriteOrder')} />
                <p className="text-[0.65rem] text-on-surface-variant/40 mt-1 italic font-medium">This helps our baristas prepare for your presence.</p>
              </div>

              <div className="mt-4 pt-8 border-t border-outline-variant/5 flex justify-end">
                <Button 
                  type="submit" 
                  size="lg"
                  className="rounded-full px-12 h-14" 
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? 'Syncing...' : 'Update Resonance'}
                  <Save className="size-5 ml-2" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
