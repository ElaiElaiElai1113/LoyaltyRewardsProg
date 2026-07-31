import type { Program } from '@/types/domain'

type ProgramBrand = Pick<Program, 'name' | 'primaryColor' | 'logoUrl'>

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[character] ?? character)
}

export function getProgramIconHref(program: ProgramBrand) {
  if (program.logoUrl) return program.logoUrl

  const initial = Array.from(program.name.trim())[0]?.toUpperCase() ?? 'R'
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
    `<rect width="64" height="64" rx="14" fill="${escapeXml(program.primaryColor)}"/>`,
    `<text x="32" y="43" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="700" fill="white">${escapeXml(initial)}</text>`,
    '</svg>',
  ].join('')

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
