import { expect, test } from '@playwright/test'

test.describe('load smoke workflow automation', () => {
  test('LOAD001 public launch surfaces handle 100 concurrent smoke requests', async ({ request }) => {
    const paths = ['/', '/invitation', '/landing-page']
    const responses = await Promise.all(
      Array.from({ length: 100 }, (_, index) => request.get(paths[index % paths.length])),
    )

    const failed = responses.filter((response) => response.status() >= 500)
    expect(failed).toHaveLength(0)
  })

  test('LOAD002 tenant resolution remains stable under concurrent brand traffic', async ({ request }) => {
    const tenants = ['medellin', 'guatemala', 'synergize', 'pinas', 'wondertown']
    const responses = await Promise.all(
      Array.from({ length: 120 }, (_, index) => request.get(`/?tenant=${tenants[index % tenants.length]}`)),
    )
    expect(responses.filter((response) => response.status() >= 500)).toHaveLength(0)
    expect(responses.every((response) => response.headers()['content-type']?.includes('text/html'))).toBe(true)
  })

  test('LOAD003 health endpoint survives a concurrent operational probe', async ({ request }) => {
    const responses = await Promise.all(Array.from({ length: 40 }, () => request.get('/api/health')))
    expect(responses.filter((response) => response.status() >= 500)).toHaveLength(0)
  })
})
