import { Button } from '@/components/ui/button'
import type { Business } from '@/types/domain'

interface BusinessFilterProps {
  businesses: Business[]
  selected: string | null // null = "All"
  onChange: (businessId: string | null) => void
}

export function BusinessFilter({ businesses, selected, onChange }: BusinessFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="mr-2 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant/80">Business:</span>
      <Button
        variant={selected === null ? 'tertiary' : 'ghost'}
        size="sm"
        className={`rounded-full transition-all ${selected === null ? 'px-8 shadow-sm' : 'text-on-surface-variant/85 hover:text-primary'}`}
        onClick={() => onChange(null)}
      >
        All
      </Button>
      {businesses.map((business) => (
        <Button
          key={business.id}
          variant={selected === business.id ? 'tertiary' : 'ghost'}
          size="sm"
          className={`rounded-full transition-all ${selected === business.id ? 'px-8 shadow-sm' : 'text-on-surface-variant/85 hover:text-primary'}`}
          onClick={() => onChange(business.id)}
        >
          {business.name}
        </Button>
      ))}
    </div>
  )
}
