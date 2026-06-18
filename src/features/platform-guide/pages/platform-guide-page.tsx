import {
  BadgeCheck,
  Building2,
  ClipboardCheck,
  MapPinned,
  MonitorPlay,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const spanishScript = [
  {
    time: '00:00',
    title: 'Que es Medellin Rewards',
    body:
      'Medellin Rewards conecta clientes, negocios aliados y el equipo de operaciones en una sola plataforma. El cliente tiene un QR personal, el negocio registra compras con ese QR y el equipo puede ver actividad, puntos, socios y comisiones.',
  },
  {
    time: '00:35',
    title: 'Experiencia del cliente',
    body:
      'El cliente entra a su cuenta, completa su perfil y muestra su QR en un negocio aliado. Tambien puede explorar negocios, revisar su actividad y ver sus puntos o beneficios disponibles.',
  },
  {
    time: '01:20',
    title: 'Flujo para negocios',
    body:
      'El equipo del negocio abre el portal, escanea o ingresa el QR del cliente, escribe el valor de la compra y registra la venta. La plataforma calcula puntos, valor de recompensa y comision para Medellin Rewards.',
  },
  {
    time: '02:10',
    title: 'Flujo para administradores',
    body:
      'El equipo de Colombia puede crear negocios aliados, agregar direccion o coordenadas, revisar miembros, verificar IDs, manejar campañas y seguir comisiones pendientes.',
  },
  {
    time: '03:00',
    title: 'Como explicarlo en una demo',
    body:
      'Empieza con el QR del cliente, despues muestra una venta QR en el portal del negocio y termina con la vista admin para que el cliente vea control, trazabilidad y soporte operativo.',
  },
]

const englishScript = [
  {
    title: 'What the platform does',
    body:
      'Medellin Rewards connects members, partner businesses, and the operations team. Members use a personal QR, businesses record purchases from that QR, and admins monitor partners, points, and commissions.',
  },
  {
    title: 'Customer flow',
    body:
      'Customers sign in, complete their profile, show their QR at a partner business, explore participating businesses, and review their points activity.',
  },
  {
    title: 'Business flow',
    body:
      'Business staff open the portal, scan or enter the customer QR, add the purchase amount, and record the sale. Rewards and commission are calculated automatically.',
  },
  {
    title: 'Admin flow',
    body:
      'Admins create partner businesses, manage map location fields, review members, verify IDs, publish campaigns, and track commission owed.',
  },
]

const storyboard = [
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
    title: 'Venta con QR',
    route: '/business/dashboard',
    caption: 'El negocio registra compra, puntos y comision desde el portal.',
    mock: ['Escanear QR', 'Valor de compra', 'Confirmar puntos'],
  },
  {
    icon: ShieldCheck,
    label: 'Admin',
    title: 'Operaciones',
    route: '/admin/portal#members',
    caption: 'El equipo administra miembros, aliados, verificaciones y comisiones.',
    mock: ['Miembros', 'Aliados', 'Comisiones'],
  },
]

const teamChecklist = [
  'Mostrar primero el valor para el cliente: un QR sencillo y una cuenta donde se guarda todo.',
  'Despues explicar el valor para el negocio: ventas presenciales, puntos automaticos y seguimiento.',
  'Cerrar con confianza operativa: admin puede verificar IDs, crear aliados y revisar comisiones.',
  'Cuando exista el video final, reemplazar el bloque superior y dejar este guion como referencia interna.',
]

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

export function PlatformGuidePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-12 pb-10">
      <section className="grid gap-8 rounded-[2rem] border border-primary-container/18 bg-[var(--card)] p-6 shadow-card lg:grid-cols-[minmax(0,1fr)_420px] lg:p-8">
        <div className="space-y-6">
          <Badge variant="accent" className="w-fit rounded-full border-primary-container/25 bg-primary-container/12 text-primary">
            Guia interna y para clientes
          </Badge>
          <div className="space-y-4">
            <h1 className="font-serif text-5xl tracking-tight text-primary sm:text-6xl">
              Guia de la plataforma
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-on-surface-variant/85">
              Un lugar corto y claro para explicar que es Medellin Rewards, como se usa y que debe mostrar el equipo en una demo. Primero esta en espanol para el equipo de Colombia; despues queda el resumen en ingles.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full">
              <Link to="/shop">
                <MapPinned className="size-4" />
                Ver mapa
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/business/dashboard">
                <ScanLine className="size-4" />
                Portal negocio
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/admin/portal#members">
                <ShieldCheck className="size-4" />
                Admin
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-primary-container/20 bg-primary text-primary-foreground shadow-card">
          <div className="aspect-video rounded-t-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.24),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.14),rgba(0,0,0,0.22))] p-6">
            <div className="flex h-full flex-col items-center justify-center rounded-[1.5rem] border border-white/20 bg-black/18 text-center">
              <MonitorPlay className="size-14 text-primary-foreground" />
              <p className="mt-4 font-serif text-3xl">Video aqui proximamente</p>
              <p className="mt-2 max-w-xs text-sm leading-6 text-primary-foreground/80">
                Este bloque se reemplazara por el video oficial de entrenamiento.
              </p>
            </div>
          </div>
          <div className="space-y-3 p-5">
            {['Introduccion', 'Demo cliente', 'Demo negocio', 'Demo admin'].map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm">
                <span>{item}</span>
                <span className="font-mono text-primary-foreground/80">0{index}:00</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[2rem] border border-primary-container/18 bg-[var(--card)] p-6 shadow-card lg:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary-container/12 text-primary">
              <ClipboardCheck className="size-5" />
            </div>
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-on-surface-variant/75">
                Guion en espanol
              </p>
              <h2 className="mt-2 font-serif text-3xl text-primary">Script base para grabar</h2>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            {spanishScript.map((step) => (
              <article key={step.title} className="grid gap-4 rounded-2xl border border-outline-variant/16 bg-surface-low p-5 md:grid-cols-[5rem_minmax(0,1fr)]">
                <span className="font-mono text-sm font-bold text-primary-container">{step.time}</span>
                <div>
                  <h3 className="font-serif text-2xl text-primary">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-on-surface-variant/85">{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-secondary-container/25 bg-secondary-container/12 p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="size-5 text-secondary" />
            <h2 className="font-serif text-2xl text-primary">Notas para presentar</h2>
          </div>
          <div className="mt-6 space-y-4">
            {teamChecklist.map((item) => (
              <div key={item} className="flex gap-3">
                <BadgeCheck className="mt-1 size-4 shrink-0 text-secondary" />
                <p className="text-sm leading-6 text-on-surface-variant/85">{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-on-surface-variant/75">
              Storyboard con pantallas
            </p>
            <h2 className="mt-2 font-serif text-3xl text-primary">Que screenshots usar en el video</h2>
          </div>
          <Badge variant="outline" className="w-fit rounded-full">
            Version texto primero
          </Badge>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {storyboard.map((screen) => (
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
                <Link to={screen.route}>Abrir vista</Link>
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-outline-variant/16 bg-surface-low p-6 lg:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--card)] text-primary">
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-on-surface-variant/75">
              English version
            </p>
            <h2 className="mt-2 font-serif text-3xl text-primary">Platform guide summary</h2>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {englishScript.map((step) => (
            <article key={step.title} className="rounded-2xl border border-outline-variant/16 bg-[var(--card)] p-5">
              <h3 className="font-serif text-2xl text-primary">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant/85">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-primary-container/18 bg-[var(--card)] p-6 shadow-sm lg:p-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-on-surface-variant/75">
              Proximo paso
            </p>
            <h2 className="mt-2 font-serif text-3xl text-primary">Cuando el video este listo</h2>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant/85">
              Subir el archivo o link embed en el bloque superior. Este guion puede quedarse como material de apoyo para ventas, onboarding y entrenamiento interno.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Badge variant="outline" className="rounded-full px-4 py-2">
              Espanol primero
            </Badge>
            <Badge variant="outline" className="rounded-full px-4 py-2">
              Video ready later
            </Badge>
          </div>
        </div>
      </section>
    </div>
  )
}
