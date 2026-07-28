import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD')
    response.status(405).json({ ok: false, status: 'method_not_allowed' })
    return
  }

  response.setHeader('Cache-Control', 'no-store')
  const startedAt = Date.now()
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    response.status(503).json({
      ok: false,
      status: 'configuration_missing',
      timestamp: new Date().toISOString(),
    })
    return
  }

  try {
    const supabase = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error } = await supabase.from('programs').select('id', { head: true, count: 'exact' }).eq('status', 'active')
    if (error) throw error

    const body = {
      ok: true,
      status: 'ready',
      database: 'reachable',
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? 'local',
    }
    if (request.method === 'HEAD') {
      response.status(200).end()
      return
    }
    response.status(200).json(body)
  } catch {
    response.status(503).json({
      ok: false,
      status: 'database_unreachable',
      database: 'unreachable',
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    })
  }
}
