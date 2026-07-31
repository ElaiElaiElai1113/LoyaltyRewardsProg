function normalizeHttpOrigin(value?: string) {
  if (!value?.trim()) return ''

  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : ''
  } catch {
    return ''
  }
}

export function resolveTenantPublicSiteUrl(browserOrigin?: string, configuredUrl?: string) {
  return normalizeHttpOrigin(browserOrigin) || normalizeHttpOrigin(configuredUrl)
}
