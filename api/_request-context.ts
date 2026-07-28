import { randomUUID } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export function applyRequestContext(request: VercelRequest, response: VercelResponse) {
  const supplied = request.headers['x-request-id']
  const requestId = typeof supplied === 'string' && /^[a-zA-Z0-9._-]{8,100}$/.test(supplied)
    ? supplied
    : randomUUID()
  response.setHeader('X-Request-Id', requestId)
  response.setHeader('X-Content-Type-Options', 'nosniff')
  return requestId
}
