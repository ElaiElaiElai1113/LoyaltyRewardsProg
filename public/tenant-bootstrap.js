(function bootstrapTenantBrand() {
  var hostname = window.location.hostname.toLowerCase()
  var brands = {
    medellin: { name: 'Medellin Rewards', color: '#9c6a22', locale: 'es' },
    guatemala: { name: 'Guatemala Rewards', color: '#176b5b', locale: 'es' },
    synergize: { name: 'Synergize', color: '#2357a5', locale: 'en' },
    pinas: { name: 'Pinas Rewards', color: '#a67608', locale: 'en' },
  }
  var isPlatformAdmin = /^\/admin(?:\/|$)/.test(window.location.pathname)
  var slug = Object.keys(brands).find(function findBrand(key) {
    return hostname.indexOf(key) !== -1
  }) || 'pinas'
  var brand = isPlatformAdmin
    ? { name: 'Rewards Platform', color: '#d1ad4a', locale: 'en' }
    : brands[slug]

  document.title = brand.name
  document.documentElement.lang = brand.locale
  document.documentElement.style.setProperty('--tenant-accent', brand.color)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', brand.color)
  document.querySelector('meta[property="og:site_name"]')?.setAttribute('content', brand.name)
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', brand.name)
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', brand.name)
})()
