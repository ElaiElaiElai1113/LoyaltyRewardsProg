import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getInstallIconPath, resolveInstallBrand } from './_tenant-install-brand.js'

const rewardMeIcons = {
  180: 'rewardme-client-180.png',
  192: 'rewardme-client-192.png',
  512: 'rewardme-client-512.png',
} as const

function resolveSize(value: string | string[] | undefined): 180 | 192 | 512 {
  const size = Number(Array.isArray(value) ? value[0] : value)
  return size === 180 || size === 512 ? size : 192
}

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD')
    response.status(405).send('Method Not Allowed')
    return
  }

  const brand = resolveInstallBrand(request.headers.host, request.query.tenant)
  const size = resolveSize(request.query.size)
  response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600')
  response.setHeader('Vary', 'Host')
  if (brand.slug === 'pinas') {
    const bytes = readFileSync(join(process.cwd(), 'api', '_assets', rewardMeIcons[size]))
    response.setHeader('Content-Type', 'image/png')
    response.setHeader('Content-Length', bytes.length)
    response.setHeader('X-Content-Type-Options', 'nosniff')
    if (request.method === 'HEAD') {
      response.status(200).end()
      return
    }
    response.status(200).send(bytes)
    return
  }
  const location = getInstallIconPath(brand, size)
  response.setHeader('Location', location)
  response.status(307).end()
}
