import { expect, test } from '@playwright/test'

test.describe('responsive pagination', () => {
  for (const tenantSlug of ['rewardme', 'wondertown'] as const) {
  test(`${tenantSlug} keeps operational record lists compact and returns mobile users to the list start`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      for (const tenant of ['pinas', 'pinasrewards', 'rewardme', 'wondertown', 'medellin', 'guatemala']) {
        window.localStorage.setItem(`rewards:${tenant}:language`, 'en')
      }
    })
    await page.goto(`/guide?tenant=${tenantSlug}`)
    await expect(page.getByTestId('platform-guide')).toBeVisible()

    await page.evaluate(async () => {
      const importModule = (path: string) => import(/* @vite-ignore */ path)
      const [React, ReactDom, languageModule, paginationModule, paginationHookModule, compactListModule] = await Promise.all([
        importModule('/@id/react'),
        importModule('/@id/react-dom/client'),
        importModule('/src/lib/language.tsx'),
        importModule('/src/components/ui/pagination-controls.tsx'),
        importModule('/src/hooks/use-pagination.ts'),
        importModule('/src/components/ui/compact-record-list.tsx'),
      ])
      const ReactRuntime = React.default ?? React

      const host = document.createElement('div')
      host.id = 'pagination-interaction-harness'
      document.querySelector('main')?.append(host)

      const items = Array.from({ length: 13 }, (_, index) => `Customer ${String(index + 1).padStart(2, '0')}`)

      function PaginationHarness() {
        const pagination = paginationHookModule.usePagination(
          items,
          paginationHookModule.COMPACT_LIST_PAGE_SIZE,
        )

        return ReactRuntime.createElement(
          'section',
          {
            'aria-labelledby': 'pagination-harness-title',
            'data-testid': 'pagination-harness',
            style: { minHeight: '900px', padding: '16px' },
          },
          ReactRuntime.createElement('h2', { id: 'pagination-harness-title' }, 'Customer pagination harness'),
          ReactRuntime.createElement(
            compactListModule.CompactRecordList,
            { 'data-testid': 'pagination-items', 'aria-label': 'Customer records' },
            pagination.pageItems.map((item: string) => ReactRuntime.createElement(
              compactListModule.CompactRecordRow,
              {
                key: item,
              },
              item,
            )),
          ),
          ReactRuntime.createElement(paginationModule.PaginationControls, {
            ...pagination,
            ariaLabel: 'Customer results pagination',
            className: 'mt-4',
            onPageChange: pagination.setPage,
          }),
        )
      }

      const createRoot = ReactDom.createRoot ?? ReactDom.default?.createRoot
      if (!createRoot) throw new Error('React DOM createRoot is unavailable in the Vite test page.')
      const root = createRoot(host)
      root.render(ReactRuntime.createElement(
        languageModule.LanguageProvider,
        null,
        ReactRuntime.createElement(PaginationHarness),
      ))
      Object.assign(window, { __paginationInteractionRoot: root })
    })

    const harness = page.getByTestId('pagination-harness')
    const items = page.getByTestId('pagination-items')
    const pagination = page.getByRole('navigation', { name: 'Customer results pagination' })

    await expect(harness).toBeVisible()
    await expect(items.getByText('Customer 01', { exact: true })).toBeVisible()
    await expect(items.getByText('Customer 05', { exact: true })).toBeVisible()
    await expect(items.getByText('Customer 06', { exact: true })).toHaveCount(0)
    await expect(items.getByRole('listitem')).toHaveCount(5)
    await expect(pagination).toContainText('Showing 1-5 of 13')
    await expect(pagination).toContainText('Page 1 of 3')
    await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(await items.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThanOrEqual(300)

    await page.getByRole('button', { name: 'Next' }).click()

    await expect(items.getByText('Customer 01', { exact: true })).toHaveCount(0)
    await expect(items.getByText('Customer 06', { exact: true })).toBeVisible()
    await expect(items.getByText('Customer 10', { exact: true })).toBeVisible()
    await expect(items.getByRole('listitem')).toHaveCount(5)
    await expect(pagination).toContainText('Showing 6-10 of 13')
    await expect(pagination).toContainText('Page 2 of 3')
    await expect.poll(() => harness.evaluate((element) => (
      Math.abs(Math.round(element.getBoundingClientRect().top))
    ))).toBeLessThanOrEqual(1)

    const overflow = await page.evaluate(() => (
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    ))
    expect(overflow, '320px pagination page overflow').toBeLessThanOrEqual(2)

    await page.getByRole('button', { name: 'Previous' }).click()
    await expect(items.getByText('Customer 01', { exact: true })).toBeVisible()
    await expect(items.getByText('Customer 06', { exact: true })).toHaveCount(0)
    await expect(pagination).toContainText('Showing 1-5 of 13')
    await expect(pagination).toContainText('Page 1 of 3')
  })
  }
})
