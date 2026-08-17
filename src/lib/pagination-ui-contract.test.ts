import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const paginatedSurfaces = [
  'src/components/program-invitations.tsx',
  'src/features/activity/components/activity-list.tsx',
  'src/features/admin/components/agreement-status-panel.tsx',
  'src/features/admin/pages/admin-page.tsx',
  'src/features/business-owner/pages/business-dashboard-page.tsx',
  'src/features/business-owner/pages/members-page.tsx',
  'src/features/business-owner/pages/partners-page.tsx',
  'src/features/business-owner/pages/products-page.tsx',
  'src/features/business-owner/pages/promotions-page.tsx',
  'src/features/business-owner/pages/rewards-page.tsx',
  'src/features/gift-cards/pages/admin-gift-cards-page.tsx',
  'src/features/gift-cards/pages/business-gift-cards-page.tsx',
  'src/features/gift-cards/pages/gift-cards-page.tsx',
  'src/features/gift-cards/pages/redemptions-page.tsx',
  'src/features/gift-cards/pages/wallet-gift-cards-page.tsx',
  'src/features/membership/pages/rewardme-membership-page.tsx',
  'src/features/platform/pages/membership-operations-page.tsx',
  'src/features/platform/pages/tenant-import-page.tsx',
  'src/features/program/pages/program-settings-page.tsx',
  'src/features/program/pages/program-team-page.tsx',
  'src/features/promotions/pages/promotions-page.tsx',
  'src/features/rewards/pages/rewards-page.tsx',
  'src/features/shop/pages/cart-page.tsx',
  'src/features/shop/pages/orders-page.tsx',
  'src/features/shop/pages/shop-page.tsx',
] as const

const compactOperationalSurfaces = [
  'src/features/activity/components/activity-list.tsx',
  'src/features/admin/pages/admin-page.tsx',
  'src/features/business-owner/pages/business-dashboard-page.tsx',
  'src/features/business-owner/pages/members-page.tsx',
  'src/features/shop/pages/orders-page.tsx',
] as const

function source(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

describe('pagination UI contract', () => {
  it.each(paginatedSurfaces)('%s exposes paged items and visible controls', (path) => {
    const contents = source(path)
    const controls = contents.match(/<PaginationControls\b[\s\S]*?\/>/g) ?? []
    expect(contents).toContain('usePagination')
    expect(contents).toContain('PaginationControls')
    expect(contents).toContain('.pageItems')
    expect(controls.length).toBeGreaterThan(0)
    controls.forEach((control) => expect(control).toContain('ariaLabel='))
  })

  it('keeps all map pins, picker options, and cart totals independent from visible pages', () => {
    const shop = source('src/features/shop/pages/shop-page.tsx')
    const businessGiftCards = source('src/features/gift-cards/pages/business-gift-cards-page.tsx')
    const cart = source('src/features/shop/pages/cart-page.tsx')

    expect(shop).toContain('partnerBusinesses.map((business, index)')
    expect(shop).toContain('businessPagination.pageItems.map((business)')
    expect(businessGiftCards).toContain('catalogItems.filter((item) => item.isActive).map((item)')
    expect(cart).toContain('resolvedItems.reduce')
    expect(cart).toContain('pagination.pageItems.map')
  })

  it('announces page changes and restores readers to the relevant list start', () => {
    const controls = source('src/components/ui/pagination-controls.tsx')
    const scrolling = source('src/lib/pagination-scroll.ts')

    expect(controls).toContain('aria-live="polite"')
    expect(scrolling).toContain("matchMedia('(prefers-reduced-motion: reduce)')")
    expect(scrolling).toContain("scrollIntoView({ behavior, block: 'start' })")
  })

  it.each(compactOperationalSurfaces)('%s renders dense records as compact paginated rows', (path) => {
    const contents = source(path)

    expect(contents).toContain('CompactRecordList')
    expect(contents).toContain('CompactRecordRow')
    expect(contents).toContain('COMPACT_LIST_PAGE_SIZE')
  })

  it('limits compact operational pages to five records', () => {
    const pagination = source('src/hooks/use-pagination.ts')
    const compactList = source('src/components/ui/compact-record-list.tsx')

    expect(pagination).toContain('export const COMPACT_LIST_PAGE_SIZE = 5')
    expect(compactList).toContain('role="list"')
    expect(compactList).toContain('role="listitem"')
    expect(compactList).toContain('divide-y')
  })

  it('keeps the platform program directory paged instead of rendering every tenant at once', () => {
    const programs = source('src/features/platform/pages/platform-programs-page.tsx')

    expect(programs).toContain('const pageSize = 5')
    expect(programs).toContain('const visiblePrograms = filteredPrograms.slice')
    expect(programs).toContain('visiblePrograms.map((program)')
    expect(programs).toContain("t('Previous')")
    expect(programs).toContain("t('Next')")
  })

  it('gives import finding paginators distinct labels and duplicate-safe keys', () => {
    const tenantImport = source('src/features/platform/pages/tenant-import-page.tsx')

    expect(tenantImport).toContain("ariaLabel={t('Import errors pagination')}")
    expect(tenantImport).toContain("ariaLabel={t('Import warnings pagination')}")
    expect(tenantImport).toContain('key={`error-${errorPagination.page}-${index}-${error}`}')
    expect(tenantImport).toContain('key={`warning-${warningPagination.page}-${index}-${warning}`}')
  })
})
