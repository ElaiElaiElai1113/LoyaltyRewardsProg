import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
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
    <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-outline-variant/10 pb-10">
      <div className="space-y-4">
        {eyebrow ? (
          <Badge variant="accent" className="w-fit">
            {eyebrow}
          </Badge>
        ) : null}
        <div className="space-y-3">
          <h1 className="font-serif text-5xl tracking-tight text-primary md:text-6xl max-w-3xl leading-[1.1]">
            {title}
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-on-surface-variant/85 font-medium">
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
