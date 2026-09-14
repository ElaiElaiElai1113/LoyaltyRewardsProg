const redirectBase = new URL('https://loyality.local')

export function resolveSafeInternalRedirect(
  candidate: string | null | undefined,
  fallback: string,
) {
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return fallback
  }

  try {
    // URL normalizes invalid separators and control characters; reject them first.
    const decoded = decodeURIComponent(candidate)
    if (decoded.includes('\\') || decoded.startsWith('//')
      || Array.from(decoded).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return fallback
    const resolved = new URL(candidate, redirectBase)
    if (resolved.origin !== redirectBase.origin || resolved.pathname.startsWith('//')) return fallback
    return `${resolved.pathname}${resolved.search}${resolved.hash}`
  } catch {
    return fallback
  }
}
