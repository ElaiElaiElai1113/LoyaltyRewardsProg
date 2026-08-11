import { cn } from '@/lib/utils'
import { useTenant } from '@/hooks/use-tenant'

type BrandLogoProps = {
  className?: string
  markClassName?: string
  textClassName?: string
  showText?: boolean
}

export function BrandLogo({ className, markClassName, textClassName, showText = true }: BrandLogoProps) {
  const { program } = useTenant()
  const displayLogoUrl = program.logoUrl ?? (program.slug === 'pinas' ? '/rewardme-mark.svg' : null)
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
      {displayLogoUrl ? (
        <img
          src={displayLogoUrl}
          alt={program.name}
          className={cn('h-14 w-auto shrink-0 object-contain', markClassName)}
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn('flex size-10 shrink-0 items-center justify-center rounded-md bg-tenant text-lg font-bold', markClassName)}
        >
          {program.name.charAt(0)}
        </span>
      )}
      {showText && !program.logoUrl ? (
        <span className={cn('truncate font-semibold text-[var(--foreground)]', textClassName)}>{program.name}</span>
      ) : null}
      <span className="sr-only">{program.name}</span>
    </span>
  )
}
