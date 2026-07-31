import type { Program } from '@/types/domain'

interface TenantCurrencyOptions {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export function formatTenantCurrency(
  value: number,
  program: Pick<Program, 'currency' | 'locale'>,
  options: TenantCurrencyOptions = {},
) {
  const hasCents = Math.abs(value % 1) > 0.001

  return new Intl.NumberFormat(program.locale, {
    style: 'currency',
    currency: program.currency,
    minimumFractionDigits: options.minimumFractionDigits ?? (hasCents ? 2 : 0),
    maximumFractionDigits: options.maximumFractionDigits ?? (hasCents ? 2 : 0),
  }).format(value)
}

export function getDefaultGiftCardValueLabel(program: Pick<Program, 'currency' | 'locale'>) {
  return formatTenantCurrency(250, program)
}
