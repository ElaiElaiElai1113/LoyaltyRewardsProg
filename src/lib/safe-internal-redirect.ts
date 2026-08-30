const redirectBase = new URL('https://loyality.local')

export function resolveSafeInternalRedirect(
  candidate: string | null | undefined,
  fallback: string,
) {
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return fallback
  }

  try {
    const resolved = new URL(candidate, redirectBase)
    if (resolved.origin !== redirectBase.origin) return fallback
    return `${resolved.pathname}${resolved.search}${resolved.hash}`
  } catch {
    return fallback
  }
}
