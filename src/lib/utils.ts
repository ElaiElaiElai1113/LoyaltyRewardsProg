import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { getActiveProgram } from '@/features/tenant/tenant-service'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPoints(points: number) {
  return new Intl.NumberFormat('en-US').format(points)
}

export function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--:--'
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function formatCurrency(amount: number, currency?: string, locale?: string) {
  let fallbackCurrency = 'USD'
  let fallbackLocale = 'en-US'

  if (!currency || !locale) {
    try {
      const program = getActiveProgram()
      fallbackCurrency = program.currency
      fallbackLocale = program.locale
    } catch {
      // The helper can also run in build-time and isolated unit-test contexts.
    }
  }

  return new Intl.NumberFormat(locale ?? fallbackLocale, {
    style: 'currency',
    currency: currency ?? fallbackCurrency,
  }).format(amount)
}
