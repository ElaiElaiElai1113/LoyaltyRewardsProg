type LoyalityMarkProps = {
  className?: string
  size?: number
}

export function LoyalityMark({ className, size = 22 }: LoyalityMarkProps) {
  return (
    <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="15" y="15" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}
