import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildInstallManifest, resolveInstallBrand } from './_tenant-install-brand.js'

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD')
    response.status(405).send('Method Not Allowed')
    return
  }

  const manifest = buildInstallManifest(resolveInstallBrand(request.headers.host, request.query.tenant))
  response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600')
  response.setHeader('Content-Type', 'application/manifest+json; charset=utf-8')
  response.setHeader('Vary', 'Host')
  response.setHeader('X-Content-Type-Options', 'nosniff')

  if (request.method === 'HEAD') {
    response.status(200).end()
    return
  }

  response.status(200).json(manifest)
}
