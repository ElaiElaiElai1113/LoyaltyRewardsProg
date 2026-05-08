import { CalendarClock, Gift, Repeat2, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { LanguagePicker } from '@/components/language-picker'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/language'

const rewardHighlights = [
  {
    icon: Gift,
    title: '20% to 100% back',
    body: 'Earn a minimum of 20% and up to 100% in Rewards when you spend within the network.',
  },
  {
    icon: Repeat2,
    title: 'Founder lifetime bonus',
    body: 'Early adopters receive 100% back in Rewards on their monthly subscription - for life.',
  },
  {
    icon: CalendarClock,
    title: 'More ways to earn',
    body: 'Members will earn from everyday spending now, with lower Rewards on big purchases planned for the future.',
  },
]

export function HomePage() {
  const { t } = useLanguage()

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface px-4 py-4 md:px-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--rose-brown)_18%,transparent),transparent_28%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--espresso)_28%,transparent),transparent_32%)]" />

      <header className="relative z-20 mx-auto flex w-full max-w-[78rem] items-center justify-between gap-3 py-2">
        <Link to="/" className="font-serif text-2xl text-[var(--foreground)]">
          Medellin Rewards
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle className="rounded-full border border-[var(--champagne)]/24 bg-[var(--espresso)]/35 text-[var(--champagne)] hover:bg-[var(--espresso)]/55 hover:text-[var(--cream)]" />
          <LanguagePicker className="text-on-surface-variant" />
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100svh-5rem)] max-w-[78rem] items-center gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.42fr)]">
        <section className="relative flex min-h-0 flex-col justify-center overflow-hidden rounded-[1.6rem] border border-[var(--blush)]/18 bg-[linear-gradient(145deg,var(--espresso)_0%,color-mix(in_srgb,var(--espresso)_82%,var(--rose-brown))_58%,color-mix(in_srgb,var(--espresso)_68%,var(--rose-brown))_100%)] px-6 py-7 text-[var(--cream)] shadow-panel md:px-9 lg:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--blush)_12%,transparent),transparent_28%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--champagne)_18%,transparent),transparent_30%)]" />
          <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[4rem] bg-[linear-gradient(135deg,var(--champagne),var(--blush))] opacity-75" />
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[linear-gradient(90deg,var(--blush),var(--champagne),var(--rose-brown))]" />

          <div className="relative z-10 max-w-4xl space-y-5">
            <Badge variant="accent" className="w-fit border-[var(--blush)]/30 bg-[var(--espresso)]/75 px-4 py-1.5 text-[var(--cream)]">
              {t("The world's highest paying Rewards Program!")}
            </Badge>
            <div className="space-y-4">
              <h1 className="font-serif text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.92] tracking-[0.01em] text-[var(--cream)]">
                {t('Free vacations')}<br />
                <span className="text-[var(--champagne)]">{t('can start with')}</span><br />
                {t('everyday spending')}.
              </h1>
              <p className="max-w-3xl text-base font-medium leading-7 text-[var(--cream)]/88">
                {t('Imagine going on a free vacation every year - just by earning Rewards doing things you already do. Medellin Rewards pays you a minimum of 20% and up to 100% in Rewards every time you spend at businesses within our network.')}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/signin"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--champagne)]/45 bg-[var(--champagne)] px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--espresso)] shadow-soft transition hover:-translate-y-0.5 hover:bg-[var(--cream)]"
                >
                  {t('Start earning')}
                </Link>
                <Link
                  to="/rewards"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--blush)]/45 bg-[var(--espresso)]/35 px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--cream)] shadow-soft transition hover:-translate-y-0.5 hover:bg-[var(--espresso)]/55"
                >
                  <Gift className="size-4" />
                  {t('View rewards')}
                </Link>
                <Link
                  to="/business"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--blush)]/45 bg-[var(--espresso)]/35 px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--cream)] transition hover:-translate-y-0.5 hover:bg-[var(--espresso)]/55"
                >
                  {t('For businesses')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <aside className="grid gap-4">
          <div className="rounded-[1.4rem] border border-[var(--border)] bg-card/86 p-5 text-card-foreground shadow-soft backdrop-blur">
            <Sparkles className="mb-4 size-9 text-primary" />
            <p className="font-serif text-3xl leading-tight text-primary">{t('Earn from what you already do')}</p>
            <p className="mt-3 text-sm font-medium leading-6 text-[var(--muted-foreground)]">
              {t('The video will explain the program in a simple way, then members can explore where their everyday spending turns into Rewards.')}
            </p>
          </div>

          <div className="grid gap-3">
            {rewardHighlights.map((item) => (
              <div key={item.title} className="rounded-[1rem] border border-[var(--border)] bg-card/80 p-4 shadow-sm backdrop-blur">
                <div className="mb-3 flex size-9 items-center justify-center rounded-[0.8rem] bg-primary/12 text-primary">
                  <item.icon className="size-4" />
                </div>
                <h2 className="font-serif text-xl leading-none text-primary">{t(item.title)}</h2>
                <p className="mt-2 text-xs font-semibold leading-5 text-[var(--muted-foreground)]">{t(item.body)}</p>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  )
}
