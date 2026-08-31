(function bootstrapTenantBrand() {
  var hostname = window.location.hostname.toLowerCase()
  var brands = {
    medellin: { name: 'Medellin Rewards',
      color: '#9c6a22',
      locale: 'es',
      logo: '/medellin-rewards-mark.svg',
      description: 'Medellin Rewards member benefits and participating local businesses.',
    },
    guatemala: { name: 'Guatemala Rewards',
      color: '#176b5b',
      locale: 'es',
      logo: null,
      description: 'Guatemala Rewards member benefits and participating local businesses.',
    },
    synergize: { name: 'Synergize',
      color: '#2357a5',
      locale: 'en',
      logo: null,
      description: 'Synergize member benefits and participating local businesses.',
    },
    pinas: { name: 'RewardMe',
      color: '#173f32',
      locale: 'en',
      logo: '/rewardme-mark.svg',
      description: 'RewardMe membership rewards and participating local businesses.',
    },
    pinasrewards: { name: 'Pinas Rewards',
      color: '#a67608',
      locale: 'en',
      logo: '/pinas-rewards-mark.svg',
      description: 'Pinas Rewards member benefits and participating local businesses.',
    },
    wondertown: { name: 'Wondertown Rewards',
      color: '#173f32',
      locale: 'en',
      logo: '/wondertown-rewards-logo.svg',
      description: 'A fictional rewards city built for safe, end-to-end platform testing.',
    },
    loyality: { name: 'Loyality',
      color: '#1b2a41',
      locale: 'en',
      logo: '/loyality-logo.svg',
      description: 'A private loyalty loop for one business and its customers.',
    },
  }
  var neutralBrand = {
    name: 'Rewards Program',
    color: '#4b5563',
    locale: 'en',
    logo: '/rewards-program-mark.svg',
    description: 'Member rewards and local business benefits.',
  }
  var isPlatformAdmin = /^\/admin(?:\/|$)/.test(window.location.pathname)
  var hostSlugs = {
    'medellinrewards.com': 'medellin',
    'www.medellinrewards.com': 'medellin',
    'guatemalarewards.com': 'guatemala',
    'www.guatemalarewards.com': 'guatemala',
    'loyalty-rewards-prog.vercel.app': 'pinas',
    'rewardme-prod.vercel.app': 'pinas',
    'rewardme.localhost': 'pinas',
    'pinas-rewards.vercel.app': 'pinasrewards',
    'pinas.localhost': 'pinasrewards',
    'pinasrewards.localhost': 'pinasrewards',
    'wondertown-rewards.vercel.app': 'wondertown',
    'wondertown.localhost': 'wondertown',
    'loyality-rewards.vercel.app': 'loyality',
    'loyality.localhost': 'loyality',
  }
  var canUsePreviewOverride = hostname === 'localhost'
    || hostname.indexOf('127.') === 0
    || hostname === 'pinas-rewards.vercel.app'
    || hostname === 'wondertown-rewards.vercel.app'
    || hostname === 'loyality-rewards.vercel.app'
    || hostname.endsWith('.rewardsplatform.app')
    || (hostname.indexOf('loyalty-rewards-prog-') === 0 && hostname.endsWith('-elaielaielai1113s-projects.vercel.app'))
  var querySlug = canUsePreviewOverride ? new URLSearchParams(window.location.search).get('tenant') : null
  var hostSlug = hostSlugs[hostname]
  if (!hostSlug && hostname.endsWith('.rewardsplatform.app')) {
    var platformSubdomain = hostname.slice(0, -'.rewardsplatform.app'.length)
    if (brands[platformSubdomain]) hostSlug = platformSubdomain
  }
  var slug = querySlug && brands[querySlug] ? querySlug : hostSlug
  if (!slug && canUsePreviewOverride) slug = 'pinas'

  var brand = isPlatformAdmin
    ? {
        name: 'Rewards Platform',
        color: '#d1ad4a',
        locale: 'en',
        logo: '/rewards-program-mark.svg',
        description: 'Rewards Platform administration.',
      }
    : brands[slug] || neutralBrand

  function setContent(selector, value) {
    var element = document.querySelector(selector)
    if (element) element.setAttribute('content', value)
  }

  var installSlug = isPlatformAdmin ? 'platform' : (slug || 'platform')
  var installQuery = '&tenant=' + encodeURIComponent(installSlug)
  var iconHref = '/api/tenant-icon?size=192' + installQuery
  var appleTouchIconHref = '/api/tenant-icon?size=180' + installQuery
  var manifestHref = '/api/manifest?v=host-aware-2026&tenant=' + encodeURIComponent(installSlug)
  var canonicalUrl = window.location.origin + '/'
  document.title = brand.name
  document.documentElement.lang = brand.locale
  if (slug) document.documentElement.dataset.program = slug
  document.documentElement.dataset.tenantBrand = isPlatformAdmin ? 'platform' : (slug || 'neutral')
  document.documentElement.style.setProperty('--tenant-accent', brand.color)
  setContent('meta[name="theme-color"]', brand.color)
  setContent('meta[name="description"]', brand.description)
  setContent('meta[property="og:site_name"]', brand.name)
  setContent('meta[property="og:title"]', brand.name)
  setContent('meta[property="og:description"]', brand.description)
  setContent('meta[property="og:url"]', canonicalUrl)
  setContent('meta[property="og:image:alt"]', brand.name)
  setContent('meta[name="twitter:title"]', brand.name)
  setContent('meta[name="twitter:description"]', brand.description)
  setContent('meta[name="apple-mobile-web-app-title"]', brand.name)

  var icon = document.querySelector('link[rel="icon"]')
  if (icon) icon.setAttribute('href', iconHref)
  var appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]')
  if (appleTouchIcon) appleTouchIcon.setAttribute('href', appleTouchIconHref)
  var manifest = document.querySelector('link[rel="manifest"]')
  if (manifest) manifest.setAttribute('href', manifestHref)
  var canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', canonicalUrl)
})()
