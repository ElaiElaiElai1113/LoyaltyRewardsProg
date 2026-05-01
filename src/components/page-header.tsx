import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  actionTo,
}: PageHeaderProps) {
  return (
    <div className="mb-12 flex flex-col gap-7 pb-10 md:flex-row md:items-end md:justify-between">
      <div className="space-y-4">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-gold)]">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-3">
          <h1 className="font-display max-w-3xl text-[clamp(2.75rem,7vw,5.75rem)] font-semibold leading-[0.96] tracking-[-0.03em] text-foreground">
            {title}
          </h1>
          <div className="h-px w-24 bg-[var(--accent-gold)]" aria-hidden="true" />
          <p className="max-w-xl text-lg font-medium leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      {actionLabel && actionTo ? (
        <Button asChild variant="default" size="lg" className="rounded-full">
          <Link to={actionTo} className="flex items-center gap-3">
            {actionLabel}
            <ArrowRight className="size-5" />
          </Link>
        </Button>
      ) : null}
    </div>
  )
}
