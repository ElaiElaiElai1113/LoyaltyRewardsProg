import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('tenant-scoped partner owner provisioning', () => {
  const edgeFunction = readFileSync(
    'supabase/functions/provision-partner-owner/index.ts',
    'utf8',
  )
  const adminPage = readFileSync('src/features/admin/pages/admin-page.tsx', 'utf8')

  it('uses a secure invitation and never embeds or returns a shared password', () => {
    expect(edgeFunction).toContain('inviteUserByEmail')
    expect(edgeFunction).toContain('/accept-invitation')
    expect(edgeFunction).not.toContain('fallbackDefaultPassword')
    expect(edgeFunction).not.toContain('defaultPassword')
    expect(edgeFunction).not.toContain('MedellinRewards')
    expect(adminPage).toContain('A secure invitation will be sent to this email')
    expect(adminPage).not.toContain('the default password')
  })

  it('derives program access from the exact active business and program', () => {
    expect(edgeFunction).toContain("select('id, name, program_id, active')")
    expect(edgeFunction).toContain("program.status !== 'active'")
    expect(edgeFunction).toContain('actorCanManageProgram')
    expect(edgeFunction).toContain('active_program_id: scopedBusiness.program_id')
    expect(edgeFunction).toContain('ensureOwnerMembership')
    expect(edgeFunction).toContain(".eq('program_id', scopedBusiness.program_id)")
  })

  it('does not repurpose an unrelated existing identity', () => {
    expect(edgeFunction).toContain('sameBusinessOperator')
    expect(edgeFunction).toContain('resumableInvite')
    expect(edgeFunction).toContain('That email already belongs to another account.')
  })
})
