function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function extractGiftCardCode(note?: string | null) {
  const match = note?.match(/Gift card code:\s*([A-Z0-9-]+)/i)
  return match?.[1] ?? null
}

export function extractMoneyFromGiftCardNote(
  note: string | null | undefined,
  label: string,
): number | null {
  const match = note?.match(new RegExp(`${escapeRegExp(label)}:\\s*([\\d,]+(?:\\.\\d+)?)`, 'i'))
  if (!match) return null

  const value = Number(match[1].replace(/,/g, ''))
  return Number.isFinite(value) ? value : null
}
