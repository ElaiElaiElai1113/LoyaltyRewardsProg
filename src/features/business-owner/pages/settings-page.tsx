import { Building2, DollarSign, Info, MapPin, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBusinessOwnerData } from '@/hooks/use-business-owner-data'

export function SettingsPage() {
  const { business } = useBusinessOwnerData()

  if (!business) {
    return <div className="text-center py-20">Loading...</div>
  }

  const businessColors =
    business.slug === 'cafe-cliche'
      ? { primary: 'from-[#8B4513] to-[#654321]' }
      : { primary: 'from-[#5B2C6F] to-[#4A235A]' }

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="font-serif text-5xl tracking-tight text-primary">Settings</h1>
        <p className="text-lg text-on-surface-variant/85">
          Manage your business information and loyalty program settings.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Business Information */}
        <div className="space-y-6">
          <div className="space-y-2 pb-4 border-b border-outline-variant/10">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
              Business Information
            </span>
            <h2 className="font-serif text-2xl text-primary">Details</h2>
          </div>

          <div className="rounded-3xl bg-white border border-outline-variant/5 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div
                className={`size-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold bg-gradient-to-br ${businessColors.primary}`}
              >
                {business.name.charAt(0)}
              </div>
              <div>
                <p className="font-serif text-2xl text-primary">{business.name}</p>
                <p className="text-sm text-on-surface-variant/70">{business.slug}</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="business-name" className="flex items-center gap-2">
                  <Building2 className="size-4" />
                  Business Name
                </Label>
                <Input id="business-name" defaultValue={business.name} className="rounded-xl h-12" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="business-description" className="flex items-center gap-2">
                  <Info className="size-4" />
                  Description
                </Label>
                <Input id="business-description" defaultValue={business.description} className="rounded-xl h-12" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="business-location" className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  Location
                </Label>
                <Input id="business-location" placeholder="Enter your business address" className="rounded-xl h-12" />
              </div>
            </div>
          </div>
        </div>

        {/* Loyalty Settings */}
        <div className="space-y-6">
          <div className="space-y-2 pb-4 border-b border-outline-variant/10">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
              Loyalty Program
            </span>
            <h2 className="font-serif text-2xl text-primary">Settings</h2>
          </div>

          <div className="rounded-3xl bg-white border border-outline-variant/5 shadow-sm p-8 space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="earn-rate" className="flex items-center gap-2">
                  <DollarSign className="size-4" />
                  Earn Rate (points per $1)
                </Label>
                <Input
                  id="earn-rate"
                  type="number"
                  defaultValue={business.earnRate}
                  className="rounded-xl h-12"
                />
                <p className="text-xs text-on-surface-variant/60">
                  Customers earn this many points for every dollar spent
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tax-rate" className="flex items-center gap-2">
                  <DollarSign className="size-4" />
                  Tax Rate
                </Label>
                <Input
                  id="tax-rate"
                  type="number"
                  step="0.001"
                  defaultValue={business.taxRate}
                  className="rounded-xl h-12"
                />
                <p className="text-xs text-on-surface-variant/60">
                  Enter as decimal (e.g., 0.0875 for 8.75%)
                </p>
              </div>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="rounded-3xl bg-white border border-outline-variant/5 shadow-sm p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl text-primary">Business Status</h3>
                <p className="text-sm text-on-surface-variant/70 mt-1">
                  {business.active ? 'Your business is currently active' : 'Your business is currently inactive'}
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  business.active ? 'bg-success/10 text-success' : 'bg-outline-variant/10 text-on-surface-variant'
                }`}
              >
                {business.active ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="rounded-full h-14 px-8 font-semibold">
          <Save className="size-5 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
