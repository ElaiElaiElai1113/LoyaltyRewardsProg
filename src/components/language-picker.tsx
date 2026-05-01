import { Globe2 } from 'lucide-react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { languageLabels, type Language, useLanguage } from '@/lib/language'
import { cn } from '@/lib/utils'

interface LanguagePickerProps {
  className?: string
  compact?: boolean
}

export function LanguagePicker({ className, compact = false }: LanguagePickerProps) {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <Globe2 className="size-4 shrink-0 text-current" aria-hidden="true" />
      <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
        <SelectTrigger
          aria-label={t('Language')}
          className={cn(
            'h-10 min-w-0 border-border bg-card/90 text-xs font-semibold uppercase tracking-[0.08em] text-current shadow-none focus-visible:ring-ring/40',
            compact ? 'w-[5.25rem] px-3' : 'w-[8.75rem] max-w-full',
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(['en', 'es'] as Language[]).map((option) => (
            <SelectItem key={option} value={option}>
              {compact ? option.toUpperCase() : t(languageLabels[option])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
