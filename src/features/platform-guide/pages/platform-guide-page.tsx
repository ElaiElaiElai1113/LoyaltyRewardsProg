import {
  Gift,
  LayoutDashboard,
  LogIn,
  MapPinned,
  MonitorPlay,
  QrCode,
  ScanLine,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getRoleScopedScreenshotRoutes,
  isRoleScopedGuideProgram,
  resolveRoleScopedGuideAudience,
  type RoleScopedGuideAudience,
} from '@/features/platform-guide/guide-role-scope'
import { useAuth } from '@/hooks/use-auth'
import { useTenant } from '@/hooks/use-tenant'
import { useLanguage, type Language } from '@/lib/language'

const screenshotGalleryByLanguage: Record<Language, {
  eyebrow: string
  title: string
  badge: string
  items: Array<{
    title: string
    caption: string
    imageSrc: string
    route: string
  }>
}> = {
  es: {
    eyebrow: 'Fotos reales',
    title: 'Pantallas para el walkthrough',
    badge: 'Listas para traducir',
    items: [
      {
        title: 'Guia publica',
        caption: 'La pagina base para explicar Medellin Rewards y el orden de la demo.',
        imageSrc: '/walkthrough-screenshots/guide.png',
        route: '/guide',
      },
      {
        title: 'Mapa de negocios',
        caption: 'Los clientes exploran negocios aliados y eligen donde comprar.',
        imageSrc: '/walkthrough-screenshots/public-map.png',
        route: '/shop',
      },
      {
        title: 'Pagina para negocios',
        caption: 'El equipo explica el valor para aliados antes de entrar al portal.',
        imageSrc: '/walkthrough-screenshots/business-page.png',
        route: '/business',
      },
      {
        title: 'Login negocio',
        caption: 'Staff y duenos entran al portal para registrar ventas QR.',
        imageSrc: '/walkthrough-screenshots/business-login.png',
        route: '/signin?portal=business',
      },
      {
        title: 'Login admin',
        caption: 'El equipo operativo entra para revisar miembros, aliados y comisiones.',
        imageSrc: '/walkthrough-screenshots/admin-login.png',
        route: '/signin?portal=admin',
      },
    ],
  },
  en: {
    eyebrow: 'Real photos',
    title: 'Screens for the walkthrough',
    badge: 'Translation-ready',
    items: [
      {
        title: 'Public guide',
        caption: 'The base page for explaining Medellin Rewards and the demo order.',
        imageSrc: '/walkthrough-screenshots/guide.png',
        route: '/guide',
      },
      {
        title: 'Business map',
        caption: 'Customers explore partner businesses and choose where to shop.',
        imageSrc: '/walkthrough-screenshots/public-map.png',
        route: '/shop',
      },
      {
        title: 'Business page',
        caption: 'The team explains partner value before entering the portal.',
        imageSrc: '/walkthrough-screenshots/business-page.png',
        route: '/business',
      },
      {
        title: 'Business login',
        caption: 'Staff and owners enter the portal to record QR sales.',
        imageSrc: '/walkthrough-screenshots/business-login.png',
        route: '/signin?portal=business',
      },
      {
        title: 'Admin login',
        caption: 'The operations team enters to review members, partners, and commissions.',
        imageSrc: '/walkthrough-screenshots/admin-login.png',
        route: '/signin?portal=admin',
      },
    ],
  },
  tl: {
    eyebrow: 'Mga aktuwal na larawan',
    title: 'Mga larawang gagamitin sa gabay',
    badge: 'Handa para sa pagsasalin',
    items: [
      {
        title: 'Pampublikong gabay',
        caption: 'Ang pangunahing pahina na nagpapaliwanag sa programa at sa pagkakasunod-sunod ng pagpapakita.',
        imageSrc: '/walkthrough-screenshots/guide.png',
        route: '/guide',
      },
      {
        title: 'Mapa ng mga negosyo',
        caption: 'Tinitingnan ng mga kostumer ang mga katuwang na negosyo at pinipili kung saan mamimili.',
        imageSrc: '/walkthrough-screenshots/public-map.png',
        route: '/shop',
      },
      {
        title: 'Pahina para sa mga negosyo',
        caption: 'Ipinapaliwanag ng pangkat ang halaga para sa mga katuwang bago buksan ang pahina ng negosyo.',
        imageSrc: '/walkthrough-screenshots/business-page.png',
        route: '/business',
      },
      {
        title: 'Pagpasok ng negosyo',
        caption: 'Binubuksan ng kawani at may-ari ang pahina ng negosyo upang magtala ng mga bentang gamit ang QR.',
        imageSrc: '/walkthrough-screenshots/business-login.png',
        route: '/signin?portal=business',
      },
      {
        title: 'Pagpasok ng tagapangasiwa',
        caption: 'Pumapasok ang pangkat ng operasyon upang suriin ang mga miyembro, katuwang, at komisyon.',
        imageSrc: '/walkthrough-screenshots/admin-login.png',
        route: '/signin?portal=admin',
      },
    ],
  },
}

const guideContent = {
  es: {
    eyebrow: 'Guia interna y para clientes',
    title: 'Guia de la plataforma',
    intro:
      'Un lugar corto y claro para explicar que es Medellin Rewards, como se usa y que debe mostrar el equipo en una demo.',
    links: {
      map: 'Ver mapa',
      business: 'Portal negocio',
      admin: 'Admin',
      openView: 'Abrir vista',
    },
    videoTitle: 'Recorrido guiado de la demo',
    videoBody: 'Usa los capitulos y el storyboard de esta pagina para completar la demo de principio a fin.',
    chapters: ['Introduccion', 'Demo cliente', 'Demo negocio', 'Demo admin'],
    storyboardEyebrow: 'Storyboard con pantallas',
    storyboardTitle: 'Que screenshots usar en el video',
    storyboardBadge: 'Version texto primero',
    storyboard: [
      {
        icon: QrCode,
        label: 'Cliente',
        title: 'QR personal',
        route: '/profile',
        caption: 'El cliente muestra su QR para ganar puntos en compras presenciales.',
        mock: ['Perfil verificado', 'QR de miembro', 'Historial de actividad'],
      },
      {
        icon: MapPinned,
        label: 'Descubrimiento',
        title: 'Mapa de negocios',
        route: '/shop',
        caption: 'Los usuarios exploran negocios aliados y eligen donde comprar.',
        mock: ['Mapa visual', 'Pines de aliados', 'Productos por negocio'],
      },
      {
        icon: ScanLine,
        label: 'Negocio',
        title: 'Transacciones',
        route: '/business/redemptions',
        caption: 'El negocio procesa ventas con o sin gift card y revisa historial.',
        mock: ['QR del cliente', 'Gift card opcional', 'Puntos y total'],
      },
      {
        icon: ShieldCheck,
        label: 'Admin',
        title: 'Operaciones',
        route: '/admin/portal#members',
        caption: 'El equipo administra miembros, aliados, verificaciones, gift cards y comisiones.',
        mock: ['Miembros', 'Gift cards', 'Comisiones'],
      },
    ],
    nextEyebrow: 'Proximo paso',
    nextTitle: 'Usa esta guia ahora',
    nextBody:
      'Sigue el storyboard en orden para mostrar la experiencia del cliente, el negocio y el administrador sin omitir ningun paso.',
    badges: ['Espanol primero', 'Recorrido completo'],
  },
  en: {
    eyebrow: 'Internal and customer guide',
    title: 'Platform guide',
    intro:
      'A short, clear place to explain what Medellin Rewards is, how it works, and what the team should show in a demo.',
    links: {
      map: 'View map',
      business: 'Business portal',
      admin: 'Admin',
      openView: 'Open view',
    },
    videoTitle: 'Guided demo walkthrough',
    videoBody: 'Use the chapters and storyboard on this page to complete the demo from beginning to end.',
    chapters: ['Introduction', 'Customer demo', 'Business demo', 'Admin demo'],
    storyboardEyebrow: 'Screen storyboard',
    storyboardTitle: 'Which screenshots to use in the video',
    storyboardBadge: 'Text-first version',
    storyboard: [
      {
        icon: QrCode,
        label: 'Customer',
        title: 'Personal QR',
        route: '/profile',
        caption: 'The customer shows their QR to earn points from in-person purchases.',
        mock: ['Verified profile', 'Member QR', 'Activity history'],
      },
      {
        icon: MapPinned,
        label: 'Discovery',
        title: 'Business map',
        route: '/shop',
        caption: 'Users explore partner businesses and choose where to shop.',
        mock: ['Visual map', 'Partner pins', 'Business products'],
      },
      {
        icon: ScanLine,
        label: 'Business',
        title: 'Transactions',
        route: '/business/redemptions',
        caption: 'The business processes sales with or without a gift card and reviews history.',
        mock: ['Customer QR', 'Optional gift card', 'Points and total'],
      },
      {
        icon: ShieldCheck,
        label: 'Admin',
        title: 'Operations',
        route: '/admin/portal#members',
        caption: 'The team manages members, partners, verifications, gift cards, and commissions.',
        mock: ['Members', 'Gift cards', 'Commissions'],
      },
    ],
    nextEyebrow: 'Next step',
    nextTitle: 'Use this guide now',
    nextBody:
      'Follow the storyboard in order to show the customer, business, and administrator experience without skipping a step.',
    badges: ['English version', 'Complete walkthrough'],
  },
  tl: {
    eyebrow: 'Panloob at gabay para sa kostumer',
    title: 'Gabay sa plataporma',
    intro:
      'Isang maikli at malinaw na paliwanag tungkol sa programa, kung paano ito ginagamit, at kung ano ang dapat ipakita ng pangkat sa pagpapakita.',
    links: {
      map: 'Tingnan ang mapa',
      business: 'Pahina ng negosyo',
      admin: 'Tagapangasiwa',
      openView: 'Buksan',
    },
    videoTitle: 'Gabay sa buong pagpapakita',
    videoBody: 'Sundin ang mga bahagi at ayos ng pahinang ito upang matapos ang pagpapakita mula simula hanggang dulo.',
    chapters: ['Panimula', 'Pagpapakita para sa kostumer', 'Pagpapakita para sa negosyo', 'Pagpapakita para sa tagapangasiwa'],
    storyboardEyebrow: 'Ayos ng mga pahina',
    storyboardTitle: 'Mga larawang gagamitin sa bidyo',
    storyboardBadge: 'Bersiyong teksto muna',
    storyboard: [
      {
        icon: QrCode,
        label: 'Kostumer',
        title: 'Personal na QR',
        route: '/profile',
        caption: 'Ipinapakita ng kostumer ang kanilang QR upang kumita ng puntos mula sa personal na pagbili.',
        mock: ['Natiyak na pagkakakilanlan', 'QR ng miyembro', 'Talaan ng aktibidad'],
      },
      {
        icon: MapPinned,
        label: 'Pagtuklas',
        title: 'Mapa ng mga negosyo',
        route: '/shop',
        caption: 'Tinitingnan ng mga gumagamit ang mga katuwang na negosyo at pinipili kung saan mamimili.',
        mock: ['Biswal na mapa', 'Mga marka ng katuwang', 'Mga produkto ng negosyo'],
      },
      {
        icon: ScanLine,
        label: 'Negosyo',
        title: 'Mga transaksiyon',
        route: '/business/redemptions',
        caption: 'Itinatala ng negosyo ang mga benta na mayroon o walang kard na regalo at sinusuri ang kasaysayan.',
        mock: ['QR ng kostumer', 'Opsiyonal na kard na regalo', 'Mga puntos at kabuuan'],
      },
      {
        icon: ShieldCheck,
        label: 'Tagapangasiwa',
        title: 'Mga operasyon',
        route: '/admin/portal#members',
        caption: 'Pinamamahalaan ng pangkat ang mga miyembro, katuwang, pagpapatunay, kard na regalo, at komisyon.',
        mock: ['Mga miyembro', 'Mga kard na regalo', 'Mga komisyon'],
      },
    ],
    nextEyebrow: 'Susunod na hakbang',
    nextTitle: 'Gamitin ang gabay na ito ngayon',
    nextBody:
      'Sundin ang ayos upang maipakita ang karanasan ng kostumer, negosyo, at tagapangasiwa nang walang nalalaktawang hakbang.',
    badges: ['Bersiyong Tagalog', 'Kumpletong gabay'],
  },
} satisfies Record<Language, {
  eyebrow: string
  title: string
  intro: string
  links: {
    map: string
    business: string
    admin: string
    openView: string
  }
  videoTitle: string
  videoBody: string
  chapters: string[]
  storyboardEyebrow: string
  storyboardTitle: string
  storyboardBadge: string
  storyboard: Array<{
    icon: typeof QrCode
    label: string
    title: string
    route: string
    caption: string
    mock: string[]
  }>
  nextEyebrow: string
  nextTitle: string
  nextBody: string
  badges: string[]
}>

type GuideAction = {
  icon: typeof MapPinned
  label: string
  route: string
}

type RoleGuideContent = {
  eyebrow: string
  intro: string
  panelTitle: string
  panelBody: string
  chapters: string[]
  actions: GuideAction[]
  nextTitle: string
  nextBody: string
  badges: string[]
  gallery: {
    eyebrow: string
    title: string
    badge: string
  } | null
}

const roleScopedGuideContent: Record<Language, Record<RoleScopedGuideAudience, RoleGuideContent>> = {
  es: {
    public: {
      eyebrow: 'Guia del programa',
      intro: 'Conoce como funciona el programa de recompensas, explora negocios aliados y elige donde comenzar.',
      panelTitle: 'Empieza aqui',
      panelBody: 'Una introduccion breve para visitantes antes de crear una cuenta o iniciar sesion.',
      chapters: ['Como funcionan las recompensas', 'Explorar negocios aliados', 'Unirse o iniciar sesion'],
      actions: [
        { icon: MapPinned, label: 'Ver mapa', route: '/shop' },
        { icon: ScanLine, label: 'Para negocios', route: '/business' },
        { icon: LogIn, label: 'Iniciar sesion', route: '/signin' },
      ],
      nextTitle: 'Elige tu proximo paso',
      nextBody: 'Explora los negocios disponibles, conoce el programa para aliados o inicia sesion en tu cuenta.',
      badges: ['Guia publica', 'Sin cuenta requerida'],
      gallery: {
        eyebrow: 'Paginas publicas',
        title: 'Explora el programa',
        badge: 'Sin cuenta requerida',
      },
    },
    customer: {
      eyebrow: 'Guia para clientes',
      intro: 'Todo lo necesario para encontrar aliados, usar tu QR de miembro y revisar tus recompensas.',
      panelTitle: 'Funciones para clientes',
      panelBody: 'Estas son las funciones disponibles para tu cuenta de cliente.',
      chapters: ['Abrir tu panel', 'Encontrar negocios aliados', 'Mostrar tu QR de miembro', 'Revisar tu actividad'],
      actions: [
        { icon: LayoutDashboard, label: 'Mi panel', route: '/dashboard' },
        { icon: MapPinned, label: 'Ver mapa', route: '/shop' },
        { icon: QrCode, label: 'Mi QR', route: '/profile' },
      ],
      nextTitle: 'Continua con tu cuenta',
      nextBody: 'Usa el mapa para elegir un negocio o abre tu QR cuando estes listo para ganar recompensas.',
      badges: ['Solo clientes', 'Funciones esenciales'],
      gallery: {
        eyebrow: 'Recurso para clientes',
        title: 'Encuentra negocios participantes',
        badge: 'Solo clientes',
      },
    },
    business: {
      eyebrow: 'Guia para negocios',
      intro: 'Las funciones necesarias para atender clientes, registrar transacciones y revisar la actividad del negocio.',
      panelTitle: 'Funciones para negocios',
      panelBody: 'Esta guia muestra solo las herramientas disponibles para propietarios y personal.',
      chapters: ['Abrir el panel del negocio', 'Registrar una transaccion', 'Revisar clientes y actividad'],
      actions: [
        { icon: LayoutDashboard, label: 'Panel del negocio', route: '/business/dashboard' },
        { icon: ScanLine, label: 'Transacciones', route: '/business/redemptions' },
        { icon: Users, label: 'Clientes', route: '/business/members' },
      ],
      nextTitle: 'Continua con las operaciones',
      nextBody: 'Abre el panel para atender clientes, registrar una compra o revisar la actividad reciente.',
      badges: ['Solo negocios', 'Herramientas operativas'],
      gallery: null,
    },
    admin: {
      eyebrow: 'Guia para administradores',
      intro: 'Acceso directo a las funciones de administracion, membresias y gift cards de la plataforma.',
      panelTitle: 'Funciones administrativas',
      panelBody: 'Esta guia muestra solo las herramientas disponibles para administradores de plataforma.',
      chapters: ['Abrir operaciones', 'Administrar miembros y aliados', 'Revisar membresias y gift cards'],
      actions: [
        { icon: ShieldCheck, label: 'Portal admin', route: '/admin/portal' },
        { icon: Gift, label: 'Gift cards', route: '/admin/gift-cards' },
        { icon: Users, label: 'Membresias', route: '/admin/memberships' },
      ],
      nextTitle: 'Continua con la administracion',
      nextBody: 'Abre la herramienta administrativa que necesitas sin pasar por portales de clientes o negocios.',
      badges: ['Solo administradores', 'Operaciones de plataforma'],
      gallery: null,
    },
  },
  en: {
    public: {
      eyebrow: 'Program guide',
      intro: 'Learn how the rewards program works, explore partner businesses, and choose where to begin.',
      panelTitle: 'Start here',
      panelBody: 'A short introduction for visitors before creating an account or signing in.',
      chapters: ['How rewards work', 'Explore partner businesses', 'Join or sign in'],
      actions: [
        { icon: MapPinned, label: 'View map', route: '/shop' },
        { icon: ScanLine, label: 'For businesses', route: '/business' },
        { icon: LogIn, label: 'Sign in', route: '/signin' },
      ],
      nextTitle: 'Choose your next step',
      nextBody: 'Explore available businesses, learn about the partner program, or sign in to your account.',
      badges: ['Public guide', 'No account required'],
      gallery: {
        eyebrow: 'Public pages',
        title: 'Explore the program',
        badge: 'No account required',
      },
    },
    customer: {
      eyebrow: 'Customer guide',
      intro: 'Everything you need to find partners, use your member QR, and review your rewards.',
      panelTitle: 'Customer essentials',
      panelBody: 'These are the features available to your customer account.',
      chapters: ['Open your dashboard', 'Find partner businesses', 'Show your member QR', 'Review rewards activity'],
      actions: [
        { icon: LayoutDashboard, label: 'My dashboard', route: '/dashboard' },
        { icon: MapPinned, label: 'View map', route: '/shop' },
        { icon: QrCode, label: 'My QR', route: '/profile' },
      ],
      nextTitle: 'Continue with your account',
      nextBody: 'Use the map to choose a business or open your QR when you are ready to earn rewards.',
      badges: ['Customer only', 'Rewards essentials'],
      gallery: {
        eyebrow: 'Customer resource',
        title: 'Find participating businesses',
        badge: 'Customer only',
      },
    },
    business: {
      eyebrow: 'Business guide',
      intro: 'The tools you need to serve customers, record transactions, and review business activity.',
      panelTitle: 'Business essentials',
      panelBody: 'This guide shows only the tools available to owners and staff.',
      chapters: ['Open the business dashboard', 'Record a customer transaction', 'Review customers and activity'],
      actions: [
        { icon: LayoutDashboard, label: 'Business dashboard', route: '/business/dashboard' },
        { icon: ScanLine, label: 'Transactions', route: '/business/redemptions' },
        { icon: Users, label: 'Customers', route: '/business/members' },
      ],
      nextTitle: 'Continue with operations',
      nextBody: 'Open the dashboard to serve customers, record a purchase, or review recent activity.',
      badges: ['Business only', 'Operational tools'],
      gallery: null,
    },
    admin: {
      eyebrow: 'Administrator guide',
      intro: 'Direct access to the platform administration, membership, and gift-card tools.',
      panelTitle: 'Administrator essentials',
      panelBody: 'This guide shows only the tools available to platform administrators.',
      chapters: ['Open operations', 'Manage members and partners', 'Review memberships and gift cards'],
      actions: [
        { icon: ShieldCheck, label: 'Admin portal', route: '/admin/portal' },
        { icon: Gift, label: 'Gift cards', route: '/admin/gift-cards' },
        { icon: Users, label: 'Memberships', route: '/admin/memberships' },
      ],
      nextTitle: 'Continue with administration',
      nextBody: 'Open the administrative tool you need without passing through customer or business portals.',
      badges: ['Administrator only', 'Platform operations'],
      gallery: null,
    },
  },
  tl: {
    public: {
      eyebrow: 'Gabay sa programa',
      intro: 'Alamin kung paano gumagana ang programa ng mga gantimpala, tingnan ang mga katuwang na negosyo, at piliin kung saan magsisimula.',
      panelTitle: 'Magsimula rito',
      panelBody: 'Isang maikling panimula para sa mga bisita bago gumawa ng kuwenta o pumasok.',
      chapters: ['Paano gumagana ang mga gantimpala', 'Tingnan ang mga katuwang na negosyo', 'Sumali o pumasok'],
      actions: [
        { icon: MapPinned, label: 'Tingnan ang mapa', route: '/shop' },
        { icon: ScanLine, label: 'Para sa mga negosyo', route: '/business' },
        { icon: LogIn, label: 'Pumasok', route: '/signin' },
      ],
      nextTitle: 'Piliin ang susunod mong hakbang',
      nextBody: 'Tingnan ang mga negosyong magagamit, alamin ang programa para sa mga katuwang, o pumasok sa iyong kuwenta.',
      badges: ['Pampublikong gabay', 'Hindi kailangan ng kuwenta'],
      gallery: {
        eyebrow: 'Mga pampublikong pahina',
        title: 'Tingnan ang programa',
        badge: 'Hindi kailangan ng kuwenta',
      },
    },
    customer: {
      eyebrow: 'Gabay para sa kostumer',
      intro: 'Lahat ng kailangan upang makahanap ng mga katuwang, gamitin ang QR ng miyembro, at suriin ang iyong mga gantimpala.',
      panelTitle: 'Mahahalagang gamit para sa kostumer',
      panelBody: 'Ito lamang ang mga gamit na magagamit sa iyong kuwenta bilang kostumer.',
      chapters: ['Buksan ang iyong pangunahing pahina', 'Hanapin ang mga katuwang na negosyo', 'Ipakita ang QR ng miyembro', 'Suriin ang aktibidad ng mga gantimpala'],
      actions: [
        { icon: LayoutDashboard, label: 'Aking pangunahing pahina', route: '/dashboard' },
        { icon: MapPinned, label: 'Tingnan ang mapa', route: '/shop' },
        { icon: QrCode, label: 'Aking QR', route: '/profile' },
      ],
      nextTitle: 'Magpatuloy gamit ang iyong kuwenta',
      nextBody: 'Gamitin ang mapa upang pumili ng negosyo o buksan ang iyong QR kapag handa ka nang kumita ng mga gantimpala.',
      badges: ['Para lamang sa kostumer', 'Mahahalagang gamit'],
      gallery: {
        eyebrow: 'Sanggunian ng kostumer',
        title: 'Hanapin ang mga kasaling negosyo',
        badge: 'Para lamang sa kostumer',
      },
    },
    business: {
      eyebrow: 'Gabay para sa negosyo',
      intro: 'Ang mga gamit na kailangan upang maglingkod sa mga kostumer, magtala ng mga transaksiyon, at suriin ang aktibidad ng negosyo.',
      panelTitle: 'Mahahalagang gamit para sa negosyo',
      panelBody: 'Ipinapakita lamang ng gabay na ito ang mga gamit para sa mga may-ari at kawani.',
      chapters: ['Buksan ang pangunahing pahina ng negosyo', 'Magtala ng transaksiyon ng kostumer', 'Suriin ang mga kostumer at aktibidad'],
      actions: [
        { icon: LayoutDashboard, label: 'Pangunahing pahina ng negosyo', route: '/business/dashboard' },
        { icon: ScanLine, label: 'Mga transaksiyon', route: '/business/redemptions' },
        { icon: Users, label: 'Mga kostumer', route: '/business/members' },
      ],
      nextTitle: 'Magpatuloy sa mga operasyon',
      nextBody: 'Buksan ang pangunahing pahina upang maglingkod sa mga kostumer, magtala ng pagbili, o suriin ang kamakailang aktibidad.',
      badges: ['Para lamang sa negosyo', 'Mga gamit sa operasyon'],
      gallery: null,
    },
    admin: {
      eyebrow: 'Gabay para sa tagapangasiwa',
      intro: 'Direktang daan sa pamamahala ng plataporma, mga kasapian, at mga kard na regalo.',
      panelTitle: 'Mahahalagang gamit para sa tagapangasiwa',
      panelBody: 'Ipinapakita lamang ng gabay na ito ang mga gamit para sa mga tagapangasiwa ng plataporma.',
      chapters: ['Buksan ang mga operasyon', 'Pamahalaan ang mga miyembro at katuwang', 'Suriin ang mga kasapian at kard na regalo'],
      actions: [
        { icon: ShieldCheck, label: 'Pahina ng tagapangasiwa', route: '/admin/portal' },
        { icon: Gift, label: 'Mga kard na regalo', route: '/admin/gift-cards' },
        { icon: Users, label: 'Mga kasapian', route: '/admin/memberships' },
      ],
      nextTitle: 'Magpatuloy sa pamamahala',
      nextBody: 'Buksan ang kailangan mong gamit sa pamamahala nang hindi dumaraan sa mga pahina ng kostumer o negosyo.',
      badges: ['Para lamang sa tagapangasiwa', 'Mga operasyon ng plataporma'],
      gallery: null,
    },
  },
}

function ScreenshotMockup({ items }: { items: string[] }) {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-primary-container/20 bg-surface-low shadow-soft">
      <div className="flex items-center gap-1.5 border-b border-primary-container/10 bg-[var(--card)] px-4 py-3">
        <span className="size-2 rounded-full bg-red-300" />
        <span className="size-2 rounded-full bg-yellow-300" />
        <span className="size-2 rounded-full bg-green-300" />
      </div>
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 rounded-full bg-primary/20" />
        {items.map((item, index) => (
          <div key={item} className="flex items-center gap-3 rounded-xl bg-[var(--card)] p-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary-container/15 text-xs font-bold text-primary">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-primary">{item}</p>
              <div className="mt-2 h-2 w-full rounded-full bg-outline-variant/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GuideMediaPreview({
  brandName,
  caption,
  imageSrc,
  language,
  route,
  title,
  useScreenshot,
}: {
  brandName: string
  caption: string
  imageSrc: string
  language: Language
  route: string
  title: string
  useScreenshot: boolean
}) {
  if (language === 'en' && useScreenshot) {
    return (
      <img
        src={imageSrc}
        alt={title}
        loading="lazy"
        className="h-full w-full object-cover object-top"
      />
    )
  }

  const PreviewIcon = route.startsWith('/shop') ? MapPinned : ScanLine

  return (
    <div
      aria-label={title}
      className="flex h-full w-full flex-col items-center justify-center gap-4 bg-surface-low p-8 text-center"
      data-testid="localized-guide-preview"
      role="img"
    >
      <span className="flex size-16 items-center justify-center rounded-3xl border border-primary-container/20 bg-[var(--card)] text-primary shadow-soft">
        <PreviewIcon className="size-8" aria-hidden="true" />
      </span>
      <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/70">
        {brandName}
      </span>
      <p className="font-serif text-2xl text-primary">{title}</p>
      <p className="max-w-sm text-sm leading-6 text-on-surface-variant/80">{caption}</p>
    </div>
  )
}

export function PlatformGuidePage() {
  const { language } = useLanguage()
  const { program } = useTenant()
  const { profile } = useAuth()
  const tenantize = <T,>(value: T): T => {
    if (typeof value === 'string') {
      return value
        .replaceAll('Medellin Rewards', program.name)
        .replaceAll('Medellín Rewards', program.name) as T
    }
    if (Array.isArray(value)) return value.map((item) => tenantize(item)) as T
    if (value && typeof value === 'object' && !('$$typeof' in value)) {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, tenantize(item)]),
      ) as T
    }
    return value
  }
  const content = tenantize(guideContent[language])
  const isRoleScopedGuide = isRoleScopedGuideProgram(program.slug)
  const guideAudience = resolveRoleScopedGuideAudience(profile?.role)
  const roleGuideContent = tenantize(roleScopedGuideContent[language][guideAudience])
  const activeGuideContent = isRoleScopedGuide
    ? {
        eyebrow: roleGuideContent.eyebrow,
        title: content.title,
        intro: roleGuideContent.intro,
        panelTitle: roleGuideContent.panelTitle,
        panelBody: roleGuideContent.panelBody,
        panelIcon: guideAudience === 'customer'
          ? QrCode
          : guideAudience === 'business'
            ? ScanLine
            : guideAudience === 'admin'
              ? ShieldCheck
              : MapPinned,
        chapters: roleGuideContent.chapters,
        actions: roleGuideContent.actions,
        nextEyebrow: content.nextEyebrow,
        nextTitle: roleGuideContent.nextTitle,
        nextBody: roleGuideContent.nextBody,
        badges: roleGuideContent.badges,
      }
    : {
        eyebrow: content.eyebrow,
        title: content.title,
        intro: content.intro,
        panelTitle: content.videoTitle,
        panelBody: content.videoBody,
        panelIcon: MonitorPlay,
        chapters: content.chapters,
        actions: [
          { icon: MapPinned, label: content.links.map, route: '/shop' },
          { icon: ScanLine, label: content.links.business, route: '/business/dashboard' },
          { icon: ShieldCheck, label: content.links.admin, route: '/admin/portal#members' },
        ],
        nextEyebrow: content.nextEyebrow,
        nextTitle: content.nextTitle,
        nextBody: content.nextBody,
        badges: content.badges,
      }
  const tenantScreenshotDirectory = program.slug === 'medellin'
    ? '/walkthrough-screenshots'
    : program.slug === 'wondertown'
      ? '/walkthrough-screenshots/wondertown'
      : program.slug === 'pinas'
        ? '/walkthrough-screenshots/rewardme'
        : null
  const useTenantScreenshots = tenantScreenshotDirectory !== null
  const tenantScreenshotGallery = tenantize(screenshotGalleryByLanguage[language])
  const screenshotGallery = {
    ...tenantScreenshotGallery,
    items: tenantScreenshotGallery.items.map((item) => ({
      ...item,
      imageSrc: tenantScreenshotDirectory
        ? `${tenantScreenshotDirectory}/${item.imageSrc.split('/').at(-1)}`
        : '',
    })),
  }
  const roleScreenshotRoutes = getRoleScopedScreenshotRoutes(guideAudience)
  const visibleScreenshotItems = isRoleScopedGuide
    ? screenshotGallery.items.filter((item) => roleScreenshotRoutes.includes(item.route))
    : screenshotGallery.items
  const galleryHeading = isRoleScopedGuide ? roleGuideContent.gallery : screenshotGallery
  const customerResourceScreen = visibleScreenshotItems[0]
  const mergeCustomerResourceAndNextStep = isRoleScopedGuide
    && guideAudience === 'customer'
    && Boolean(galleryHeading && customerResourceScreen)
  const GuidePanelIcon = activeGuideContent.panelIcon

  return (
    <div
      className="w-full space-y-12 pb-10"
      data-guide-audience={isRoleScopedGuide ? guideAudience : 'legacy'}
      data-testid="platform-guide"
    >
      <section className="grid gap-8 rounded-[2rem] border border-primary-container/18 bg-[var(--card)] p-6 shadow-card lg:grid-cols-[minmax(0,1fr)_420px] lg:p-8">
        <div className="space-y-6">
          <Badge variant="accent" className="w-fit rounded-full border-primary-container/25 bg-primary-container/12 text-primary">
            {activeGuideContent.eyebrow}
          </Badge>
          <div className="space-y-4">
            <h1 className="font-serif text-5xl tracking-tight text-primary sm:text-6xl">
              {activeGuideContent.title}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-on-surface-variant/85">
              {activeGuideContent.intro}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {activeGuideContent.actions.map((action, index) => (
              <Button
                key={action.route}
                asChild
                variant={index === 0 ? 'default' : 'outline'}
                className="rounded-full"
              >
                <Link to={action.route}>
                  <action.icon className="size-4" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-primary-container/20 bg-primary text-primary-foreground shadow-card">
          <div className="aspect-video rounded-t-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.24),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.14),rgba(0,0,0,0.22))] p-6">
            <div className="flex h-full flex-col items-center justify-center rounded-[1.5rem] border border-white/20 bg-black/18 text-center">
              <GuidePanelIcon className="size-14 text-primary-foreground" />
              <p className="mt-4 font-serif text-3xl">{activeGuideContent.panelTitle}</p>
              <p className="mt-2 max-w-xs text-sm leading-6 text-primary-foreground/80">
                {activeGuideContent.panelBody}
              </p>
            </div>
          </div>
          <div className="space-y-3 p-5">
            {activeGuideContent.chapters.map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm">
                <span>{item}</span>
                <span className="font-mono text-primary-foreground/80">
                  {isRoleScopedGuide ? String(index + 1).padStart(2, '0') : `0${index}:00`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {mergeCustomerResourceAndNextStep && galleryHeading && customerResourceScreen ? (
        <section
          className="grid overflow-hidden rounded-[2rem] border border-primary-container/18 bg-[var(--card)] shadow-card lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]"
          data-testid="customer-guide-resource"
        >
          <div
            className="min-h-64 overflow-hidden bg-surface-low sm:min-h-80 lg:min-h-[34rem]"
            data-testid="customer-guide-resource-media"
          >
            <GuideMediaPreview
              brandName={program.name}
              caption={customerResourceScreen.caption}
              imageSrc={customerResourceScreen.imageSrc}
              language={language}
              route={customerResourceScreen.route}
              title={customerResourceScreen.title}
              useScreenshot={useTenantScreenshots}
            />
          </div>

          <div
            className="flex flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10"
            data-testid="customer-guide-resource-content"
          >
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-on-surface-variant/75">
                    {galleryHeading.eyebrow}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl text-primary sm:text-4xl">
                    {galleryHeading.title}
                  </h2>
                </div>
                <Badge variant="outline" className="w-fit shrink-0 rounded-full">
                  {galleryHeading.badge}
                </Badge>
              </div>

              <div className="mt-7">
                <h3 className="font-serif text-2xl text-primary">{customerResourceScreen.title}</h3>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant/85">
                  {customerResourceScreen.caption}
                </p>
                <Button asChild className="mt-5 w-full rounded-full sm:w-auto">
                  <Link to={customerResourceScreen.route}>{content.links.openView}</Link>
                </Button>
              </div>
            </div>

            <div className="border-t border-primary-container/18 pt-6">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-on-surface-variant/75">
                {activeGuideContent.nextEyebrow}
              </p>
              <h3 className="mt-2 font-serif text-3xl text-primary">{activeGuideContent.nextTitle}</h3>
              <p className="mt-3 text-sm leading-7 text-on-surface-variant/85">
                {activeGuideContent.nextBody}
              </p>
              {activeGuideContent.badges
                .filter((badge) => badge !== galleryHeading.badge)
                .map((badge) => (
                  <Badge key={badge} variant="outline" className="mt-4 rounded-full px-4 py-2">
                    {badge}
                  </Badge>
                ))}
            </div>
          </div>
        </section>
      ) : galleryHeading && visibleScreenshotItems.length > 0 ? (
        <section className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-on-surface-variant/75">
                {galleryHeading.eyebrow}
              </p>
              <h2 className="mt-2 font-serif text-3xl text-primary">{galleryHeading.title}</h2>
            </div>
            <Badge variant="outline" className="w-fit rounded-full">
              {galleryHeading.badge}
            </Badge>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleScreenshotItems.map((screen) => (
              <article key={`${screen.route}-${screen.title}`} className="overflow-hidden rounded-[2rem] border border-primary-container/18 bg-[var(--card)] shadow-sm">
                <div className="aspect-[4/3] overflow-hidden bg-surface-low">
                  <GuideMediaPreview
                    brandName={program.name}
                    caption={screen.caption}
                    imageSrc={screen.imageSrc}
                    language={language}
                    route={screen.route}
                    title={screen.title}
                    useScreenshot={useTenantScreenshots}
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-2xl text-primary">{screen.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant/85">{screen.caption}</p>
                  <Button asChild variant="ghost" className="mt-4 w-full rounded-full">
                    <Link to={screen.route}>{content.links.openView}</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {!isRoleScopedGuide ? (
        <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-on-surface-variant/75">
              {content.storyboardEyebrow}
            </p>
            <h2 className="mt-2 font-serif text-3xl text-primary">{content.storyboardTitle}</h2>
          </div>
          <Badge variant="outline" className="w-fit rounded-full">
            {content.storyboardBadge}
          </Badge>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {content.storyboard.map((screen) => (
            <article key={screen.title} className="rounded-[2rem] border border-primary-container/18 bg-[var(--card)] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="accent" className="rounded-full border-primary-container/20 bg-primary-container/10 text-primary">
                    {screen.label}
                  </Badge>
                  <h3 className="mt-4 font-serif text-2xl text-primary">{screen.title}</h3>
                </div>
                <screen.icon className="size-6 text-primary-container" />
              </div>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant/85">{screen.caption}</p>
              <ScreenshotMockup items={screen.mock} />
              <Button asChild variant="ghost" className="mt-4 w-full rounded-full">
                <Link to={screen.route}>{content.links.openView}</Link>
              </Button>
            </article>
          ))}
        </div>
        </section>
      ) : null}

      {!mergeCustomerResourceAndNextStep ? (
        <section
          className="rounded-[2rem] border border-primary-container/18 bg-[var(--card)] p-6 shadow-sm lg:p-8"
          data-testid="platform-guide-next-step"
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-on-surface-variant/75">
                {activeGuideContent.nextEyebrow}
              </p>
              <h2 className="mt-2 font-serif text-3xl text-primary">{activeGuideContent.nextTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-on-surface-variant/85">
                {activeGuideContent.nextBody}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              {activeGuideContent.badges.map((badge) => (
                <Badge key={badge} variant="outline" className="rounded-full px-4 py-2">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
