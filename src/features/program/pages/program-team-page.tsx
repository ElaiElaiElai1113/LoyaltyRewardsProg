import { type FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { programService, type ProgramTeamMember } from '@/features/program/program-service'

export function ProgramTeamPage() {
  const [team, setTeam] = useState<ProgramTeamMember[]>([])
  const [email, setEmail] = useState('')
  async function load() {
    try { setTeam(await programService.listTeam()) } catch (error) { toast.error(error instanceof Error ? error.message : 'Team could not be loaded.') }
  }
  useEffect(() => {
    void programService.listTeam()
      .then(setTeam)
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Team could not be loaded.'))
  }, [])
  async function invite(event: FormEvent) {
    event.preventDefault()
    try {
      await programService.inviteAdministrator(email)
      setEmail('')
      toast.success('Administrator invitation created.')
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Invitation could not be created.') }
  }
  return (
    <div className="space-y-6">
      <Card className="rounded-lg">
        <CardHeader><CardTitle>Invite administrator</CardTitle><CardDescription>The person must already have a platform account. Plan limits are enforced by the database.</CardDescription></CardHeader>
        <CardContent><form className="flex flex-col gap-3 sm:flex-row" onSubmit={invite}><Input required type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /><Button>Invite</Button></form></CardContent>
      </Card>
      <Card className="rounded-lg">
        <CardHeader><CardTitle>Program team</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {team.map((member) => <div key={member.membershipId} className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] py-3 last:border-0"><div><p className="font-semibold">{member.fullName}</p><p className="text-sm text-[var(--muted-foreground)]">{member.email}</p></div><div className="flex gap-2"><Badge variant="secondary">{member.role}</Badge><Badge variant={member.status === 'active' ? 'tenant' : 'secondary'}>{member.status}</Badge></div></div>)}
          {team.length === 0 ? <p className="text-sm text-[var(--muted-foreground)]">No team members found.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
