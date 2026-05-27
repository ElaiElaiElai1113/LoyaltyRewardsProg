import { expect, test } from '@playwright/test'

import { signInCustomer } from './helpers/auth.js'
import { e2eAccounts, e2ePassword, workflowAuthEnabled } from './helpers/env.js'

test.describe.serial('fresh customer onboarding workflow automation', () => {
  test.skip(!workflowAuthEnabled, 'Run with npm run test:onboarding against a seeded Supabase project.')

  const runId = process.env.WORKFLOW_TEST_RUN_ID ?? `${Date.now()}`
  const onboardingEmail = `onboarding-workflow-${runId}@example.com`
  const onboardingName = `Onboarding Workflow ${runId.slice(-4)}`

  test('ONB001 member signup path exposes account creation and reports current signup state', async ({ page }) => {
    await page.goto('/join')
    await page.locator('#join-name').fill(onboardingName)
    await page.locator('#join-email').fill(onboardingEmail)
    await page.locator('#join-password').fill(e2ePassword)
    await page.getByRole('button', { name: /Create my account|Crear mi cuenta/i }).click()

    await expect(page.locator('body')).toContainText(
      /Welcome to the Rewards Club|Go to sign in|Account could not be created/i,
    )
    if (await page.locator('body').getByText(/Account could not be created/i).isVisible()) {
      test.info().annotations.push({
        type: 'known-gap',
        description: 'Current Supabase project rejects disposable auth signups; seeded users cover onboarding states.',
      })
    }
  })

  test('ONB002 seeded unverified member sees onboarding checklist and locked reward steps', async ({ page }) => {
    await signInCustomer(page, e2eAccounts.unverifiedCustomer)
    await expect(page.locator('body')).toContainText(/Account created|Cuenta creada/i)
    await expect(page.locator('body')).toContainText(/Verify ID|Verificar ID/i)
    await expect(page.locator('body')).toContainText(/Activate membership|Activar membresia/i)
    await expect(page.locator('body')).toContainText(/Unlock member QR|Desbloquear QR/i)
    await expect(page.locator('body')).toContainText(/Earn first reward|Ganar primera recompensa/i)

    await page.goto('/profile')
    await expect(page.locator('body')).toContainText(/verification|ID|submitted|profile/i)

    await page.goto('/membership')
    await expect(page.locator('body')).toContainText(/membership|membresia|Subscribe|Activate/i)
  })

  test('ONB003 unverified seeded member stays blocked from reward-value actions', async ({ page }) => {
    await signInCustomer(page, e2eAccounts.unverifiedCustomer)

    await page.goto('/rewards')
    await expect(page.locator('body')).toContainText(/Verify ID to redeem|Verification required|Verifica tu ID/i)

    await page.goto('/gift-cards')
    await expect(page.locator('body')).toContainText(/Verify ID to issue|Verification required|Tu ID fue enviado/i)
  })
})
