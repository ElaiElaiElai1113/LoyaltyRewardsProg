import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { GiftCard } from '@/types/domain'
import { useLanguage } from '@/lib/language'

interface RedemptionConfirmationDialogProps {
  giftCard: GiftCard | null
  open: boolean
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function RedemptionConfirmationDialog({
  giftCard,
  open,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: RedemptionConfirmationDialogProps) {
  const { t } = useLanguage()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Charge gift card')}</DialogTitle>
          <DialogDescription>
            {giftCard ? t('Charge {card} for {customer}? The card will stay active if a balance remains.', {
              card: giftCard.catalog?.title ?? giftCard.code,
              customer: giftCard.customerFirstName ?? t('this customer'),
            }) : ''}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
          <Button type="button" variant="secondary" disabled={!giftCard || isSubmitting} isLoading={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? t('Charging...') : t('Charge Card')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
