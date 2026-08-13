const canonicalTenantHostByAlias: Readonly<Record<string, string>> = {
  'rewardme-prod.vercel.app': 'loyalty-rewards-prog.vercel.app',
}

export function resolveTenantDatabaseHostname(hostname: string) {
  const normalizedHostname = hostname.trim().toLowerCase().split(':')[0]
  return canonicalTenantHostByAlias[normalizedHostname] ?? normalizedHostname
}
