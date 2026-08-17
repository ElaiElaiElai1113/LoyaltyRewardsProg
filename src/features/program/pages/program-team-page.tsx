import { AlertCircle, Users } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { LoadingState } from '@/components/ui/loading-state'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { programService, type ProgramTeamMember } from '@/features/program/program-service'
import { COMPACT_LIST_PAGE_SIZE, usePagination } from '@/hooks/use-pagination'
import { useLanguage } from '@/lib/language'

type Translator = (text: string | null | undefined, values?: Record<string, string | number>) => string

function programRoleLabel(role: ProgramTeamMember['role'], t: Translator) {
  if (role === 'program-admin') return t('Program administrator')
  if (role === 'business-owner') return t('Business owner')
  if (role === 'business-staff') return t('Business staff')
  return t('Member')
}

function programTeamStatusLabel(status: string, t: Translator) {
  if (status === 'invited') return t('Invited')
  if (status === 'active') return t('Active')
  if (status === 'suspended') return t('Suspended')
  return status.replaceAll('_', ' ')
}

export function ProgramTeamPage() {
  const { t } = useLanguage()
  const [team, setTeam] = useState<ProgramTeamMember[]>([])
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const pagination = usePagination(team, COMPACT_LIST_PAGE_SIZE)
  const load = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      setTeam(await programService.listTeam())
    } catch {
      setLoadError('Team could not be loaded.')
      toast.error(t('Team could not be loaded.'))
    } finally {
      setIsLoading(false)
    }
  }, [t])
  useEffect(() => {
    void load()
  }, [load])
  async function invite(event: FormEvent) {
    event.preventDefault()
    try {
      await programService.inviteAdministrator(email)
      setEmail('')
      toast.success(t('Administrator invitation created.'))
      await load()
    } catch { toast.error(t('Invitation could not be created.')) }
  }
  return (
    <div className="space-y-6">
      <Card className="rounded-lg">
        <CardHeader><CardTitle>{t('Invite administrator')}</CardTitle><CardDescription>{t('The person must already have a platform account. Plan limits are enforced by the database.')}</CardDescription></CardHeader>
        <CardContent><form className="flex flex-col gap-3 sm:flex-row" onSubmit={invite}><Input id="program-team-invite-email" aria-label={t('Administrator email')} required type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /><Button>{t('Invite')}</Button></form></CardContent>
      </Card>
      <Card className="rounded-lg">
        <CardHeader><CardTitle>{t('Program team')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? <LoadingState title={t('Loading program team')} /> : null}
          {!isLoading && loadError ? (
            <EmptyState
              icon={<AlertCircle className="size-8" />}
              title={t('Program team could not be loaded')}
              description={t('Team could not be loaded.')}
              action={<Button type="button" variant="outline" onClick={() => void load()}>{t('Try again')}</Button>}
              className="py-10"
            />
          ) : null}
          {!isLoading && !loadError ? pagination.pageItems.map((member) => <div key={member.membershipId} className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] py-3 last:border-0"><div><p className="font-semibold">{member.fullName}</p><p className="text-sm text-[var(--muted-foreground)]">{member.email}</p></div><div className="flex gap-2"><Badge variant="secondary">{programRoleLabel(member.role, t)}</Badge><Badge variant={member.status === 'active' ? 'tenant' : 'secondary'}>{programTeamStatusLabel(member.status, t)}</Badge></div></div>) : null}
          {!isLoading && !loadError && team.length === 0 ? (
            <EmptyState
              icon={<Users className="size-8" />}
              title={t('No program administrators yet')}
              description={t('Invite the first administrator to manage this program.')}
              action={<Button type="button" variant="outline" onClick={() => document.getElementById('program-team-invite-email')?.focus()}>{t('Invite first administrator')}</Button>}
              className="py-10"
            />
          ) : null}
          <PaginationControls ariaLabel={t('Program team pagination')} {...pagination} onPageChange={pagination.setPage} />
        </CardContent>
      </Card>
    </div>
  )
}
