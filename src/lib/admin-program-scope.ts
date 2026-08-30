import type { Program } from '@/types/domain'

const brandedAdminProgramSlugs = new Set(['pinas', 'wondertown', 'loyality'])

export function getBrandedAdminProgramId(program: Pick<Program, 'id' | 'slug'>) {
  return brandedAdminProgramSlugs.has(program.slug) ? program.id : undefined
}
