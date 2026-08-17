import { expect, test } from '@playwright/test'

test.describe('responsive pagination', () => {
  test('moves between real paged items and returns mobile users to the list start', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      for (const tenant of ['pinas', 'pinasrewards', 'rewardme', 'wondertown', 'medellin', 'guatemala']) {
        window.localStorage.setItem(`rewards:${tenant}:language`, 'en')
      }
    })
    await page.goto('/guide?tenant=rewardme')
    await expect(page.getByTestId('platform-guide')).toBeVisible()

    await page.evaluate(async () => {
      const importModule = (path: string) => import(/* @vite-ignore */ path)
      const [React, ReactDom, languageModule, paginationModule, paginationHookModule] = await Promise.all([
        importModule('/@id/react'),
        importModule('/@id/react-dom/client'),
        importModule('/src/lib/language.tsx'),
        importModule('/src/components/ui/pagination-controls.tsx'),
        importModule('/src/hooks/use-pagination.ts'),
      ])
      const ReactRuntime = React.default ?? React

      const host = document.createElement('div')
      host.id = 'pagination-interaction-harness'
      document.querySelector('main')?.append(host)

      const items = Array.from({ length: 18 }, (_, index) => `Promotion ${String(index + 1).padStart(2, '0')}`)

      function PaginationHarness() {
        const pagination = paginationHookModule.usePagination(items, 8)

        return ReactRuntime.createElement(
          'section',
          {
            'aria-labelledby': 'pagination-harness-title',
            'data-testid': 'pagination-harness',
            style: { padding: '16px' },
          },
          ReactRuntime.createElement('h2', { id: 'pagination-harness-title' }, 'Promotion pagination harness'),
          ReactRuntime.createElement(
            'div',
            { 'data-testid': 'pagination-items', style: { display: 'grid', gap: '12px' } },
            pagination.pageItems.map((item: string) => ReactRuntime.createElement(
              'article',
              {
                key: item,
                style: {
                  alignItems: 'center',
                  border: '1px solid currentColor',
                  borderRadius: '16px',
                  display: 'flex',
                  minHeight: '140px',
                  padding: '16px',
                },
              },
              item,
            )),
          ),
          ReactRuntime.createElement(paginationModule.PaginationControls, {
            ...pagination,
            ariaLabel: 'Promotion results pagination',
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
    const pagination = page.getByRole('navigation', { name: 'Promotion results pagination' })

    await expect(harness).toBeVisible()
    await expect(items.getByText('Promotion 01', { exact: true })).toBeVisible()
    await expect(items.getByText('Promotion 08', { exact: true })).toBeVisible()
    await expect(items.getByText('Promotion 09', { exact: true })).toHaveCount(0)
    await expect(pagination).toContainText('Showing 1-8 of 18')
    await expect(pagination).toContainText('Page 1 of 3')
    await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled()

    await page.getByRole('button', { name: 'Next' }).click()

    await expect(items.getByText('Promotion 01', { exact: true })).toHaveCount(0)
    await expect(items.getByText('Promotion 09', { exact: true })).toBeVisible()
    await expect(items.getByText('Promotion 16', { exact: true })).toBeVisible()
    await expect(pagination).toContainText('Showing 9-16 of 18')
    await expect(pagination).toContainText('Page 2 of 3')
    await expect.poll(() => harness.evaluate((element) => (
      Math.abs(Math.round(element.getBoundingClientRect().top))
    ))).toBeLessThanOrEqual(1)

    const overflow = await page.evaluate(() => (
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    ))
    expect(overflow, '320px pagination page overflow').toBeLessThanOrEqual(2)

    await page.getByRole('button', { name: 'Previous' }).click()
    await expect(items.getByText('Promotion 01', { exact: true })).toBeVisible()
    await expect(items.getByText('Promotion 09', { exact: true })).toHaveCount(0)
    await expect(pagination).toContainText('Showing 1-8 of 18')
    await expect(pagination).toContainText('Page 1 of 3')
  })
})
