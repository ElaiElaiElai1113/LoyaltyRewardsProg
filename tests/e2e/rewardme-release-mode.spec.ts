import { expect, test } from '@playwright/test'

const publishedCredentials = [
  'member@rewardme.test',
  'owner@rewardme.test',
  'staff@rewardme.test',
  'admin@rewardsplatform.test',
  'Rewards 123!',
] as const

test('RewardMe release mode removes every public QA credential from sign-in portals', async ({ page }) => {
  for (const route of ['/signin', '/business/login', '/admin']) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
    expect(response?.ok(), route).toBeTruthy()
    await page.locator('main').waitFor()

    await expect(page.getByTestId('rewardme-test-credentials')).toHaveCount(0)
    for (const credential of publishedCredentials) {
      await expect(page.locator('body'), `${route} exposes ${credential}`).not.toContainText(credential)
    }
  }
})
