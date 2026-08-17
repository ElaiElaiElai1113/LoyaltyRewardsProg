import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { programService } from '@/features/program/program-service'
import { useProgramInvitations } from '@/hooks/use-program-access'
import { usePagination } from '@/hooks/use-pagination'
import { queryClient } from '@/lib/query-client'

export function ProgramInvitations() {
  const invitations = useProgramInvitations()
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const pagination = usePagination(invitations.data ?? [], 3)
  if (!invitations.data?.length) return null

  async function acceptInvitation(programId: string) {
    setAcceptingId(programId)
    try {
      await programService.acceptInvitation(programId)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['program-invitations'] }),
        queryClient.invalidateQueries({ queryKey: ['accessible-programs'] }),
        queryClient.invalidateQueries({ queryKey: ['program-membership'] }),
      ])
      toast.success('Program invitation accepted.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Program invitation could not be accepted.')
    } finally {
      setAcceptingId(null)
    }
  }

  return (
    <div className="mb-5 space-y-2">
      {pagination.pageItems.map((invitation) => (
        <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-card px-4 py-3 text-sm">
          <p><span className="font-semibold">{invitation.name}</span> invited you as {invitation.role}.</p>
          <Button
            size="sm"
            disabled={acceptingId !== null}
            onClick={() => void acceptInvitation(invitation.id)}
          >
            {acceptingId === invitation.id ? 'Accepting...' : 'Accept'}
          </Button>
        </div>
      ))}
      <PaginationControls ariaLabel="Program invitations pagination" {...pagination} onPageChange={pagination.setPage} />
    </div>
  )
}
