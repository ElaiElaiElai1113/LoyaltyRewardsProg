import { zodResolver } from '@hookform/resolvers/zod'
import { Edit2, Gift, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useBusinessMembers, useBusinessOwnerData } from '@/hooks/use-business-owner-data'
import { useTenant } from '@/hooks/use-tenant'
import { usePagination } from '@/hooks/use-pagination'
import { getDefaultGiftCardValueLabel } from '@/lib/tenant-commerce'
import { useLanguage } from '@/lib/language'
import type { GiftCardCatalogItem } from '@/types/domain'
import { ownerGiftCardCatalogItemSchema, type OwnerGiftCardCatalogItemFormValues } from '@/types/forms'
import {
  useCreateOwnerGiftCardCatalogItem,
  useDeleteGiftCardCatalogItem,
  useGiftCardCatalog,
  useIssueGiftCardToCustomer,
  useUpdateGiftCardCatalogItem,
} from '../hooks/use-gift-cards'

export function BusinessGiftCardsPage() {
  const { profile } = useAuth()
  const { program } = useTenant()
  const { language, t } = useLanguage()
  const { business } = useBusinessOwnerData()
  const catalog = useGiftCardCatalog(business?.id)
  const members = useBusinessMembers(business?.id)
  const createItem = useCreateOwnerGiftCardCatalogItem(business?.id)
  const updateItem = useUpdateGiftCardCatalogItem()
  const deleteItem = useDeleteGiftCardCatalogItem()
  const [issueCatalogId, setIssueCatalogId] = useState('')
  const [issueCustomerId, setIssueCustomerId] = useState('')
  const issueGiftCard = useIssueGiftCardToCustomer(issueCustomerId, business?.id)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const defaultValueLabel = getDefaultGiftCardValueLabel({
    currency: business?.currency ?? program.currency,
    locale: language === 'es' ? 'es-ES' : language === 'tl' ? 'fil-PH' : program.locale,
  })
  const catalogItems = catalog.data ?? []
  const pagination = usePagination(catalogItems)

  const form = useForm<OwnerGiftCardCatalogItemFormValues>({
    resolver: zodResolver(ownerGiftCardCatalogItemSchema),
    defaultValues: {
      title: '',
      description: '',
      imageUrl: '',
      pointsCost: 500,
      valueLabel: defaultValueLabel,
      expiryDays: 30,
      isActive: true,
    },
  })

  if (profile?.role !== 'business-owner') {
    return <div className="rounded-xl border border-[var(--border)] bg-card shadow-sm p-10 text-on-surface-variant">{t('Only business owners can curate gift cards.')}</div>
  }

  function openForCreate() {
    if (!business) {
      setActionError(t('Business context is still loading. Please try again in a moment.'))
      return
    }

    setEditingId(null)
    form.reset({
      title: '',
      description: '',
      imageUrl: '',
      pointsCost: 500,
      valueLabel: defaultValueLabel,
      expiryDays: 30,
      isActive: true,
    })
    setActionError(null)
    setOpen(true)
  }

  function openForEdit(item: GiftCardCatalogItem) {
    setEditingId(item.id)
    form.reset({
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl ?? '',
      pointsCost: item.pointsCost,
      valueLabel: item.valueLabel,
      expiryDays: item.expiryDays,
      isActive: item.isActive,
    })
    setOpen(true)
  }

  const submit = form.handleSubmit(async (values) => {
    try {
      setActionError(null)
      if (editingId) {
        await updateItem.mutateAsync({ id: editingId, values })
      } else {
        await createItem.mutateAsync(values)
      }
      setOpen(false)
    } catch (error) {
      setActionError(error instanceof Error ? t(error.message) : t('Gift card could not be saved.'))
    }
  })

  async function issueToCustomer() {
    if (!issueCatalogId || !issueCustomerId) return
    try {
      await issueGiftCard.mutateAsync(issueCatalogId)
      setIssueCatalogId('')
      setIssueCustomerId('')
    } catch {
      // The mutation hook already presents the actionable error toast.
    }
  }

  function deleteCatalogItem(id: string) {
    void deleteItem.mutateAsync(id).catch(() => undefined)
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl tracking-tight text-primary">{t('Gift Card Catalog')}</h1>
          <p className="text-lg text-on-surface-variant/85">{t('Create and manage gift cards customers can buy with points.')}</p>
        </div>
        <Button className="h-14 rounded-full px-8" onClick={openForCreate} disabled={!business}>
          <Gift className="size-5" />
          {t('Add Gift Card')}
        </Button>
      </div>
      {!business ? (
        <p className="rounded-2xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
          {t('Business context is still loading.')}
        </p>
      ) : null}

      <section className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="outline">{t('Issue gift card')}</Badge>
            <h2 className="mt-3 font-serif text-3xl text-primary-container">{t('Give a customer a gift card')}</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              {t('Business-issued cards start with the catalog value and do not deduct customer points.')}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="h-12 rounded-full px-6"
            disabled={!issueCatalogId || !issueCustomerId || issueGiftCard.isPending}
            onClick={() => void issueToCustomer()}
          >
            <Gift className="size-4" />
            {issueGiftCard.isPending ? t('Issuing...') : t('Issue Card')}
          </Button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="business-gift-card-catalog-select">{t('Gift card')}</Label>
            <Select value={issueCatalogId} onValueChange={setIssueCatalogId} disabled={!business}>
              <SelectTrigger id="business-gift-card-catalog-select">
                <SelectValue placeholder={t('Choose a catalog item')} />
              </SelectTrigger>
              <SelectContent>
                {catalogItems.filter((item) => item.isActive).map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.title} - {item.valueLabel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="business-gift-card-customer-select">{t('Customer')}</Label>
            <Select value={issueCustomerId} onValueChange={setIssueCustomerId} disabled={!business || members.isLoading}>
              <SelectTrigger id="business-gift-card-customer-select">
                <SelectValue placeholder={members.isLoading ? t('Loading customers...') : t('Choose a customer')} />
              </SelectTrigger>
              <SelectContent>
                {(members.data ?? []).map((member) => (
                  <SelectItem key={member.id} value={member.id}>{member.fullName} - {member.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? t('Edit Gift Card') : t('New Gift Card')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="gift-card-title">{t('Title')}</Label>
              <Input id="gift-card-title" {...form.register('title')} />
              {form.formState.errors.title ? <p className="text-xs text-red-500">{t(form.formState.errors.title.message)}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gift-card-description">{t('Description')}</Label>
              <Textarea id="gift-card-description" {...form.register('description')} />
              {form.formState.errors.description ? <p className="text-xs text-red-500">{t(form.formState.errors.description.message)}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gift-card-image">{t('Image URL')}</Label>
              <Input id="gift-card-image" {...form.register('imageUrl')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="gift-card-points">{t('Points')}</Label>
                <Input id="gift-card-points" type="number" {...form.register('pointsCost', { valueAsNumber: true })} />
                {form.formState.errors.pointsCost ? <p className="text-xs text-red-500">{t(form.formState.errors.pointsCost.message)}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gift-card-value">{t('Value')}</Label>
                <Input id="gift-card-value" {...form.register('valueLabel')} />
                {form.formState.errors.valueLabel ? <p className="text-xs text-red-500">{t(form.formState.errors.valueLabel.message)}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gift-card-expiry">{t('Expiry Days')}</Label>
                <Input id="gift-card-expiry" type="number" {...form.register('expiryDays', { valueAsNumber: true })} />
                {form.formState.errors.expiryDays ? <p className="text-xs text-red-500">{t(form.formState.errors.expiryDays.message)}</p> : null}
              </div>
            </div>
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input type="checkbox" {...form.register('isActive')} />
              {t('Active')}
            </label>
            {actionError ? <p className="text-sm font-bold text-red-500">{actionError}</p> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('Cancel')}</Button>
              <Button type="submit" variant="secondary" disabled={form.formState.isSubmitting || (!editingId && !business)}>
                {form.formState.isSubmitting ? t('Saving...') : t('Save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-8 sm:grid-cols-2">
        {pagination.pageItems.map((item) => (
          <div key={item.id} className="rounded-xl border border-[var(--border)] bg-white shadow-sm p-7">
            <div className="flex items-start justify-between gap-4">
              <Badge variant={item.isActive ? 'accent' : 'outline'}>{item.isActive ? t('Active') : t('Inactive')}</Badge>
              <div className="flex gap-2">
                <Button aria-label={t('Edit {item}', { item: item.title })} variant="ghost" size="icon" onClick={() => openForEdit(item)}>
                  <Edit2 className="size-4" />
                </Button>
                <Button aria-label={t('Delete {item}', { item: item.title })} variant="ghost" size="icon" className="text-error" onClick={() => deleteCatalogItem(item.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <h3 className="mt-5 font-serif text-3xl text-primary-container">{item.title}</h3>
            <p className="mt-3 text-sm text-on-surface-variant">{item.description}</p>
            <div className="mt-6 flex justify-between text-sm font-bold text-on-surface">
              <span>{t('{count} points', { count: item.pointsCost })}</span>
              <span>{item.valueLabel}</span>
              <span>{t('{count} days', { count: item.expiryDays })}</span>
            </div>
          </div>
        ))}
      </div>
      <PaginationControls ariaLabel={t('Business gift card catalog pagination')} {...pagination} onPageChange={pagination.setPage} />
    </div>
  )
}
