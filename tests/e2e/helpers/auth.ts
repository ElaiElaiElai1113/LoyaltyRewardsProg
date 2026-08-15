import { expect, test, type Page } from '@playwright/test'

import { e2ePassword } from './env.js'

function isSupabaseFetchErrorText(value: string) {
  return /failed to fetch|fetch failed|eacces|networkerror/i.test(value)
}

async function submitAndExpectUrl(
  page: Page,
  submit: () => Promise<void>,
  expectedUrl: RegExp,
) {
  const authConsolePromise = page
    .waitForEvent('console', {
      predicate: (message) => message.type() === 'error' && isSupabaseFetchErrorText(message.text()),
      timeout: 12_000,
    })
    .then(() => true)
    .catch(() => false)

  const urlPromise = page
    .waitForURL(expectedUrl, { timeout: 12_000 })
    .then(() => true)
    .catch(() => false)

  await submit()

  const [urlReached, authConsoleError] = await Promise.all([urlPromise, authConsolePromise])
  if (urlReached) return

  const bodyText = await page.locator('body').textContent({ timeout: 1_000 }).catch(() => '')
  if (authConsoleError || isSupabaseFetchErrorText(bodyText ?? '')) {
    test.skip(true, 'Supabase auth is unreachable in this environment.')
  }

  await expect(page).toHaveURL(expectedUrl)
}

async function tryTemporaryRoleButton(
  page: Page,
  buttonName: 'Sign in as Admin' | 'Sign in as Business' | 'Sign in as Customer',
  expectedUrl: RegExp,
) {
  if (await page.locator('#signin-email').count()) return false

  await page.getByRole('button', { name: buttonName, exact: true }).click()
  await expect(page).toHaveURL(expectedUrl, { timeout: 12_000 })
  return true
}

export async function signInCustomer(page: Page, email: string, password = e2ePassword) {
  await page.goto('/signin')
  if (await tryTemporaryRoleButton(page, 'Sign in as Customer', /\/dashboard$/)) return
  await page.locator('#signin-email').fill(email)
  await page.locator('#signin-password').fill(password)
  await submitAndExpectUrl(
    page,
    () => page.locator('form').filter({ has: page.locator('#signin-email') }).locator('button[type="submit"]').click(),
    /\/dashboard$/,
  )
}

export async function signInCustomerExpectAgreementGate(page: Page, email: string, password = e2ePassword) {
  await page.goto('/signin')
  if (await page.locator('#signin-email').count() === 0) {
    test.skip(true, 'Temporary role-button sign-in does not expose agreement-pending test accounts.')
    return
  }
  await page.locator('#signin-email').fill(email)
  await page.locator('#signin-password').fill(password)
  await submitAndExpectUrl(
    page,
    () => page.locator('form').filter({ has: page.locator('#signin-email') }).locator('button[type="submit"]').click(),
    /\/agreements\/required$/,
  )
}

export async function signInBusinessPortal(page: Page, email: string, password = e2ePassword) {
  await page.goto('/signin?portal=business')
  if (await tryTemporaryRoleButton(page, 'Sign in as Business', /\/business\/dashboard$/)) return
  await page.locator('#signin-email').fill(email)
  await page.locator('#signin-password').fill(password)
  await submitAndExpectUrl(
    page,
    () => page.locator('form').filter({ has: page.locator('#signin-email') }).locator('button[type="submit"]').click(),
    /\/business\/dashboard$/,
  )
}

export async function signInBusinessPortalExpectAgreementGate(page: Page, email: string, password = e2ePassword) {
  await page.goto('/signin?portal=business')
  if (await page.locator('#signin-email').count() === 0) {
    test.skip(true, 'Temporary role-button sign-in does not expose agreement-pending test accounts.')
    return
  }
  await page.locator('#signin-email').fill(email)
  await page.locator('#signin-password').fill(password)
  await submitAndExpectUrl(
    page,
    () => page.locator('form').filter({ has: page.locator('#signin-email') }).locator('button[type="submit"]').click(),
    /\/agreements\/required$/,
  )
}

export async function signInAdmin(page: Page, email: string, password = e2ePassword) {
  await page.goto('/signin?portal=admin')
  if (await tryTemporaryRoleButton(page, 'Sign in as Admin', /\/admin\/portal$/)) return
  await page.locator('#signin-email').fill(email)
  await page.locator('#signin-password').fill(password)
  await submitAndExpectUrl(
    page,
    () => page.locator('form').filter({ has: page.locator('#signin-email') }).locator('button[type="submit"]').click(),
    /\/admin\/portal$/,
  )
}
