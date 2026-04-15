import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, Megaphone, Sparkles, Trash2, Edit2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreatePromotion, useDeletePromotion, useUpdatePromotion } from '@/hooks/use-admin-data'
import { useBusinessOwnerData } from '@/hooks/use-business-owner-data'
import { useAuth } from '@/hooks/use-auth'
import { formatDate } from '@/lib/utils'
import type { Promotion } from '@/types/domain'
import { promotionDraftSchema, type PromotionDraftFormValues } from '@/types/forms'

export function PromotionsPage() {
  const { business, promotions } = useBusinessOwnerData()
  const { profile } = useAuth()
  const createPromotion = useCreatePromotion(profile)
  const deletePromotion = useDeletePromotion(profile?.fullName)
  const updatePromotion = useUpdatePromotion(profile?.fullName)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<PromotionDraftFormValues>({
    resolver: zodResolver(promotionDraftSchema),
    defaultValues: {
      title: '',
      description: '',
      badge: '',
      cta: '',
      audience: '',
    },
  })

  const handleEdit = (promotion: Promotion) => {
    setEditingId(promotion.id)
    form.reset({
      title: promotion.title,
      description: promotion.description,
      badge: promotion.badge,
      cta: promotion.cta,
      audience: promotion.audience,
    })
    setOpen(true)
  }

  const handleOpenForCreate = () => {
    setEditingId(null)
    form.reset({
      title: '',
      description: '',
      badge: '',
      cta: '',
      audience: '',
    })
    setOpen(true)
  }

  const handleDelete = async (promotionId: string) => {
    if (confirm('Are you sure you want to delete this promotion?')) {
      await deletePromotion.mutateAsync(promotionId)
    }
  }

  const isActive = (expiresAt: string) => new Date(expiresAt) > new Date()

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      setError(null)
      if (editingId) {
        await updatePromotion.mutateAsync({ promotionId: editingId, values })
      } else {
        await createPromotion.mutateAsync({ ...values, businessId: business!.id })
      }
      form.reset()
      setOpen(false)
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.')
    }
  })

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl tracking-tight text-primary">Promotions</h1>
          <p className="text-lg text-on-surface-variant/85">
            Create and manage promotions to engage and reward your customers.
          </p>
        </div>
        <Button className="rounded-full h-14 px-8 font-semibold" onClick={handleOpenForCreate}>
          <Megaphone className="size-5 mr-2" />
          Create Promotion
        </Button>
      </div>

      {/* Create/Edit Promotion Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">
              {editingId ? 'Edit Promotion' : 'New Promotion'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="promo-title">Title</Label>
              <Input id="promo-title" placeholder="Double Points Weekend" {...form.register('title')} />
              {form.formState.errors.title && (
                <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="promo-description">Description</Label>
              <Textarea id="promo-description" placeholder="Earn 2x points on all purchases this weekend." {...form.register('description')} />
              {form.formState.errors.description && (
                <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="promo-badge">Badge Label</Label>
              <Input id="promo-badge" placeholder="2x Points" {...form.register('badge')} />
              {form.formState.errors.badge && (
                <p className="text-xs text-red-500">{form.formState.errors.badge.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="promo-cta">Call to Action</Label>
              <Input id="promo-cta" placeholder="Shop now and earn double" {...form.register('cta')} />
              {form.formState.errors.cta && (
                <p className="text-xs text-red-500">{form.formState.errors.cta.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="promo-audience">Audience</Label>
              <Input id="promo-audience" placeholder="All members" {...form.register('audience')} />
              {form.formState.errors.audience && (
                <p className="text-xs text-red-500">{form.formState.errors.audience.message}</p>
              )}
            </div>
            {error && <p className="text-sm font-bold text-red-500 text-center">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : editingId ? 'Update Promotion' : 'Create Promotion'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Promotions Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {promotions.length === 0 ? (
          <div className="col-span-full rounded-3xl bg-white border border-outline-variant/5 p-16 text-center">
            <Megaphone className="size-16 text-on-surface-variant/20 mx-auto mb-6" />
            <h3 className="font-serif text-2xl text-primary mb-2">No promotions yet</h3>
            <p className="text-on-surface-variant/70 mb-8">Create your first promotion to drive engagement</p>
            <Button className="rounded-full h-12 px-8" onClick={() => setOpen(true)}>
              <Megaphone className="size-5 mr-2" />
              Create First Promotion
            </Button>
          </div>
        ) : (
          promotions.map((promotion) => {
            const active = isActive(promotion.expiresAt)

            return (
              <div
                key={promotion.id}
                className={`group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br transition-all duration-300 ${
                  active
                    ? 'from-white to-surface-low hover:from-surface-lowest hover:to-surface-low'
                    : 'from-surface-lowest to-surface-low opacity-60'
                } border border-outline-variant/5 hover:border-primary/10 shadow-sm hover:shadow-lg p-8`}
              >
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-start">
                    <Badge
                      variant="accent"
                      className={`${
                        active ? 'bg-secondary-container/30 text-secondary' : 'bg-outline-variant/10'
                      }`}
                    >
                      {promotion.badge}
                    </Badge>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/80">
                        <CalendarDays className="size-3" />
                        {active ? 'Active' : 'Expired'}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={() => handleEdit(promotion)}>
                          <Edit2 className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 rounded-full text-error hover:text-error hover:bg-error/10" onClick={() => handleDelete(promotion.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-serif text-3xl tracking-tight text-primary leading-tight">
                      {promotion.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-on-surface-variant/85 font-medium italic">
                      "{promotion.description}"
                    </p>
                  </div>

                  <div className="mt-4 rounded-xl bg-surface-lowest p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-primary">{promotion.cta}</p>
                      <p className="text-[0.65rem] uppercase tracking-wider text-on-surface-variant/70">
                        {promotion.audience}
                      </p>
                    </div>
                    <div className="size-8 rounded-full bg-surface-low flex items-center justify-center text-primary shadow-sm">
                      <Sparkles className="size-4" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/5">
                    <span className="text-xs text-on-surface-variant/60">
                      Expires: {formatDate(promotion.expiresAt)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
