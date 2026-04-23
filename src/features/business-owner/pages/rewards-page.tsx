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
        <DialogContent className="rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">
              {editingId ? t('Edit Reward') : t('New Reward')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="reward-title">{t('Title')}</Label>
              <Input id="reward-title" placeholder="Free bonus item" {...form.register('title')} />
              {form.formState.errors.title && (
                <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reward-description">{t('Description')}</Label>
              <Textarea id="reward-description" placeholder="A bonus item, discount, or member-only perk" {...form.register('description')} />
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
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue placeholder={t('Select a category')} />
                    </SelectTrigger>
                    <SelectContent>
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
                placeholder="220"
                {...form.register('pointsCost', { valueAsNumber: true })}
              />
              {form.formState.errors.pointsCost && (
                <p className="text-xs text-red-500">{form.formState.errors.pointsCost.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reward-highlight">{t('Highlight')}</Label>
              <Input id="reward-highlight" placeholder="Most popular" {...form.register('highlight')} />
            </div>
            {error && <p className="text-sm font-bold text-red-500 text-center">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit" className="rounded-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t('Saving...') : editingId ? t('Update Reward') : t('Add Vault Reward')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rewards Grid */}
      <div className="grid gap-8 sm:grid-cols-2">
        {rewards.length === 0 ? (
          <div className="col-span-full rounded-3xl bg-white border border-outline-variant/5 p-16 text-center">
            <Gift className="size-16 text-on-surface-variant/20 mx-auto mb-6" />
            <h3 className="font-serif text-2xl text-primary mb-2">{t('No vault rewards yet')}</h3>
            <p className="text-on-surface-variant/70 mb-8">{t('Create your first unlockable reward for members.')}</p>
            <Button className="rounded-full h-12 px-8" onClick={handleOpenForCreate}>
              <Gift className="size-5 mr-2" />
              {t('Create First Vault Reward')}
            </Button>
          </div>
        ) : (
          rewards.map((reward) => (
            <div
              key={reward.id}
              className="group relative overflow-hidden rounded-[2.5rem] bg-white hover:bg-gradient-to-br hover:from-white hover:to-surface-low transition-all duration-300 border border-outline-variant/5 hover:border-primary/10 shadow-sm hover:shadow-lg p-8"
            >
              <div className="flex flex-col gap-6 h-full">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-2">
                    <Badge variant="accent" className="w-fit bg-tertiary/30 text-primary">
                      {t(reward.category)}
                    </Badge>
                    {reward.featured && (
                      <span className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-secondary">
                        <Sparkles className="size-3" />
                        {t('Featured')}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={() => handleEdit(reward)}>
                      <Edit2 className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 rounded-full text-error hover:text-error hover:bg-error/10" onClick={() => handleDelete(reward.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 grow">
                  <h3 className="font-serif text-3xl tracking-tight text-primary leading-tight">
                    {t(reward.title)}
                  </h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant/85 font-medium">
                    {t(reward.description)}
                  </p>
                </div>

                <div className="flex items-end justify-between mt-4">
                  <div className="space-y-1">
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
                      {t('XP Cost')}
                    </span>
                    <p className="font-serif text-3xl tracking-tight text-primary">
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
