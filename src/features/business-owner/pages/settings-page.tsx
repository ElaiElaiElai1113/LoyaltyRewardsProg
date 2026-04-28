import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, DollarSign, Info, MapPin, Save } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateBusinessSettings } from '@/hooks/use-admin-data'
import { useBusinessOwnerData } from '@/hooks/use-business-owner-data'
import { useLanguage } from '@/lib/language'
import { businessSettingsSchema, type BusinessSettingsFormValues } from '@/types/forms'

export function SettingsPage() {
  const { business } = useBusinessOwnerData()
  const { t } = useLanguage()
  const updateSettings = useUpdateBusinessSettings()
  const [saved, setSaved] = useState(false)

  const form = useForm<BusinessSettingsFormValues>({
    resolver: zodResolver(businessSettingsSchema),
    values: business
      ? { earnRate: business.earnRate, taxRate: business.taxRate }
      : { earnRate: 10, taxRate: 0.0875 },
  })

  if (!business) {
    return <div className="text-center py-20">{t('Loading...')}</div>
  }

  const businessColors =
    business.slug === 'velvet-brew'
      ? { primary: 'from-[#8B4513] to-[#654321]' }
      : { primary: 'from-[#5B2C6F] to-[#4A235A]' }

  const handleSubmit = form.handleSubmit(async (values) => {
    await updateSettings.mutateAsync({ businessId: business.id, values })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  })

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="font-serif text-5xl tracking-tight text-primary">{t('Settings')}</h1>
        <p className="text-lg text-on-surface-variant/85">
          {t('Manage your business information and rewards settings.')}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Business Information (read-only display) */}
          <div className="space-y-6">
            <div className="space-y-2 pb-4 border-b border-outline-variant/10">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
                {t('Business Information')}
              </span>
              <h2 className="font-serif text-2xl text-primary">{t('Details')}</h2>
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
                  <Label className="flex items-center gap-2 text-on-surface-variant/70">
                    <Building2 className="size-4" />
                    {t('Business Name')}
                  </Label>
                  <Input readOnly value={business.name} className="rounded-xl h-12 bg-surface-low cursor-default" />
                </div>

                <div className="grid gap-2">
                  <Label className="flex items-center gap-2 text-on-surface-variant/70">
                    <Info className="size-4" />
                    {t('Description')}
                  </Label>
                  <Input readOnly value={business.description} className="rounded-xl h-12 bg-surface-low cursor-default" />
                </div>

                <div className="grid gap-2">
                  <Label className="flex items-center gap-2 text-on-surface-variant/70">
                    <MapPin className="size-4" />
                    {t('Location')}
                  </Label>
                  <Input readOnly placeholder={t('Not set')} className="rounded-xl h-12 bg-surface-low cursor-default" />
                </div>
              </div>
            </div>
          </div>

          {/* Loyalty Settings (editable) */}
          <div className="space-y-6">
            <div className="space-y-2 pb-4 border-b border-outline-variant/10">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
                {t('Rewards Program')}
              </span>
              <h2 className="font-serif text-2xl text-primary">{t('Settings')}</h2>
            </div>

            <div className="rounded-3xl bg-white border border-outline-variant/5 shadow-sm p-8 space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="earn-rate" className="flex items-center gap-2">
                    <DollarSign className="size-4" />
                    {t('Points Rate (points per $1)')}
                  </Label>
                  <Input
                    id="earn-rate"
                    type="number"
                    className="rounded-xl h-12"
                    {...form.register('earnRate', { valueAsNumber: true })}
                  />
                  {form.formState.errors.earnRate && (
                    <p className="text-xs text-red-500">{form.formState.errors.earnRate.message}</p>
                  )}
                  <p className="text-xs text-on-surface-variant/60">
                    {t('Customers earn this many points for every dollar spent.')}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tax-rate" className="flex items-center gap-2">
                    <DollarSign className="size-4" />
                    {t('Tax Rate')}
                  </Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    step="0.001"
                    className="rounded-xl h-12"
                    {...form.register('taxRate', { valueAsNumber: true })}
                  />
                  {form.formState.errors.taxRate && (
                    <p className="text-xs text-red-500">{form.formState.errors.taxRate.message}</p>
                  )}
                  <p className="text-xs text-on-surface-variant/60">
                    {t('Enter as decimal (e.g., 0.0875 for 8.75%)')}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Toggle */}
            <div className="rounded-3xl bg-white border border-outline-variant/5 shadow-sm p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl text-primary">{t('Business Status')}</h3>
                  <p className="text-sm text-on-surface-variant/70 mt-1">
                    {business.active ? t('Your business is currently active') : t('Your business is currently inactive')}
                  </p>
                </div>
                <div
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    business.active ? 'bg-success/10 text-success' : 'bg-outline-variant/10 text-on-surface-variant'
                  }`}
                >
                  {business.active ? t('Active') : t('Inactive')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4 mt-8">
          {updateSettings.isError && (
            <p className="text-sm font-bold text-red-500">{t('Failed to save settings. Please try again.')}</p>
          )}
          {saved && (
            <p className="text-sm font-bold text-success">{t('Settings saved!')}</p>
          )}
          <Button
            type="submit"
            className="rounded-full h-14 px-8 font-semibold"
            disabled={form.formState.isSubmitting}
          >
            <Save className="size-5 mr-2" />
            {form.formState.isSubmitting ? t('Saving...') : t('Save Changes')}
          </Button>
        </div>
      </form>
    </div>
  )
}
