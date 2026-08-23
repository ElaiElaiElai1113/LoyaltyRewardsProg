import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'
import type { GiftCardCatalogItem } from '@/types/domain'

interface IssueConfirmationDialogProps {
  item: GiftCardCatalogItem | null
  open: boolean
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function IssueConfirmationDialog({
  item,
  open,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: IssueConfirmationDialogProps) {
  const { t } = useLanguage()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Issue gift card')}</DialogTitle>
          <DialogDescription>
            {item ? t('Spend {points} points for {title}. This gift card never expires.', {
              points: item.pointsCost,
              title: item.title,
            }) : ''}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('Cancel')}</Button>
          <Button type="button" variant="secondary" disabled={!item || isSubmitting} isLoading={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? t('Issuing...') : t('Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
