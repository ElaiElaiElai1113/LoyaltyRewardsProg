export type InvitationDomain = {
  hostname: string
  is_primary?: boolean | null
}

function normalizeHostname(hostname: string) {
  const normalized = hostname.trim().toLowerCase().replace(/\.$/, '')
  if (!normalized) return ''

  try {
    const url = new URL(`https://${normalized}`)
    return url.hostname === normalized && url.pathname === '/' && !url.port
      ? normalized
      : ''
  } catch {
    return ''
  }
}

function parseSafeOrigin(value?: string | null) {
  if (!value?.trim()) return null

  try {
    const url = new URL(value.trim())
    const isLocalHttp =
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1')

    if (url.protocol !== 'https:' && !isLocalHttp) return null
    if (url.username || url.password || url.port) return null

    return {
      hostname: normalizeHostname(url.hostname),
      origin: url.origin,
    }
  } catch {
    return null
  }
}

/**
 * Selects an invitation return origin from verified domains that belong to the
 * customer's program. Request/configured origins are accepted only on an exact
 * hostname match; otherwise the verified primary domain is used.
 */
export function resolveInvitationOrigin(
  requestOrigin: string | null,
  configuredOrigin: string | null,
  domains: InvitationDomain[],
) {
  const verifiedDomains = domains
    .map((domain) => ({ ...domain, hostname: normalizeHostname(domain.hostname) }))
    .filter((domain) => domain.hostname.length > 0)

  if (verifiedDomains.length === 0) return null

  for (const candidateValue of [requestOrigin, configuredOrigin]) {
    const candidate = parseSafeOrigin(candidateValue)
    if (
      candidate &&
      verifiedDomains.some((domain) => domain.hostname === candidate.hostname)
    ) {
      return candidate.origin
    }
  }

  const fallback =
    verifiedDomains.find((domain) => domain.is_primary) ?? verifiedDomains[0]

  return `https://${fallback.hostname}`
}
