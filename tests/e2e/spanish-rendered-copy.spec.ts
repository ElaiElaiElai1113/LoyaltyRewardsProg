import { expect, test, type Page } from '@playwright/test'

// Compare rendered copy, so text passed through variables and arrays is covered too.
async function renderedCopy(page: Page) {
  return page.locator('body').evaluate((body) => {
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
    const text: string[] = []
    let node: Node | null
    while ((node = walker.nextNode())) {
      const parent = node.parentElement
      if (parent && !['SCRIPT', 'STYLE', 'OPTION'].includes(parent.tagName) && parent.getClientRects().length && getComputedStyle(parent).visibility !== 'hidden') text.push(node.textContent?.trim() ?? '')
    }
    for (const element of body.querySelectorAll('[aria-label], [placeholder], [title], img[alt]')) {
      for (const attribute of ['aria-label', 'placeholder', 'title', 'alt']) {
        const value = element.getAttribute(attribute)
        if (value) text.push(value)
      }
    }
    return text.filter((value) => /[a-zA-Z]{3}/.test(value))
  })
}

for (const tenant of ['rewardme', 'wondertown'] as const) {
  test(`${tenant} public pages replace English copy when the picker changes`, async ({ page }) => {
    test.setTimeout(90_000)
    const brand = tenant === 'rewardme' ? 'RewardMe' : 'Wondertown Rewards'
    const unchanged = new Set([brand, brand.toUpperCase(), 'Regular', 'Gold', 'www.yourbusiness.com', tenant === 'rewardme' ? 'support@rewardme.ph' : 'support@wondertown.test'])
    for (const path of ['/', '/business', '/business/apply/commission', '/business/apply/credit', '/shop', '/membership', '/join', '/signin', '/invitation', '/terms', '/privacy', '/reward-terms', '/verification-policy', '/cost-calculator']) {
      await test.step(path, async () => {
        await page.goto(`${path}?tenant=${tenant}`)
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
        const picker = page.locator('[data-language-picker] select').first()
        await picker.selectOption('en')
        await expect(page.locator('html')).toHaveAttribute('lang', 'en')
        const english = new Set(await renderedCopy(page))
        await picker.selectOption('es')
        await expect(page.locator('html')).toHaveAttribute('lang', 'es')
        const spanish = await renderedCopy(page)
        expect([...new Set(spanish.filter((value) => english.has(value) && !unchanged.has(value)))]).toEqual([])
      })
    }
  })
}
