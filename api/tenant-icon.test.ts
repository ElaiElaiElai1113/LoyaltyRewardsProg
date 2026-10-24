import { readFileSync } from 'node:fs'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { describe, expect, it, vi } from 'vitest'
import handler from './tenant-icon'

function send(host = 'reward-me-prog.vercel.app', size: string | string[] = '192', method = 'GET', tenant = 'loyality') {
  const headers: Record<string, string | number> = {}
  const response = {
    setHeader: vi.fn((name: string, value: string | number) => { headers[name.toLowerCase()] = value }),
    status: vi.fn().mockReturnThis(), send: vi.fn().mockReturnThis(), end: vi.fn().mockReturnThis(),
  }
  handler({ method, headers: { host }, query: { size, tenant } } as unknown as VercelRequest, response as unknown as VercelResponse)
  return { response, headers }
}

describe('RewardMe supplied-logo icon endpoint', () => {
  it.each([180, 192, 512])('serves exact %i PNG bytes for the production alias despite a different tenant query', (size) => {
    const expected = readFileSync(`api/_assets/rewardme-client-${size}.png`)
    const { response, headers } = send(undefined, String(size))
    expect(response.status).toHaveBeenCalledWith(200)
    expect(headers['content-type']).toBe('image/png')
    expect(headers['content-length']).toBe(expected.length)
    expect(headers.location).toBeUndefined()
    const body = response.send.mock.calls[0][0] as Buffer
    expect(body.equals(expected)).toBe(true)
    expect(body.readUInt32BE(16)).toBe(size)
    expect(body.readUInt32BE(20)).toBe(size)
  })

  it('serves HEAD metadata without sending icon bytes', () => {
    const { response, headers } = send('myrewardme.com', '180', 'HEAD')
    expect(response.status).toHaveBeenCalledWith(200)
    expect(headers['content-type']).toBe('image/png')
    expect(headers['content-length']).toBe(readFileSync('api/_assets/rewardme-client-180.png').length)
    expect(response.send).not.toHaveBeenCalled()
    expect(response.end).toHaveBeenCalled()
  })

  it('uses only whitelisted sizes even for malformed or repeated query values', () => {
    for (const size of ['../../secret', '513', ['192', '../../secret']]) {
      const { response } = send('myrewardme.com', size)
      expect(response.status).toHaveBeenCalledWith(200)
      expect((response.send.mock.calls[0][0] as Buffer).equals(readFileSync('api/_assets/rewardme-client-192.png'))).toBe(true)
    }
  })

  it('leaves other tenants and unknown lookalikes on existing redirects', () => {
    for (const [host, location] of [
      ['wondertown-rewards.vercel.app', '/install-icons/wondertown-192.png'],
      ['medellinrewards.com', '/install-icons/medellin-192.png'],
      ['reward-me-prog.vercel.app.attacker.example', '/install-icons/rewards-platform-192.png'],
    ]) {
      const { response, headers } = send(host)
      expect(response.status).toHaveBeenCalledWith(307)
      expect(headers.location).toBe(location)
      expect(response.send).not.toHaveBeenCalled()
    }
  })

  it('continues to reject writes', () => {
    const { response, headers } = send(undefined, '192', 'POST')
    expect(response.status).toHaveBeenCalledWith(405)
    expect(headers.allow).toBe('GET, HEAD')
  })
})
