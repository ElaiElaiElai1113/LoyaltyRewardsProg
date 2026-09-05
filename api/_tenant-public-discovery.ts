const tenantOrigins = {
  'myrewardme.com': 'https://www.myrewardme.com',
  'www.myrewardme.com': 'https://www.myrewardme.com',
  'www.medellinrewards.com': 'https://www.medellinrewards.com',
  'guatemalarewards.com': 'https://guatemalarewards.com',
  'loyalty-rewards-prog.vercel.app': 'https://rewardme-prod.vercel.app',
  'rewardme-prod.vercel.app': 'https://rewardme-prod.vercel.app',
  'pinas-rewards.vercel.app': 'https://pinas-rewards.vercel.app',
  'wondertown-rewards.vercel.app': 'https://wondertown-rewards.vercel.app',
  'loyality-rewards.vercel.app': 'https://loyality-rewards.vercel.app',
} as const

const publicRoutes = [
  { path: '/', changeFrequency: 'weekly', priority: '1.0' },
  { path: '/for-businesses', changeFrequency: 'monthly', priority: '0.9' },
  { path: '/join', changeFrequency: 'monthly', priority: '0.8' },
  { path: '/guide', changeFrequency: 'monthly', priority: '0.6' },
  { path: '/terms', changeFrequency: 'monthly', priority: '0.4' },
  { path: '/privacy', changeFrequency: 'monthly', priority: '0.4' },
  { path: '/reward-terms', changeFrequency: 'monthly', priority: '0.4' },
  { path: '/verification-policy', changeFrequency: 'monthly', priority: '0.4' },
] as const

type HeaderValue = string | string[] | undefined

export function resolveDiscoveryOrigin(hostHeader: HeaderValue) {
  if (typeof hostHeader !== 'string' || !hostHeader.trim() || hostHeader.includes(',')) return null

  try {
    const parsed = new URL(`https://${hostHeader.trim()}`)
    if (parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) return null
    return tenantOrigins[parsed.hostname.toLowerCase() as keyof typeof tenantOrigins] ?? null
  } catch {
    return null
  }
}

export function buildRobotsDocument(hostHeader: HeaderValue) {
  const origin = resolveDiscoveryOrigin(hostHeader)
  if (!origin) {
    return 'User-agent: *\nDisallow: /\n'
  }

  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /business/',
    'Disallow: /profile',
    'Disallow: /dashboard',
    'Disallow: /orders',
    'Disallow: /cart',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n')
}

export function buildSitemapDocument(hostHeader: HeaderValue) {
  const origin = resolveDiscoveryOrigin(hostHeader)
  const urls = origin
    ? publicRoutes.map(({ path, changeFrequency, priority }) => [
        '  <url>',
        `    <loc>${origin}${path}</loc>`,
        `    <changefreq>${changeFrequency}</changefreq>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
      ].join('\n'))
    : []

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}
