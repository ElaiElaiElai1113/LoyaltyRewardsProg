import { AlertCircle, Users } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { LoadingState } from '@/components/ui/loading-state'
import { programService, type ProgramTeamMember } from '@/features/program/program-service'

export function ProgramTeamPage() {
  const [team, setTeam] = useState<ProgramTeamMember[]>([])
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const load = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      setTeam(await programService.listTeam())
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Team could not be loaded.'
      setLoadError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])
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
        <CardContent><form className="flex flex-col gap-3 sm:flex-row" onSubmit={invite}><Input id="program-team-invite-email" required type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /><Button>Invite</Button></form></CardContent>
      </Card>
      <Card className="rounded-lg">
        <CardHeader><CardTitle>Program team</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? <LoadingState title="Loading program team" /> : null}
          {!isLoading && loadError ? (
            <EmptyState
              icon={<AlertCircle className="size-8" />}
              title="Program team could not be loaded"
              description={loadError}
              action={<Button type="button" variant="outline" onClick={() => void load()}>Try again</Button>}
              className="py-10"
            />
          ) : null}
          {!isLoading && !loadError ? team.map((member) => <div key={member.membershipId} className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] py-3 last:border-0"><div><p className="font-semibold">{member.fullName}</p><p className="text-sm text-[var(--muted-foreground)]">{member.email}</p></div><div className="flex gap-2"><Badge variant="secondary">{member.role}</Badge><Badge variant={member.status === 'active' ? 'tenant' : 'secondary'}>{member.status}</Badge></div></div>) : null}
          {!isLoading && !loadError && team.length === 0 ? (
            <EmptyState
              icon={<Users className="size-8" />}
              title="No program administrators yet"
              description="Invite the first administrator to manage this program."
              action={<Button type="button" variant="outline" onClick={() => document.getElementById('program-team-invite-email')?.focus()}>Invite first administrator</Button>}
              className="py-10"
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
