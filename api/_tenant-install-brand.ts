export type InstallBrandSlug = 'platform' | 'medellin' | 'guatemala' | 'synergize' | 'pinas' | 'wondertown'

export type InstallBrand = {
  slug: InstallBrandSlug
  name: string
  shortName: string
  description: string
  locale: string
  themeColor: string
  backgroundColor: string
  startUrl: string
  iconBase: string
}

const brands: Record<InstallBrandSlug, InstallBrand> = {
  platform: {
    slug: 'platform',
    name: 'Rewards Platform',
    shortName: 'Rewards Platform',
    description: 'Rewards Platform administration.',
    locale: 'en',
    themeColor: '#4b5563',
    backgroundColor: '#ffffff',
    startUrl: '/admin',
    iconBase: 'rewards-platform',
  },
  medellin: {
    slug: 'medellin',
    name: 'Medellin Rewards',
    shortName: 'Medellin Rewards',
    description: 'Medellin Rewards member benefits and participating local businesses.',
    locale: 'es',
    themeColor: '#9c6a22',
    backgroundColor: '#ffffff',
    startUrl: '/',
    iconBase: 'medellin',
  },
  guatemala: {
    slug: 'guatemala',
    name: 'Guatemala Rewards',
    shortName: 'Guatemala Rewards',
    description: 'Guatemala Rewards member benefits and participating local businesses.',
    locale: 'es',
    themeColor: '#176b5b',
    backgroundColor: '#ffffff',
    startUrl: '/',
    iconBase: 'guatemala',
  },
  synergize: {
    slug: 'synergize',
    name: 'Synergize',
    shortName: 'Synergize',
    description: 'Synergize member benefits and participating local businesses.',
    locale: 'en',
    themeColor: '#063c2d',
    backgroundColor: '#063c2d',
    startUrl: '/',
    iconBase: 'synergize',
  },
  pinas: {
    slug: 'pinas',
    name: 'RewardMe',
    shortName: 'RewardMe',
    description: 'RewardMe membership rewards and participating local businesses.',
    locale: 'en',
    themeColor: '#173f32',
    backgroundColor: '#f4efdf',
    startUrl: '/',
    iconBase: 'rewardme',
  },
  wondertown: {
    slug: 'wondertown',
    name: 'Wondertown Rewards',
    shortName: 'Wondertown',
    description: 'A fictional rewards city built for safe, end-to-end platform testing.',
    locale: 'en',
    themeColor: '#4f3b78',
    backgroundColor: '#fff8e9',
    startUrl: '/',
    iconBase: 'wondertown',
  },
}

const hostSlugs: Record<string, InstallBrandSlug> = {
  'medellinrewards.com': 'medellin',
  'www.medellinrewards.com': 'medellin',
  'guatemalarewards.com': 'guatemala',
  'www.guatemalarewards.com': 'guatemala',
  'synergize-business-group.vercel.app': 'synergize',
  'loyalty-rewards-prog.vercel.app': 'pinas',
  'pinas-rewards.vercel.app': 'pinas', // Legacy redirect host.
  'wondertown-rewards.vercel.app': 'wondertown',
}

function normalizeHost(host: string | undefined) {
  return (host ?? '').trim().toLowerCase().split(':')[0]
}

function normalizeTenant(value: string | string[] | undefined): InstallBrandSlug | null {
  const tenant = (Array.isArray(value) ? value[0] : value)?.trim().toLowerCase() as InstallBrandSlug | undefined
  return tenant && tenant in brands ? tenant : null
}

function isPreviewHost(host: string) {
  return host === 'localhost'
    || host.startsWith('127.')
    || host.endsWith('.localhost')
    || host.endsWith('.rewardsplatform.app')
    || (host.startsWith('loyalty-rewards-prog-') && host.endsWith('-elaielaielai1113s-projects.vercel.app'))
}

export function resolveInstallBrand(hostHeader: string | undefined, tenantValue?: string | string[]) {
  const host = normalizeHost(hostHeader)
  const requestedTenant = normalizeTenant(tenantValue)
  if (requestedTenant === 'platform') return brands.platform
  const hostSlug = hostSlugs[host]
  if (hostSlug) return brands[hostSlug]
  if (requestedTenant && isPreviewHost(host)) return brands[requestedTenant]

  if (host.endsWith('.rewardsplatform.app')) {
    const subdomain = normalizeTenant(host.slice(0, -'.rewardsplatform.app'.length))
    if (subdomain) return brands[subdomain]
  }

  return brands.platform
}

export function getInstallIconPath(brand: InstallBrand, size: 180 | 192 | 512) {
  return `/install-icons/${brand.iconBase}-${size}.png`
}

export function buildInstallManifest(brand: InstallBrand) {
  const tenantQuery = `tenant=${encodeURIComponent(brand.slug)}`
  const startSeparator = brand.startUrl.includes('?') ? '&' : '?'
  return {
    name: brand.name,
    short_name: brand.shortName,
    description: brand.description,
    id: `${brand.startUrl}${startSeparator}source=pwa&${tenantQuery}`,
    start_url: `${brand.startUrl}${startSeparator}source=pwa&${tenantQuery}`,
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'browser'],
    orientation: 'portrait',
    categories: ['business', 'shopping', 'productivity'],
    lang: brand.locale,
    dir: 'ltr',
    icons: [
      {
        src: `/api/tenant-icon?size=192&${tenantQuery}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/api/tenant-icon?size=512&${tenantQuery}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    theme_color: brand.themeColor,
    background_color: brand.backgroundColor,
    shortcuts: [
      {
        name: 'Member QR',
        short_name: 'QR',
        description: 'Open your scannable member QR.',
        url: '/profile?source=pwa-shortcut',
      },
      {
        name: 'Business Portal',
        short_name: 'Business',
        description: 'Open the business sales workspace.',
        url: '/business/dashboard?source=pwa-shortcut',
      },
      {
        name: 'Platform Guide',
        short_name: 'Guide',
        description: 'Open the customer, business, and admin walkthrough.',
        url: '/guide?source=pwa-shortcut',
      },
    ],
  }
}
