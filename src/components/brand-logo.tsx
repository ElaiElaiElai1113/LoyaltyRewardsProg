import { cn } from '@/lib/utils'

type BrandLogoProps = {
  className?: string
  markClassName?: string
  textClassName?: string
  showText?: boolean
}

export function BrandLogo({ className, markClassName, textClassName, showText = true }: BrandLogoProps) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2.5', className)}>
      <img
        src="/medellin-rewards-mark.svg"
        alt=""
        className={cn('h-10 w-auto shrink-0 object-contain', markClassName)}
        aria-hidden="true"
      />
      {showText ? (
        <span className={cn('truncate font-serif font-bold leading-none tracking-[-0.01em]', textClassName)}>
          Medellin <span className="text-[#c9a84c]">Rewards</span>
        </span>
      ) : null}
      <span className="sr-only">Medellin Rewards</span>
    </span>
  )
}
