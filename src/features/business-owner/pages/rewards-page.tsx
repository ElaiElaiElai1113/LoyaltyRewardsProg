import { zodResolver } from '@hookform/resolvers/zod'
import { Gift, Sparkles, Trash2, Edit2 } from 'lucide-react'
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateReward, useDeleteReward, useUpdateReward } from '@/hooks/use-admin-data'
import { useBusinessOwnerData } from '@/hooks/use-business-owner-data'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/lib/language'
import { formatPoints } from '@/lib/utils'
import type { Reward } from '@/types/domain'
import { rewardDraftSchema, type RewardDraftFormValues } from '@/types/forms'

export function RewardsPage() {
  const { business, rewards } = useBusinessOwnerData()
  const { profile } = useAuth()
  const { t } = useLanguage()
  const createReward = useCreateReward(profile)
  const deleteReward = useDeleteReward(profile?.fullName)
  const updateReward = useUpdateReward(profile?.fullName)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<RewardDraftFormValues>({
    resolver: zodResolver(rewardDraftSchema),
    defaultValues: {
      businessId: business?.id ?? '',
      title: '',
      description: '',
      category: 'Drink',
      pointsCost: 220,
      highlight: '',
    },
  })

  const handleEdit = (reward: Reward) => {
    setEditingId(reward.id)
    form.reset({
      businessId: reward.businessId,
      title: reward.title,
      description: reward.description,
      category: reward.category,
      pointsCost: reward.pointsCost,
      highlight: reward.highlight || '',
    })
    setOpen(true)
  }

  const handleOpenForCreate = () => {
    setEditingId(null)
    form.reset({
      businessId: business?.id ?? '',
      title: '',
      description: '',
      category: 'Drink',
      pointsCost: 220,
      highlight: '',
    })
    setOpen(true)
  }

  const handleDelete = async (rewardId: string) => {
    if (confirm(t('Are you sure you want to delete this reward?'))) {
      await deleteReward.mutateAsync(rewardId)
    }
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      setError(null)
      if (editingId) {
        await updateReward.mutateAsync({ rewardId: editingId, values })
      } else {
        await createReward.mutateAsync({ ...values, businessId: business!.id })
      }
      form.reset()
      setOpen(false)
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Action failed.'))
    }
  })

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl tracking-tight text-primary">{t('Reward Vault')}</h1>
          <p className="text-lg text-on-surface-variant/85">
            {t('Create and manage vault rewards your customers can unlock with XP.')}
          </p>
        </div>
        <Button className="rounded-full h-14 px-8 font-semibold" onClick={handleOpenForCreate}>
          <Gift className="size-5 mr-2" />
          {t('Add Vault Reward')}
        </Button>
      </div>

      {/* Add/Edit Reward Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg rounded-3xl border border-primary-container/20 bg-[#120d0b]/95 text-on-surface shadow-card">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">
              {editingId ? t('Edit Reward') : t('New Reward')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="reward-title">{t('Title')}</Label>
              <Input
                id="reward-title"
                className="h-12 rounded-2xl border border-primary-container/15 bg-[#201815] text-primary placeholder:text-on-surface-variant/55 focus-visible:ring-primary-container/25"
                placeholder="Free bonus item"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reward-description">{t('Description')}</Label>
              <Textarea
                id="reward-description"
                className="min-h-28 rounded-2xl border border-primary-container/15 bg-[#201815] text-primary placeholder:text-on-surface-variant/55 focus-visible:ring-primary-container/25"
                placeholder="A bonus item, discount, or member-only perk"
                {...form.register('description')}
              />
              {form.formState.errors.description && (
                <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>{t('Category')}</Label>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-12 rounded-xl border border-primary-container/15 bg-[#201815] text-primary focus:ring-primary-container/25">
                      <SelectValue placeholder={t('Select a category')} />
                    </SelectTrigger>
                    <SelectContent className="border border-primary-container/20 bg-[#17100d] text-on-surface">
                      <SelectItem value="Drink">{t('Drink')}</SelectItem>
                      <SelectItem value="Pastry">{t('Bites')}</SelectItem>
                      <SelectItem value="Merch">{t('Gear')}</SelectItem>
                      <SelectItem value="Beans">{t('Specialty')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.category && (
                <p className="text-xs text-red-500">{form.formState.errors.category.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reward-points">{t('XP Cost')}</Label>
              <Input
                id="reward-points"
                type="number"
                className="h-12 rounded-2xl border border-primary-container/15 bg-[#201815] text-primary placeholder:text-on-surface-variant/55 focus-visible:ring-primary-container/25"
                placeholder="220"
                {...form.register('pointsCost', { valueAsNumber: true })}
              />
              {form.formState.errors.pointsCost && (
                <p className="text-xs text-red-500">{form.formState.errors.pointsCost.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reward-highlight">{t('Highlight')}</Label>
              <Input
                id="reward-highlight"
                className="h-12 rounded-2xl border border-primary-container/15 bg-[#201815] text-primary placeholder:text-on-surface-variant/55 focus-visible:ring-primary-container/25"
                placeholder="Most popular"
                {...form.register('highlight')}
              />
            </div>
            {error && <p className="text-sm font-bold text-red-500 text-center">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit" variant="secondary" className="rounded-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t('Saving...') : editingId ? t('Update Reward') : t('Add Vault Reward')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rewards Grid */}
      <div className="grid gap-8 sm:grid-cols-2">
        {rewards.length === 0 ? (
          <div className="quest-panel col-span-full rounded-[2rem] p-16 text-center">
            <Gift className="mx-auto mb-6 size-16 text-on-surface-variant/30" />
            <h3 className="font-serif text-2xl text-primary mb-2">{t('No vault rewards yet')}</h3>
            <p className="mb-8 text-on-surface-variant/80">{t('Create your first unlockable reward for members.')}</p>
            <Button variant="secondary" className="h-12 rounded-full px-8" onClick={handleOpenForCreate}>
              <Gift className="size-5 mr-2" />
              {t('Create First Vault Reward')}
            </Button>
          </div>
        ) : (
          rewards.map((reward) => (
            <div
              key={reward.id}
              className="quest-panel group relative overflow-hidden rounded-[2.5rem] p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-container/35 hover:bg-[#1a1310] hover:shadow-[0_0_0_1px_rgba(244,168,79,0.18),0_20px_40px_rgba(8,5,3,0.28)]"
            >
              <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(135deg,rgba(123,216,207,0.10),rgba(244,168,79,0.14),rgba(216,162,58,0.08))]" />
              <div className="flex flex-col gap-6 h-full">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-2 relative">
                    <Badge variant="accent" className="w-fit border-tertiary/30 bg-tertiary/15 text-tertiary">
                      {t(reward.category)}
                    </Badge>
                    {reward.featured && (
                      <span className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-secondary">
                        <Sparkles className="size-3" />
                        {t('Featured')}
                      </span>
                    )}
                  </div>
                  <div className="relative flex gap-2">
                    <Button variant="ghost" size="icon" className="size-8 rounded-full text-on-surface-variant hover:bg-primary-container/10 hover:text-primary" onClick={() => handleEdit(reward)}>
                      <Edit2 className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 rounded-full text-error hover:bg-error/10 hover:text-error" onClick={() => handleDelete(reward.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="grow space-y-4 relative">
                  <h3 className="font-serif text-3xl tracking-tight text-primary leading-tight">
                    {t(reward.title)}
                  </h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant/85 font-medium">
                    {t(reward.description)}
                  </p>
                </div>

                <div className="mt-4 flex items-end justify-between relative">
                  <div className="space-y-1">
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
                      {t('XP Cost')}
                    </span>
                    <p className="font-serif text-3xl tracking-tight text-primary-container">
                      {formatPoints(reward.pointsCost)} XP
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span
                      className={`text-[0.65rem] font-bold uppercase tracking-widest ${
                        reward.inventory < 10 ? 'text-error' : 'text-on-surface-variant/80'
                      }`}
                    >
                      {reward.inventory} {t('left')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
