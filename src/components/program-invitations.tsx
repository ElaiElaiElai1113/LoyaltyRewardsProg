import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { programService } from '@/features/program/program-service'
import { useProgramInvitations } from '@/hooks/use-program-access'
import { queryClient } from '@/lib/query-client'

export function ProgramInvitations() {
  const invitations = useProgramInvitations()
  if (!invitations.data?.length) return null
  return (
    <div className="mb-5 space-y-2">
      {invitations.data.map((invitation) => (
        <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-card px-4 py-3 text-sm">
          <p><span className="font-semibold">{invitation.name}</span> invited you as {invitation.role}.</p>
          <Button size="sm" onClick={() => void programService.acceptInvitation(invitation.id).then(async () => {
            await queryClient.invalidateQueries({ queryKey: ['program-invitations'] })
            await queryClient.invalidateQueries({ queryKey: ['accessible-programs'] })
            toast.success('Program invitation accepted.')
          }).catch((error) => toast.error(error.message))}>Accept</Button>
        </div>
      ))}
    </div>
  )
}
