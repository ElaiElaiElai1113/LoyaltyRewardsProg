import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'
import type { Business } from '@/types/domain'

interface BusinessFilterProps {
  businesses: Business[]
  selected: string | null // null = "All"
  onChange: (businessId: string | null) => void
}

export function BusinessFilter({ businesses, selected, onChange }: BusinessFilterProps) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="mr-2 text-sm font-medium text-muted-foreground">{t('Business:')}</span>
      <Button
        variant={selected === null ? 'tertiary' : 'ghost'}
        size="sm"
        className={selected === null ? 'px-8' : 'text-muted-foreground hover:text-foreground'}
        onClick={() => onChange(null)}
      >
        {t('All Businesses')}
      </Button>
      {businesses.map((business) => (
        <Button
          key={business.id}
          variant={selected === business.id ? 'tertiary' : 'ghost'}
          size="sm"
          className={selected === business.id ? 'px-8' : 'text-muted-foreground hover:text-foreground'}
          onClick={() => onChange(business.id)}
        >
          {business.name}
          
        </Button>
      ))}
    </div>
  )
}
