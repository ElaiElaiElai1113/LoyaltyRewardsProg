import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'
import { useTenant } from '@/hooks/use-tenant'
import { getLegalJoinLabel, getLegalPageContent, type LegalPageKind } from '@/features/legal/legal-content'

interface LegalPageProps {
  kind: LegalPageKind
}

export function LegalPage({ kind }: LegalPageProps) {
  const { t } = useLanguage()
  const { program } = useTenant()
  const page = getLegalPageContent(kind, program.slug)
  const tenantText = (text: string) => t(text)
    .replaceAll('RewardMe', program.name)
    .replaceAll('support@rewardme.ph', program.supportEmail)

  return (
    <main className="product-legal-shell min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Link to="/" className="font-serif text-2xl font-bold text-[var(--primary)]">
            {program.name}
          </Link>
          <Button asChild variant="outline" className="w-full rounded-full sm:w-auto">
            <Link to="/join">{t(getLegalJoinLabel(program.slug))}</Link>
          </Button>
        </div>

        <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--card-foreground)] shadow-soft sm:p-8">
          <Badge
            variant="accent"
            className="border-[var(--secondary)]/25 bg-[var(--accent)] text-[var(--accent-foreground)]"
          >
            {t('Customer trust')}
          </Badge>
          <h1 className="mt-5 font-serif text-5xl font-semibold leading-none text-[var(--primary-container)]">{t(page.title)}</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-[var(--muted-foreground)]">{tenantText(page.intro)}</p>
          {page.notice ? (
            <p className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
              {t(page.notice)}
            </p>
          ) : null}
        </section>

        <section className="grid gap-4">
          {page.sections.map((section) => (
            <article key={section.title} className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--card-foreground)] shadow-soft">
              <h2 className="font-serif text-3xl leading-none text-[var(--primary-container)]">{t(section.title)}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-[var(--muted-foreground)]">{tenantText(section.body)}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
