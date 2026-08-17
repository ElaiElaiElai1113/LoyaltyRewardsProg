import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'
import { scrollPaginationScope } from '@/lib/pagination-scroll'
import { cn } from '@/lib/utils'

interface PaginationControlsProps {
  ariaLabel?: string
  className?: string
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaginationControls({
  ariaLabel,
  className,
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  const { t } = useLanguage()
  const navigationRef = useRef<HTMLElement | null>(null)

  if (totalItems <= pageSize) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)
  const changePage = (nextPage: number) => {
    onPageChange(nextPage)

    if (typeof window === 'undefined') return
    scrollPaginationScope(navigationRef.current, window)
  }

  return (
    <nav
      ref={navigationRef}
      aria-label={t(ariaLabel ?? 'Pagination')}
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-card/75 px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      data-testid="pagination"
    >
      <div aria-atomic="true" aria-live="polite" className="text-sm font-medium text-[var(--muted-foreground)]">
        <span>{t('Showing {start}-{end} of {total}', { start, end, total: totalItems })}</span>
        <span className="ml-2 text-[var(--foreground)]">
          {t('Page {page} of {totalPages}', { page, totalPages })}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => changePage(page - 1)}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          {t('Previous')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => changePage(page + 1)}
        >
          {t('Next')}
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
