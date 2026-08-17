import { ChevronDown, Globe2 } from 'lucide-react'

import { languageDisplayNames, type Language, useLanguage } from '@/lib/language'
import { cn } from '@/lib/utils'

interface LanguagePickerProps {
  className?: string
  compact?: boolean
  condenseOnNarrowScreens?: boolean
}

export function LanguagePicker({
  className,
  compact = false,
  condenseOnNarrowScreens = false,
}: LanguagePickerProps) {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <Globe2
        className={cn('size-4 shrink-0 text-current', condenseOnNarrowScreens && 'max-[379px]:hidden')}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative min-w-0',
          compact ? 'w-[5.25rem]' : 'w-[8.75rem] max-w-full',
          condenseOnNarrowScreens && compact && 'max-[379px]:w-16',
        )}
      >
        <select
          aria-label={t('Language')}
          value={language}
          onChange={(event) => setLanguage(event.target.value as Language)}
          style={{ fontSize: '16px' }}
          className={cn(
            'h-10 w-full min-w-0 appearance-none rounded-2xl border border-primary-container/25 bg-primary-container/8 text-base font-bold uppercase tracking-[0.08em] text-current shadow-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-container/40',
            compact ? 'px-3 pr-8' : 'px-4 pr-9',
            condenseOnNarrowScreens && compact && 'max-[379px]:px-2 max-[379px]:pr-7',
          )}
        >
          {(['en', 'tl', 'es'] as Language[]).map((option) => (
            <option key={option} value={option}>
              {compact ? option.toUpperCase() : languageDisplayNames[language][option]}
            </option>
          ))}
        </select>
        <ChevronDown
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-current opacity-70',
            condenseOnNarrowScreens && 'max-[379px]:right-2',
          )}
        />
      </div>
    </div>
  )
}
