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
  const options = ['en', 'es'] as Language[]

  return (
    <div className={cn('language-picker flex min-w-0 items-center', className)} data-language-picker>
      <div
        className={cn(
          'language-picker__control relative inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl border border-primary-container/25 bg-primary-container/8 px-3 text-current shadow-none transition-colors focus-within:ring-2 focus-within:ring-primary-container/40',
          compact ? 'w-[5.5rem]' : 'w-[9.5rem] max-w-full',
          condenseOnNarrowScreens && compact && 'max-[379px]:w-[5.25rem] max-[379px]:gap-1.5 max-[379px]:px-2',
        )}
        data-language-picker-trigger
        title={`${t('Language')}: ${languageDisplayNames[language][language]}`}
      >
        <Globe2 className="size-4 shrink-0 text-current" aria-hidden="true" data-language-picker-icon />
        {compact ? (
          <span className="grid min-w-0 flex-1 gap-0.5 leading-none" aria-hidden="true">
            <span className="text-[0.48rem] font-extrabold uppercase tracking-[0.08em] opacity-65">LANG</span>
            <strong className="text-[0.72rem] font-extrabold uppercase tracking-[0.1em]">{language.toUpperCase()}</strong>
          </span>
        ) : (
          <span className="min-w-0 flex-1 truncate text-sm font-bold" aria-hidden="true">
            {languageDisplayNames[language][language]}
          </span>
        )}
        <ChevronDown className="pointer-events-none size-3.5 shrink-0 text-current opacity-70" aria-hidden="true" />
        <select
          aria-label={t('Language')}
          value={language}
          onChange={(event) => setLanguage(event.target.value as Language)}
          style={{ fontSize: '16px' }}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none opacity-0"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {languageDisplayNames[language][option]}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
