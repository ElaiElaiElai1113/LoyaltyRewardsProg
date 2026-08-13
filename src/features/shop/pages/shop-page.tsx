import { type CSSProperties, useState } from 'react'
import { Compass, MapPin, Minus, Navigation, PackageSearch, Plus, ShoppingCart, Store, Ticket } from 'lucide-react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useLoginGate } from '@/hooks/use-login-gate'
import { useAuth } from '@/hooks/use-auth'
import { useAddToCart, useBusinesses, useProducts } from '@/hooks/use-customer-data'
import { useLanguage } from '@/lib/language'
import { useTenant } from '@/hooks/use-tenant'
import { formatCurrency } from '@/lib/utils'
import type { Business, Product } from '@/types/domain'
import { getBusinessMapPositions, hasExactMapPin } from '@/features/shop/business-map-layout'

const DAVAO_MAP_LABELS = ['Davao City', 'Matina', 'Bajada', 'Lanang']
const MEDELLIN_MAP_LABELS = ['Laureles', 'Poblado', 'Centro', 'Provenza']
const WONDERTOWN_MAP_LABELS = ['Storybook Lane', 'Comet Crescent', 'Lantern Walk', 'Starlight Square']

const MAP_LOCAL_ROADS = [
  'M -30 94 C 142 74 312 92 482 76 C 654 60 822 72 1032 44',
  'M -28 176 C 146 156 302 170 472 151 C 654 131 813 144 1028 116',
  'M -30 282 C 156 254 319 268 498 247 C 672 226 840 245 1030 216',
  'M -28 404 C 134 380 305 391 478 372 C 658 352 824 371 1030 341',
  'M -26 500 C 152 480 326 491 503 474 C 684 456 834 470 1026 443',
  'M 112 -24 C 128 116 119 242 141 365 C 158 466 155 565 178 706',
  'M 257 -22 C 274 117 261 231 286 351 C 305 455 304 562 329 706',
  'M 421 -24 C 432 104 421 235 445 354 C 465 455 464 568 488 704',
  'M 584 -22 C 596 105 584 224 606 342 C 625 448 622 562 648 706',
  'M 746 -24 C 760 108 747 223 770 344 C 789 448 789 560 809 706',
  'M 906 -22 C 917 113 905 228 926 346 C 945 452 943 563 968 704',
]

const MAP_BUILDINGS = [
  [43, 112, 61, 38], [163, 104, 68, 44], [304, 103, 80, 42], [471, 96, 88, 44],
  [624, 91, 76, 43], [784, 88, 92, 48], [63, 202, 89, 46], [187, 205, 62, 38],
  [324, 191, 73, 51], [470, 179, 90, 50], [634, 175, 82, 44], [795, 170, 102, 49],
  [68, 307, 75, 53], [186, 299, 94, 56], [334, 294, 70, 47], [644, 278, 68, 55],
  [792, 275, 96, 53], [52, 428, 82, 46], [188, 419, 73, 45], [333, 412, 87, 48],
  [493, 401, 75, 54], [657, 397, 95, 50], [814, 394, 76, 47], [203, 524, 82, 48],
  [351, 518, 93, 48], [514, 510, 75, 52], [675, 508, 88, 45], [834, 503, 73, 50],
] as const

function isQaReleaseFixture(business: Business) {
  return business.slug.endsWith('-qa-partner')
    || business.description === 'Isolated partner used only for authenticated release testing.'
}

function PartnerMapBackdrop({
  labels,
  isWondertown,
}: {
  labels: readonly [string, string, string, string] | string[]
  isWondertown: boolean
}) {
  return (
    <>
      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full bg-[#e8e6dc]"
        data-testid="realistic-map-cartography"
        preserveAspectRatio="none"
        viewBox="0 0 1000 680"
      >
        <defs>
          <pattern id="partner-map-grain" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="4" fill="#8d897e" opacity="0.07" r="0.8" />
            <circle cx="14" cy="12" fill="#ffffff" opacity="0.24" r="0.7" />
          </pattern>
          <linearGradient id="partner-map-water" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#b8d8df" />
            <stop offset="55%" stopColor="#9fcbd5" />
            <stop offset="100%" stopColor="#b4d6dd" />
          </linearGradient>
          <filter id="partner-map-building-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" floodColor="#6f6b63" floodOpacity="0.18" stdDeviation="1" />
          </filter>
        </defs>

        <rect width="1000" height="680" fill="#e8e6dc" />
        <path d="M 0 0 H 1000 V 218 C 783 234 642 216 472 231 C 296 247 148 224 0 249 Z" fill="#eeece4" />
        <path d="M 0 369 C 163 344 331 361 489 344 C 668 324 830 343 1000 313 V 680 H 0 Z" fill="#ebe8df" />

        <g fill="#cbdcbe" stroke="#aebf9f" strokeWidth="1.5">
          <path d="M 0 0 H 223 C 225 69 207 132 166 173 C 117 221 52 220 0 201 Z" />
          <path d="M 727 0 H 1000 V 177 C 932 188 875 175 825 135 C 779 99 746 54 727 0 Z" />
          <path d="M 0 486 C 71 458 131 469 172 515 C 213 561 205 623 168 680 H 0 Z" />
        </g>
        <g fill="none" stroke="#a6bb98" strokeDasharray="4 5" strokeLinecap="round" strokeWidth="2">
          <path d="M 18 51 C 78 84 138 82 197 45" />
          <path d="M 35 139 C 97 107 146 123 191 168" />
          <path d="M 761 49 C 831 78 898 69 966 35" />
          <path d="M 27 547 C 85 520 139 541 173 589" />
        </g>

        <g fill="#ddd9d0" stroke="#cfcbc1" strokeWidth="1">
          <path d="M 293 275 L 467 257 L 493 363 L 311 378 Z" />
          <path d="M 516 80 L 705 67 L 724 154 L 536 170 Z" />
          <path d="M 763 458 L 930 448 L 944 556 L 780 566 Z" />
        </g>

        <g fill="#d5d2ca" filter="url(#partner-map-building-shadow)" stroke="#c3bfb6" strokeWidth="1">
          {MAP_BUILDINGS.map(([x, y, width, height], index) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={width} height={height} rx="3" opacity={index % 3 === 0 ? 0.94 : 0.82} />
          ))}
        </g>

        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {MAP_LOCAL_ROADS.map((road) => <path key={`local-case-${road}`} d={road} stroke="#c9c5bb" strokeWidth="13" />)}
          {MAP_LOCAL_ROADS.map((road) => <path key={`local-fill-${road}`} d={road} stroke="#f8f7f3" strokeWidth="9" />)}
        </g>

        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M -42 626 C 151 558 276 472 421 365 C 578 250 702 155 835 87 C 912 48 966 23 1040 -5" stroke="#c6bcae" strokeWidth="30" />
          <path d="M -42 626 C 151 558 276 472 421 365 C 578 250 702 155 835 87 C 912 48 966 23 1040 -5" stroke="#fffdf8" strokeWidth="22" />
          <path d="M -35 345 C 155 318 328 327 487 308 C 669 287 830 303 1036 271" stroke="#c6bcae" strokeWidth="30" />
          <path d="M -35 345 C 155 318 328 327 487 308 C 669 287 830 303 1036 271" stroke="#fffdf8" strokeWidth="22" />
        </g>

        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M -45 237 C 144 205 312 220 483 202 C 666 182 832 194 1041 164" stroke="#d0a85f" strokeWidth="28" />
          <path d="M -45 237 C 144 205 312 220 483 202 C 666 182 832 194 1041 164" stroke="#fff4cf" strokeWidth="19" />
          <path d="M -45 237 C 144 205 312 220 483 202 C 666 182 832 194 1041 164" stroke="#ffffff" strokeDasharray="2 18" strokeLinecap="round" strokeOpacity="0.85" strokeWidth="2" />
        </g>

        <path
          d="M -30 603 C 115 561 225 567 345 607 C 475 650 588 659 713 625 C 825 594 904 581 1030 608"
          fill="none"
          stroke="#83a8ae"
          strokeLinecap="round"
          strokeOpacity="0.4"
          strokeWidth="58"
        />
        <path
          d="M -30 603 C 115 561 225 567 345 607 C 475 650 588 659 713 625 C 825 594 904 581 1030 608"
          fill="none"
          stroke="url(#partner-map-water)"
          strokeLinecap="round"
          strokeWidth="50"
        />
        <path d="M -20 571 C 139 533 254 544 365 582 C 487 623 587 629 704 598 C 815 568 909 554 1025 578" fill="none" stroke="#e5f0f2" strokeLinecap="round" strokeOpacity="0.8" strokeWidth="3" />

        <g fill="none" stroke="#aa9db6" strokeDasharray="10 9" strokeLinecap="round" strokeOpacity="0.78" strokeWidth="4">
          <path d="M 13 649 C 193 524 362 475 535 449 C 694 426 838 388 990 322" />
        </g>

        <g fontFamily="Manrope, sans-serif" fontWeight="700">
          <g fill="#5f665b" fontSize="13" letterSpacing="1.6" opacity="0.82">
            <text x="49" y="65">NORTH GARDENS</text>
            <text x="813" y="64">CIVIC PARK</text>
            <text x="41" y="536">RIVER GREEN</text>
          </g>
          <g fill="#737067" fontSize="13" opacity="0.85">
            <text transform="rotate(-5 143 220)" x="143" y="220">{labels[0]}</text>
            <text transform="rotate(-4 636 194)" x="636" y="194">{labels[1]}</text>
            <text transform="rotate(-3 476 356)" x="476" y="356">{labels[2]}</text>
            <text transform="rotate(-4 716 486)" x="716" y="486">{labels[3]}</text>
          </g>
          {isWondertown ? (
            <g fill="#77746c" fontSize="11" opacity="0.72">
              <text transform="rotate(-6 354 323)" x="354" y="323">GRAND AVENUE</text>
              <text transform="rotate(-35 526 273)" x="526" y="273">LANTERN BOULEVARD</text>
              <text transform="rotate(4 780 606)" x="780" y="606">SILVER CREEK</text>
            </g>
          ) : null}
        </g>

        <g fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="800" textAnchor="middle">
          <g transform="translate(547 121)">
            <circle fill="#ffffff" r="13" stroke="#c7c2b8" strokeWidth="2" />
            <text fill="#5c5953" y="4">H</text>
          </g>
          <g transform="translate(694 421)">
            <circle fill="#ffffff" r="12" stroke="#c7c2b8" strokeWidth="2" />
            <path d="M -5 -1 H 5 M -5 3 H 5" stroke="#5c5953" strokeLinecap="round" strokeWidth="2" />
          </g>
          <g transform="translate(248 347)">
            <circle fill="#fff4cf" r="12" stroke="#cfaa65" strokeWidth="2" />
            <text fill="#765c2f" y="4">C</text>
          </g>
        </g>

        <rect width="1000" height="680" fill="url(#partner-map-grain)" />
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute bottom-5 left-5 z-[5] rounded-lg border border-black/10 bg-white/88 px-3 py-2 text-[#4f4c45] shadow-sm backdrop-blur-sm" data-testid="map-scale">
        <span className="block text-[0.56rem] font-bold uppercase tracking-[0.12em]">250 m</span>
        <span className="mt-1 block h-1 w-16 border-x border-t-2 border-[#4f4c45]" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute bottom-5 right-5 z-[5] flex size-11 flex-col items-center justify-center rounded-full border border-black/10 bg-white/90 text-[#45423c] shadow-sm backdrop-blur-sm" data-testid="map-compass">
        <span className="text-[0.56rem] font-black leading-none">N</span>
        <span className="mt-0.5 block size-0 border-x-[5px] border-b-[10px] border-x-transparent border-b-[#8f3e38]" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(255_255_255_/_0.06),rgb(69_64_54_/_0.04))]" />
      <div className="pointer-events-none absolute inset-5 rounded-[1.6rem] border border-black/10" />
    </>
  )
}

export function ShopPage() {
  const requireAuth = useLoginGate()
  const { profile } = useAuth()
  const { t } = useLanguage()
  const { program } = useTenant()
  const businesses = useBusinesses()
  const products = useProducts()
  const addToCart = useAddToCart()

  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState(1)

  const allBusinesses = businesses.data ?? []
  const partnerBusinesses = profile ? allBusinesses : allBusinesses.filter((business) => !isQaReleaseFixture(business))
  const partnerBusinessIds = new Set(partnerBusinesses.map((business) => business.id))
  const partnerProducts = (products.data ?? []).filter((product) => partnerBusinessIds.has(product.businessId))
  const mapLabels = program.slug === 'pinas'
    ? DAVAO_MAP_LABELS
    : program.slug === 'wondertown'
      ? WONDERTOWN_MAP_LABELS
      : MEDELLIN_MAP_LABELS
  const mapPositions = getBusinessMapPositions(partnerBusinesses)
  const previewPinnedBusinesses = partnerBusinesses.filter((business) => !hasExactMapPin(business))
  const selectedBusiness = partnerBusinesses.find((business) => business.id === selectedBusinessId) ?? null
  const selectedProducts = selectedBusiness
    ? partnerProducts.filter((product) => product.businessId === selectedBusiness.id)
    : []

  const openBusiness = (business: Business) => {
    setSelectedBusinessId(business.id)
    setSelectedProduct(null)
    setSelectedQuantity(1)
  }

  const getDirectionsUrl = (business: Business) => {
    if (hasExactMapPin(business)) {
      return `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.name} ${program.countryCode}`)}`
  }

  const chooseProduct = (product: Product) => {
    requireAuth(() => {
      setSelectedProduct(product)
      setSelectedQuantity(1)
    })
  }

  const addSelectedProduct = () => {
    if (!selectedProduct) return

    addToCart.mutate(
      { productId: selectedProduct.id, quantity: selectedQuantity },
      {
        onSuccess: () => {
          setSelectedProduct(null)
          setSelectedQuantity(1)
        },
      },
    )
  }

  return (
    <div className="ornate-page relative isolate w-full overflow-hidden rounded-[2rem] px-4 py-8 pb-20 sm:px-6 lg:px-8">
      <div className="relative z-10 space-y-8">
        <div className="flex flex-col gap-5 border-b border-primary/15 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <Badge variant="accent" className="w-fit">
              {t('Partner Map')}
            </Badge>
            <h1 className="font-serif text-[clamp(3rem,7vw,7.25rem)] font-bold uppercase leading-[0.95] text-primary-container">
              {t('Explore Businesses')}
            </h1>
            <p className="max-w-2xl text-base font-medium leading-7 text-on-surface-variant/85 sm:text-lg">
              {t(`Find partner businesses in ${program.name} and open their products from the map.`)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[31rem]">
            <div className="rounded-2xl border border-primary/15 bg-card/80 p-4 shadow-soft">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">{t('Partners')}</p>
              <p data-testid="partner-count" className="mt-2 font-serif text-3xl text-primary">{partnerBusinesses.length}</p>
            </div>
            <div className="rounded-2xl border border-primary/15 bg-card/80 p-4 shadow-soft">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">{t('On Map')}</p>
              <p data-testid="map-count" className="mt-2 font-serif text-3xl text-primary">{partnerBusinesses.length}</p>
            </div>
            <div className="rounded-2xl border border-primary/15 bg-card/80 p-4 shadow-soft">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">{t('Products')}</p>
              <p data-testid="product-count" className="mt-2 font-serif text-3xl text-primary">{partnerProducts.length}</p>
            </div>
          </div>
        </div>

        {businesses.isLoading ? (
          <LoadingState title={t('Loading')} description={t('Preparing your partner map.')} />
        ) : (
          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section data-testid="partner-map" className="relative min-w-0 min-h-[34rem] overflow-hidden rounded-[2rem] border border-primary/20 bg-[#f3e7d1] shadow-card sm:min-h-[42rem]">
              <PartnerMapBackdrop labels={mapLabels} isWondertown={program.slug === 'wondertown'} />

              <div className="absolute left-5 top-5 rounded-2xl border border-primary/20 bg-card/88 px-4 py-3 text-primary shadow-soft backdrop-blur">
                <div className="flex items-center gap-2">
                  <Compass className="size-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-[0.18em]">{program.name}</span>
                </div>
              </div>

              {partnerBusinesses.length === 0 ? (
                <div
                  data-testid="partner-map-empty-state"
                  className="absolute inset-x-4 bottom-5 z-10 mx-auto max-w-lg rounded-[1.5rem] border border-primary/20 bg-card/95 p-5 text-center shadow-card backdrop-blur sm:inset-x-8 sm:bottom-8 sm:p-7"
                >
                  <Store className="mx-auto size-8 text-primary" />
                  <h2 className="mt-3 font-serif text-2xl text-primary">{t('No partner locations published yet')}</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-on-surface-variant/80">
                    {t('Explore the map preview now. Verified partner locations will appear here as they are published.')}
                  </p>
                  <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button asChild><Link to="/business">{t('For Businesses')}</Link></Button>
                    <Button asChild variant="outline"><Link to="/signin">{t('Sign in')}</Link></Button>
                  </div>
                </div>
              ) : null}

              {partnerBusinesses.map((business, index) => {
                const isExactPin = hasExactMapPin(business)
                const position = mapPositions[business.id]

                return (
                  <button
                    key={business.id}
                    type="button"
                    className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-[1.25rem] outline-none focus-visible:ring-4 focus-visible:ring-primary/45"
                    style={position as CSSProperties}
                    onClick={() => openBusiness(business)}
                    aria-label={`${t('Open business')} ${business.name}`}
                    aria-pressed={selectedBusinessId === business.id}
                    data-testid="business-map-pin"
                  >
                    <span
                      className={`absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/14 opacity-65 transition group-hover:scale-125 group-hover:opacity-100 ${
                        selectedBusinessId === business.id ? 'scale-125 opacity-100 ring-4 ring-primary/20' : ''
                      }`}
                      style={{ animationDelay: `${index * 120}ms` }}
                    />
                    <span
                      className={`relative flex size-12 -translate-y-1 items-center justify-center rounded-full border-[3px] border-white bg-primary text-primary-foreground shadow-[0_5px_14px_rgb(45_39_31_/_0.32)] transition group-hover:-translate-y-2 group-hover:scale-110 ${
                        selectedBusinessId === business.id ? '-translate-y-2 scale-110 ring-4 ring-accent/50' : ''
                      }`}
                    >
                      <span className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-white bg-primary" />
                      {business.logoUrl ? (
                        <img src={business.logoUrl} alt="" className="relative z-10 size-8 rounded-full object-cover" />
                      ) : (
                        <span className="relative z-10 font-serif text-xl font-bold">{business.name.slice(0, 1)}</span>
                      )}
                    </span>
                    <span className="absolute left-1/2 top-[calc(100%+0.5rem)] hidden min-w-32 -translate-x-1/2 rounded-lg border border-black/10 bg-white/95 px-3 py-1.5 text-xs font-bold text-[#3f3b35] shadow-[0_2px_8px_rgb(47_43_36_/_0.2)] backdrop-blur min-[520px]:block">
                      {business.name}
                    </span>
                    {!isExactPin ? (
                      <span className="absolute -right-3 -top-3 rounded-full border border-white/30 bg-[#f2c978] px-2 py-0.5 text-[0.55rem] font-black uppercase tracking-[0.08em] text-[#21140d] shadow-soft">
                        {t('Preview')}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </section>

            <aside className="min-w-0 max-w-full space-y-4">
              <div className="min-w-0 max-w-full rounded-[2rem] border border-primary/18 bg-card/90 p-5 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
                      {t('Business Directory')}
                    </p>
                    <h2 className="mt-1 font-serif text-3xl text-primary">{t('Partner Businesses')}</h2>
                  </div>
                  <Navigation className="size-5 text-primary" />
                </div>

                <div className="mt-5 space-y-3">
                  {partnerBusinesses.length === 0 ? (
                    <EmptyState
                      icon={<Store className="size-7" />}
                      title={t('Directory coming soon')}
                      description={t('Published partner businesses will be listed here with their exact locations and available products.')}
                    />
                  ) : partnerBusinesses.map((business) => (
                    <button
                      key={business.id}
                      type="button"
                      className={`w-full max-w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                        selectedBusinessId === business.id
                          ? 'border-primary/45 bg-card shadow-soft'
                          : 'border-primary/12 bg-[var(--muted)]'
                      }`}
                      onClick={() => openBusiness(business)}
                      aria-pressed={selectedBusinessId === business.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-serif text-xl text-primary">{business.name}</p>
                          <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-on-surface-variant/80">
                            {business.address || business.description}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            hasExactMapPin(business)
                              ? 'shrink-0 border-success/20 bg-success/10 text-success'
                              : 'shrink-0 border-warning/20 bg-warning/10 text-warning'
                          }
                        >
                          {hasExactMapPin(business) ? t('Exact') : t('Preview')}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {previewPinnedBusinesses.length > 0 ? (
                <div className="rounded-[2rem] border border-warning/20 bg-warning/10 p-5 text-warning">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 size-5 shrink-0" />
                    <p className="text-sm font-semibold leading-6">
                      {t('Partners without coordinates are shown with preview pins until exact locations are added.')}
                    </p>
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(selectedBusiness)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBusinessId(null)
            setSelectedProduct(null)
            setSelectedQuantity(1)
          }
        }}
      >
        <DialogContent className="max-w-3xl rounded-[2rem] p-6 sm:p-8">
          {selectedBusiness ? (
            <>
              <DialogHeader>
                <Badge variant="accent" className="w-fit">{t('Partner Business')}</Badge>
                <DialogTitle className="text-4xl text-primary">{selectedBusiness.name}</DialogTitle>
                <DialogDescription>
                  {selectedBusiness.address || selectedBusiness.description}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-3">
                <Button asChild variant="secondary" size="sm">
                  <a href={getDirectionsUrl(selectedBusiness)} target="_blank" rel="noreferrer">
                    <Navigation className="size-4" />
                    {t('Directions')}
                  </a>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-primary/12 bg-[var(--muted)] p-4">
                  <Ticket className="size-4 text-primary" />
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant/70">{t('Earn Rate')}</p>
                  <p className="mt-1 font-serif text-2xl text-primary">{selectedBusiness.earnRate} pts/$</p>
                </div>
                <div className="rounded-2xl border border-primary/12 bg-[var(--muted)] p-4">
                  <MapPin className="size-4 text-primary" />
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant/70">{t('Map Status')}</p>
                  <p className="mt-1 font-serif text-2xl text-primary">{hasExactMapPin(selectedBusiness) ? t('Exact') : t('Preview')}</p>
                </div>
                <div className="rounded-2xl border border-primary/12 bg-[var(--muted)] p-4">
                  <ShoppingCart className="size-4 text-primary" />
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant/70">{t('Products')}</p>
                  <p className="mt-1 font-serif text-2xl text-primary">{selectedProducts.length}</p>
                </div>
              </div>

              {selectedProduct ? (
                <div className="rounded-[1.5rem] border border-primary/20 bg-primary-container/10 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{t('Selected item')}</p>
                      <h3 className="mt-1 text-lg font-bold text-[var(--foreground)]">{t(selectedProduct.title)}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant/80">{formatCurrency(selectedProduct.price)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedQuantity((value) => Math.max(1, value - 1))}
                        disabled={selectedQuantity <= 1}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <span className="min-w-8 text-center text-lg font-bold text-primary">{selectedQuantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedQuantity((value) => Math.min(selectedProduct.inventory, value + 1))}
                        disabled={selectedQuantity >= selectedProduct.inventory}
                      >
                        <Plus className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        isLoading={addToCart.isPending}
                        disabled={selectedProduct.inventory <= 0 || addToCart.isPending}
                        onClick={addSelectedProduct}
                      >
                        {t('Add to Cart')}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                <h3 className="font-serif text-2xl text-primary">{t('Available Products')}</h3>
                {products.isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-24 rounded-2xl" />
                    ))}
                  </div>
                ) : selectedProducts.length === 0 ? (
                  <EmptyState
                    icon={<PackageSearch className="size-8" />}
                    title={t('No products yet')}
                    description={t('Products from this partner will appear here when they are available.')}
                    action={<Button type="button" variant="outline" onClick={() => setSelectedBusinessId(null)}>{t('Browse other partners')}</Button>}
                  />
                ) : (
                  <div className="max-h-[38vh] space-y-3 overflow-y-auto pr-1">
                    {selectedProducts.map((product) => (
                      <div key={product.id} className="rounded-2xl border border-primary/12 bg-card p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{t(product.category === 'Coffee' ? 'Drinks' : product.category)}</Badge>
                              {product.featured ? <Badge variant="accent">{t('Bonus Drop')}</Badge> : null}
                            </div>
                            <h4 className="mt-3 text-lg font-bold text-[var(--foreground)]">{t(product.title)}</h4>
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-on-surface-variant/80">{t(product.description)}</p>
                          </div>
                          <div className="flex shrink-0 items-end justify-between gap-4 sm:flex-col sm:items-end">
                            <div className="text-right">
                              <p className="font-serif text-2xl text-primary">{formatCurrency(product.price)}</p>
                              <p className="text-xs font-semibold text-on-surface-variant/70">{product.inventory} {t('in stock')}</p>
                            </div>
                            <Button
                              type="button"
                              variant={selectedProduct?.id === product.id ? 'default' : 'secondary'}
                              size="sm"
                              disabled={product.inventory <= 0}
                              onClick={() => chooseProduct(product)}
                            >
                              {selectedProduct?.id === product.id ? t('Selected') : t('Choose')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
