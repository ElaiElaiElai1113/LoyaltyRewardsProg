import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  nowMilliseconds = Date.now(),
) {
  if (!payload || !signatureHeader || !secret) return false

  const fields = signatureHeader.split(',').map((part) => part.trim().split('=', 2))
  const timestamp = fields.find(([key]) => key === 't')?.[1]
  const signatures = fields.filter(([key]) => key === 'v1').map(([, value]) => value)
  if (!timestamp || !/^\d+$/.test(timestamp) || signatures.length === 0) return false
  if (Math.abs(nowMilliseconds / 1000 - Number(timestamp)) > 300) return false

  const expectedHex = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
  const expected = Buffer.from(expectedHex, 'hex')

  return signatures.some((signature) => {
    if (!/^[a-f\d]{64}$/i.test(signature)) return false
    const actual = Buffer.from(signature, 'hex')
    return expected.length === actual.length && timingSafeEqual(expected, actual)
  })
}
