import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'

export function NotFoundPage() {
  const { t } = useLanguage()

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-20">
      <div className="mx-auto max-w-xl space-y-6 text-center">
        <h1 className="font-serif text-5xl tracking-tight text-primary md:text-6xl">
          {t('Page not found')}
        </h1>
        <p className="text-base font-medium leading-relaxed text-on-surface-variant/80">
          {t('The page you are looking for does not exist or may have moved.')}
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/">{t('Back to home')}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full px-8">
            <Link to="/guide">{t('Open guide')}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
