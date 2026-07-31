import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('program invitation acceptance wiring', () => {
  it('exposes invitations to every authenticated portal layout', () => {
    for (const path of [
      'src/layouts/customer-layout.tsx',
      'src/layouts/business-owner-layout.tsx',
      'src/layouts/admin-layout.tsx',
      'src/layouts/program-admin-layout.tsx',
    ]) {
      expect(readFileSync(path, 'utf8')).toContain('<ProgramInvitations />')
    }
  })

  it('refreshes membership and access queries after acceptance', () => {
    const invitations = readFileSync('src/components/program-invitations.tsx', 'utf8')
    expect(invitations).toContain("queryKey: ['program-invitations']")
    expect(invitations).toContain("queryKey: ['accessible-programs']")
    expect(invitations).toContain("queryKey: ['program-membership']")
  })
})
