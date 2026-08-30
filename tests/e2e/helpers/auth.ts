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

  const urlReached = await urlPromise
  if (urlReached) return

  const authConsoleError = await authConsolePromise
  const bodyText = await page.locator('body').textContent({ timeout: 1_000 }).catch(() => '')
  if (authConsoleError || isSupabaseFetchErrorText(bodyText ?? '')) {
    test.skip(true, 'Supabase auth is unreachable in this environment.')
  }

  await expect(page).toHaveURL(expectedUrl)
}

export async function signInCustomer(page: Page, email: string, password = e2ePassword) {
  await page.goto('/signin')
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
  await page.locator('#signin-email').fill(email)
  await page.locator('#signin-password').fill(password)
  await submitAndExpectUrl(
    page,
    () => page.locator('form').filter({ has: page.locator('#signin-email') }).locator('button[type="submit"]').click(),
    /\/admin\/portal$/,
  )
}
