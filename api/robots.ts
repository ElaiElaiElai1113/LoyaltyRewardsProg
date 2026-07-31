import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildRobotsDocument } from './_tenant-public-discovery.js'

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD')
    response.status(405).send('Method Not Allowed')
    return
  }

  response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400')
  response.setHeader('Content-Type', 'text/plain; charset=utf-8')
  response.setHeader('Vary', 'Host')
  response.setHeader('X-Content-Type-Options', 'nosniff')

  if (request.method === 'HEAD') {
    response.status(200).end()
    return
  }

  response.status(200).send(buildRobotsDocument(request.headers.host))
}
