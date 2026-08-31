import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Copy, Mail, MapPin, Phone, QrCode, Save, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { useProfile, useUpdateProfile } from '@/hooks/use-customer-data'
import { profileSchema, type ProfileFormValues } from '@/types/forms'

export function LoyalityProfilePage() {
  const { profile: sessionProfile, syncProfile } = useAuth()
  const profile = useProfile(sessionProfile?.id)
  const updateProfile = useUpdateProfile(sessionProfile?.id)
  const [copied, setCopied] = useState(false)
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: '', phone: '', location: '', favoriteOrder: '' },
  })

  useEffect(() => {
    if (!profile.data) return
    form.reset({
      fullName: profile.data.fullName,
      phone: profile.data.phone,
      location: profile.data.location,
      favoriteOrder: profile.data.favoriteOrder,
    })
  }, [form, profile.data])

  const qrUrl = profile.data?.memberQrToken && typeof window !== 'undefined'
    ? `${window.location.origin}/business/member-sale/${profile.data.memberQrToken}`
    : ''

  return (
    <div className="ly-account-page">
      <header className="ly-account-hero">
        <div><p>My Loyality identity</p><h1>One QR. Every return visit.</h1><span>Keep this screen ready when you visit. Staff scan the code and Loyality connects the visit to your account.</span></div>
        <div className="ly-account-hero__stamp"><UserRound /><strong>{profile.data?.fullName ?? 'Member'}</strong><small>Active customer</small></div>
      </header>

      <div className="ly-account-grid">
        <section className="ly-qr-ticket">
          <div className="ly-qr-ticket__notch ly-qr-ticket__notch--left" /><div className="ly-qr-ticket__notch ly-qr-ticket__notch--right" />
          <p><QrCode /> Member pass</p>
          <div className="ly-qr-ticket__code">
            {qrUrl ? <QRCodeSVG value={qrUrl} size={240} fgColor="#1f3a2e" level="H" /> : <QrCode className="size-28 opacity-30" />}
          </div>
          <h2>{profile.data?.fullName ?? 'Your member QR'}</h2>
          <span>Show this code to the business. You never need to copy or type it.</span>
          <button
            disabled={!qrUrl}
            onClick={() => {
              if (!qrUrl) return
              void navigator.clipboard.writeText(qrUrl).then(() => {
                setCopied(true); toast.success('Member link copied.'); window.setTimeout(() => setCopied(false), 1600)
              })
            }}
            type="button"
          >{copied ? <Check /> : <Copy />}{copied ? 'Copied' : 'Copy link'}</button>
        </section>

        <section className="ly-profile-panel">
          <div className="ly-profile-panel__heading"><p>Account details</p><h2>Make recognition easy.</h2><span>Accurate details help the business recognize and support you. Only the information needed for your customer account appears here.</span></div>
          <div className="ly-profile-facts">
            <div><Mail /><span>Email</span><strong>{sessionProfile?.email}</strong></div>
            <div><Phone /><span>Phone</span><strong>{profile.data?.phone || 'Add your number'}</strong></div>
            <div><MapPin /><span>Location</span><strong>{profile.data?.location || 'Add your area'}</strong></div>
          </div>
          <form
            className="ly-profile-form"
            onSubmit={form.handleSubmit(async (values) => {
              const saved = await updateProfile.mutateAsync(values)
              syncProfile(saved)
              toast.success('Profile saved.')
            })}
          >
            <div className="ly-field"><Label htmlFor="ly-full-name">Full name</Label><Input id="ly-full-name" {...form.register('fullName')} /></div>
            <div className="ly-profile-form__row">
              <div className="ly-field"><Label htmlFor="ly-phone">Phone number</Label><Input id="ly-phone" {...form.register('phone')} /></div>
              <div className="ly-field"><Label htmlFor="ly-location">Your area</Label><Input id="ly-location" {...form.register('location')} /></div>
            </div>
            <div className="ly-field"><Label htmlFor="ly-favorite">Favorite order or preference</Label><Input id="ly-favorite" placeholder="Optional—helps staff remember you" {...form.register('favoriteOrder')} /></div>
            {Object.values(form.formState.errors)[0]?.message ? <p className="ly-auth__message ly-auth__message--error">{Object.values(form.formState.errors)[0]?.message}</p> : null}
            <Button className="ly-profile-save" disabled={updateProfile.isPending} type="submit"><Save />{updateProfile.isPending ? 'Saving…' : 'Save my details'}</Button>
          </form>
        </section>
      </div>
    </div>
  )
}
