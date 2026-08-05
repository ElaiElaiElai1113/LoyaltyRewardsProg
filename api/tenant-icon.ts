import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getInstallIconPath, resolveInstallBrand } from './_tenant-install-brand.js'

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
  const location = getInstallIconPath(brand, resolveSize(request.query.size))
  response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600')
  response.setHeader('Location', location)
  response.setHeader('Vary', 'Host')
  response.status(307).end()
}
