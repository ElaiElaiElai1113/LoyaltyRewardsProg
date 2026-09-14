import { expect, test, type Page } from '@playwright/test'

const offerPath = '/offer/welcome?ref=MEMBER%2B01&source=counter%20QR'
const catalog = { id: 'catalog-one', title: 'Signature item voucher', description: 'One item', pointsCost: 100, active: true }
const voucher = { id: 'voucher-one', title: catalog.title, description: 'One item', status: 'active', sourceKind: 'points_catalog', publicToken: 'voucher-token', voucherKind: 'item' }

// Deny all external requests and stub only the service boundary. No hosted account or row is created.
async function localHarness(page: Page, handle?: (method: string, args: unknown[]) => unknown | Promise<unknown>) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort()
    if (url.pathname === '/src/main.tsx') return route.fulfill({ contentType: 'text/javascript', body: 'import "/tests/e2e/fixtures/loyality-review-harness.tsx"' })
    if (url.pathname === '/src/hooks/use-business-owner-data.ts') return route.fulfill({ contentType: 'text/javascript', body: 'export const useBusinessOwnerData = () => ({ business: { id: "business-one" }, isBusinessLoading: false })' })
    if (url.pathname === '/src/integrations/supabase/client.ts') return route.fulfill({ contentType: 'text/javascript', body: `
      export const isSupabaseConfigured = true;
      export const supabase = { rpc: async (name, args) => {
        if (name !== 'redeem_loyality_catalog_voucher') throw new Error('Unexpected fixture RPC: ' + name);
        const response = await fetch('/__loyality-api/redeemCatalogVoucher', { method: 'POST', body: JSON.stringify([args.p_catalog_id, args.p_client_request_id]) });
        const result = await response.json();
        return response.ok ? { data: result, error: null } : { data: null, error: { code: result.code, message: result.error } };
      } };
    ` })
    if (!url.pathname.startsWith('/__loyality-api/')) return route.continue()
    const method = url.pathname.split('/').pop()!
    const args = route.request().postDataJSON() as unknown[]
    const result = await handle?.(method, args)
    if (result instanceof Error) return route.fulfill({ status: 503, json: { error: result.message, code: 'code' in result ? result.code : undefined } })
    if (result !== undefined) return route.fulfill({ json: result })
    const defaults: Record<string, unknown> = {
      getPublicOffer: { publicToken: 'welcome', title: 'Welcome offer', description: 'Private welcome offer', rewardTitle: 'Welcome treat', rewardDescription: 'One treat' },
      getCustomerSnapshot: { settings: null, offers: [], visits: [], vouchers: [], catalog: [catalog], raffles: [], raffleEntries: [] },
      getRewardBalance: { points: 300 }, findCatalogRedemption: null,
      getBusinessSnapshot: { settings: null, offers: [], visitRules: [], catalog: [], raffles: [], counts: { claims: 0, visits: 0, activeVouchers: 0, raffleEntries: 0 } },
      signUp: {}, signIn: {},
    }
    if (!(method in defaults)) throw new Error(`Unexpected fixture service call: ${method}`)
    return route.fulfill({ json: defaults[method] })
  })
}

test.describe('Loyality local behavior regressions', () => {
  test('a definitive no-commit rejection releases the request for a different reward', async ({ page }) => {
    const requests: unknown[][] = []
    await localHarness(page, (method, args) => {
      if (method === 'getCustomerSnapshot') return { settings: null, offers: [], visits: [], vouchers: [], catalog: [catalog, { ...catalog, id: 'catalog-two', title: 'Second reward' }], raffles: [], raffleEntries: [] }
      if (method === 'redeemCatalogVoucher') {
        requests.push(args)
        return requests.length === 1 ? Object.assign(new Error('Voucher option not found'), { code: 'LY001' }) : voucher
      }
    })
    await page.addInitScript(() => localStorage.setItem('review-signed-in', 'true'))
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Choose', exact: true }).first().click()
    await expect(page.getByText('Voucher option not found', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Choose', exact: true }).last()).toBeEnabled()
    await page.getByRole('button', { name: 'Choose', exact: true }).last().click()
    await expect.poll(() => requests.length).toBe(2)
    expect(requests[1][0]).toBe('catalog-two')
    expect(requests[1][1]).not.toBe(requests[0][1])
  })

  test('a rejection message without the no-commit code retains the pending request', async ({ page }) => {
    const requests: unknown[][] = []
    await localHarness(page, (method, args) => {
      if (method === 'redeemCatalogVoucher') { requests.push(args); return Object.assign(new Error('Not enough points'), { code: 'P0001' }) }
    })
    await page.addInitScript(() => localStorage.setItem('review-signed-in', 'true'))
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Choose', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Retry voucher request' })).toBeEnabled()
    await page.reload()
    await page.getByRole('button', { name: 'Retry voucher request' }).click()
    await expect.poll(() => requests.length).toBe(2)
    expect(requests[1]).toEqual(requests[0])
  })
  test('offer referral survives sign in, signup, account creation and successful sign in', async ({ page }) => {
    await localHarness(page)
    await page.goto(`${offerPath}#claim`)
    await page.getByRole('button', { name: 'Sign in to claim' }).click()
    const expected = new URL(page.url()).searchParams.get('redirect')
    expect(new URL(expected!, 'https://local.test').searchParams.get('ref')).toBe('MEMBER+01')
    expect(new URL(expected!, 'https://local.test').searchParams.get('source')).toBe('counter QR')
    expect(new URL(expected!, 'https://local.test').hash).toBe('#claim')
    await page.getByRole('link', { name: 'Create an account' }).click()
    expect(new URL(page.url()).searchParams.get('redirect')).toBe(expected)
    await page.getByRole('link', { name: 'Sign in', exact: true }).click()
    expect(new URL(page.url()).searchParams.get('redirect')).toBe(expected)
    await page.getByRole('link', { name: 'Create an account' }).click()
    await page.getByLabel('Full name').fill('New Member')
    await page.getByLabel('Email address').fill('new@example.test')
    await page.getByLabel('Phone number').fill('+639171234567')
    await page.getByLabel('Create password', { exact: true }).fill('LocalTestPass123!')
    await page.getByRole('button', { name: 'Create customer account' }).click()
    await expect(page.getByRole('heading', { name: 'Account created.' })).toBeVisible()
    await page.getByRole('link', { name: 'Go to sign in' }).click()
    expect(new URL(page.url()).searchParams.get('redirect')).toBe(expected)
    await page.getByLabel('Email address').fill('new@example.test')
    await page.getByLabel('Password', { exact: true }).fill('LocalTestPass123!')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect.poll(() => new URL(page.url()).pathname + new URL(page.url()).search + new URL(page.url()).hash).toBe(expected)
    await expect(page.getByRole('button', { name: 'Claim this offer' })).toBeVisible()
  })

  test('already signed-in signup keeps its safe offer destination', async ({ page }) => {
    await localHarness(page)
    await page.addInitScript(() => localStorage.setItem('review-signed-in', 'true'))
    await page.goto(`/join?redirect=${encodeURIComponent(offerPath)}`)
    await expect.poll(() => new URL(page.url()).pathname + new URL(page.url()).search).toBe(offerPath)
  })

  test('visit rule browser form submits an empty repeat as null and validates positive whole numbers', async ({ page }) => {
    const writes: unknown[][] = []
    await localHarness(page, (method, args) => { if (method === 'createVisitRule') { writes.push(args); return {} } })
    await page.goto('/business/growth')
    async function fillRule() {
      await page.getByRole('button', { name: 'Visit reward', exact: true }).click()
      await page.getByLabel('Rule name').fill('First milestone')
      await page.getByLabel('Reward on visit number').fill('7')
      await page.getByLabel('Voucher name').fill('Free item')
      await page.getByLabel('Exactly what the customer receives').fill('One item')
    }
    await fillRule()
    await page.getByRole('button', { name: 'Create and activate' }).click()
    await expect.poll(() => writes.length).toBe(1)
    expect(writes[0][0]).toMatchObject({ repeatEvery: null, triggerVisitCount: 7 })
    await fillRule()
    for (const invalid of ['0', '-1', '1.5']) {
      await page.getByLabel('Repeat every (optional)').fill(invalid)
      await page.getByRole('button', { name: 'Create and activate' }).click()
      expect(await page.getByLabel('Repeat every (optional)').evaluate((input: HTMLInputElement) => input.validity.valid)).toBe(false)
      expect(writes).toHaveLength(1)
    }
    await page.getByLabel('Repeat every (optional)').fill('3')
    await page.getByRole('button', { name: 'Create and activate' }).click()
    await expect.poll(() => writes.length).toBe(2)
    expect(writes[1][0]).toMatchObject({ repeatEvery: 3 })
  })

  test('lost redemption response retains its ID through navigation and reload until confirmed', async ({ page }) => {
    const requests: unknown[][] = []
    const issued = new Map<string, typeof voucher>()
    let balance = 300
    let reconciliationAvailable = false
    let confirmed = false
    await localHarness(page, (method, args) => {
      if (method === 'redeemCatalogVoucher') {
        requests.push(args)
        const requestId = String(args[1])
        if (!issued.has(requestId)) { issued.set(requestId, { ...voucher, id: `voucher-${issued.size + 1}` }); balance -= 100 }
        return new Error('Connection lost after commit')
      }
      if (method === 'findCatalogRedemption') { if (reconciliationAvailable) { confirmed = true; return issued.get(String(args[1])) ?? null }; return new Error('Temporarily offline') }
      if (method === 'getRewardBalance') return { points: balance }
      if (method === 'getCustomerSnapshot' && confirmed) return { settings: null, offers: [], visits: [], vouchers: [voucher], catalog: [catalog], raffles: [], raffleEntries: [] }
    })
    await page.addInitScript(() => localStorage.setItem('review-signed-in', 'true'))
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Choose', exact: true }).click()
    await expect.poll(() => requests.length).toBe(1)
    await expect(page.getByRole('button', { name: /^(Choose|Retry voucher request)$/ }).filter({ visible: true }).first()).toBeEnabled()
    await page.getByRole('link', { name: 'Leave wallet' }).click()
    await page.getByRole('link', { name: 'Wallet', exact: true }).click()
    await page.getByRole('button', { name: /^(Choose|Retry voucher request)$/ }).filter({ visible: true }).first().click()
    await expect.poll(() => requests.length).toBe(2)
    expect(requests[1]).toEqual(requests[0])
    await page.reload()
    await page.getByRole('button', { name: 'Retry voucher request' }).click()
    await expect.poll(() => requests.length).toBe(3)
    expect(requests[2]).toEqual(requests[0])
    reconciliationAvailable = true
    await page.reload()
    await expect(page.getByRole('button', { name: 'Retry voucher request' })).toHaveCount(0)
    await expect(page.getByText('1 active', { exact: true })).toBeVisible()
    expect(issued.size).toBe(1)
    expect(balance).toBe(200)
    await page.getByRole('button', { name: 'Choose', exact: true }).click()
    await expect.poll(() => requests.length).toBe(4)
    expect(requests[3][1]).not.toBe(requests[0][1])
    expect(issued.size).toBe(2)
    expect(balance).toBe(100)
  })

  test('a pending voucher can replay after its catalog disappears and its points were spent', async ({ page }) => {
    const requests: unknown[][] = []
    await localHarness(page, (method, args) => {
      if (method === 'redeemCatalogVoucher') { requests.push(args); return requests.length === 1 ? new Error('Response lost') : voucher }
      if (requests.length && method === 'getCustomerSnapshot') return { settings: null, offers: [], visits: [], vouchers: [], catalog: [], raffles: [], raffleEntries: [] }
      if (method === 'getRewardBalance') return { points: requests.length ? 0 : 100 }
    })
    await page.addInitScript(() => localStorage.setItem('review-signed-in', 'true'))
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Choose', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Retry voucher request' })).toBeEnabled()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Choose', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Retry voucher request' }).click()
    await expect(page.getByRole('button', { name: 'Retry voucher request' })).toHaveCount(0)
    expect(requests).toHaveLength(2)
    expect(requests[1]).toEqual(requests[0])
  })

  test('a voucher is never requested if its retry identity cannot be persisted', async ({ page }) => {
    let requests = 0
    await localHarness(page, (method) => { if (method === 'redeemCatalogVoucher') { requests += 1; return voucher } })
    await page.addInitScript(() => {
      localStorage.setItem('review-signed-in', 'true')
      const setItem = Storage.prototype.setItem
      Storage.prototype.setItem = function (key, value) {
        if (key.startsWith('rewards:loyality:voucher-request:')) throw new Error('Storage unavailable')
        setItem.call(this, key, value)
      }
    })
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Choose', exact: true }).click()
    await expect(page.getByText('Storage unavailable', { exact: true })).toBeVisible()
    expect(requests).toBe(0)
  })
  test('two tabs cannot start conflicting voucher intents while the first response is pending', async ({ page, context }) => {
    let release!: () => void
    const gate = new Promise<void>(resolve => { release = resolve })
    const requests: unknown[][] = []
    const handler = async (method: string, args: unknown[]) => {
      if (method === 'redeemCatalogVoucher') { requests.push(args); await gate; return new Error('Response lost') }
    }
    await localHarness(page, handler)
    await page.addInitScript(() => localStorage.setItem('review-signed-in', 'true'))
    await page.goto('/dashboard')
    const second = await context.newPage()
    await localHarness(second, handler)
    await second.goto('/dashboard')
    await page.getByRole('button', { name: 'Choose', exact: true }).click()
    await expect.poll(() => requests.length).toBe(1)
    await second.getByRole('button', { name: 'Choose', exact: true }).click()
    await expect(second.getByText('This voucher request is being checked in another tab.', {exact:true})).toBeVisible()
    expect(requests).toHaveLength(1)
    release()
    await expect(page.getByRole('button', { name: 'Retry voucher request' })).toBeEnabled()
    await second.reload()
    await second.getByRole('button', { name: 'Retry voucher request' }).click()
    await expect.poll(() => requests.length).toBe(2)
    expect(requests[1]).toEqual(requests[0])
  })

  test('uncertain requests remain isolated across reauthentication, accounts and programs', async ({page}) => {
    const requests: unknown[][]=[]
    await localHarness(page,(method,args)=>{if(method==='redeemCatalogVoucher'){requests.push(args);return new Error('Uncertain response')}})
    await page.goto('/signin')
    await page.getByLabel('Email address').fill('member@example.test');await page.getByLabel('Password',{exact:true}).fill('LocalTestPass123!');await page.getByRole('button',{name:'Sign in',exact:true}).click()
    await page.getByRole('button',{name:'Choose',exact:true}).click();await expect(page.getByRole('button',{name:'Retry voucher request'})).toBeEnabled()
    await page.evaluate(()=>localStorage.removeItem('review-signed-in'))
    await page.goto('/signin');await page.getByLabel('Email address').fill('member@example.test');await page.getByLabel('Password',{exact:true}).fill('LocalTestPass123!');await page.getByRole('button',{name:'Sign in',exact:true}).click()
    await page.getByRole('button',{name:'Retry voucher request'}).click();await expect.poll(()=>requests.length).toBe(2);expect(requests[1]).toEqual(requests[0])
    for(const key of ['review-customer-id','review-program-id']){
      await page.evaluate(k=>localStorage.setItem(k,'second-fixture'),key);await page.reload()
      await expect(page.getByRole('button',{name:'Retry voucher request'})).toHaveCount(0)
      await page.getByRole('button',{name:'Choose',exact:true}).click();await expect(page.getByRole('button',{name:'Retry voucher request'})).toBeEnabled()
      expect(requests.at(-1)?.[1]).not.toBe(requests[0][1])
      await page.evaluate(k=>localStorage.removeItem(k),key);await page.reload()
      await expect(page.getByRole('button',{name:'Retry voucher request'})).toBeEnabled()
    }
  })

  test('independent branded signup fixtures retain their identity through reload',async({browser})=>{
    for(const brand of ['Acacia Cafe','Garden Bakery']){
      const context=await browser.newContext();const page=await context.newPage();await localHarness(page)
      await page.addInitScript(name=>{localStorage.setItem('review-program-name',name);localStorage.setItem('review-program-id',name)},brand)
      await page.goto('/signin');await expect(page.locator('.ly-wordmark strong')).toHaveText(brand)
      await page.getByRole('link',{name:'Create an account'}).click();await expect(page.locator('.ly-wordmark strong')).toHaveText(brand)
      await page.reload();await expect(page.locator('.ly-wordmark strong')).toHaveText(brand)
      await context.close()
    }
  })

})
