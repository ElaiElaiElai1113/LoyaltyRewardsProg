import { cn } from '@/lib/utils'

type BrandLogoProps = {
  className?: string
  markClassName?: string
  textClassName?: string
  showText?: boolean
}

export function BrandLogo({ className, markClassName }: BrandLogoProps) {
  return (
    <span className={cn('inline-flex min-w-0 items-center', className)}>
      <img
        src="/medellin-rewards-logo.svg"
        alt="Medellin Rewards"
        className={cn('h-14 w-auto shrink-0 object-contain', markClassName)}
      />
      <span className="sr-only">Medellin Rewards</span>
    </span>
  )
}
