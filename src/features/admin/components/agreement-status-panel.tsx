import { useMemo, useState } from 'react'
import { CheckCircle, Clock, FileSignature, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import type { AgreementStatusRecord } from '@/types/domain'

type AgreementStatusPanelProps = {
  records: AgreementStatusRecord[]
  isLoading: boolean
}

type AgreementStatusFilter = 'all' | 'unsigned' | 'signed'

function signatureDataUrl(signatureSvg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(signatureSvg)}`
}

export function AgreementStatusPanel({ records, isLoading }: AgreementStatusPanelProps) {
  const [filter, setFilter] = useState<AgreementStatusFilter>('all')

  const signedCount = records.filter((record) => record.isSigned).length
  const unsignedCount = records.length - signedCount
  const filteredRecords = useMemo(() => {
    if (filter === 'signed') return records.filter((record) => record.isSigned)
    if (filter === 'unsigned') return records.filter((record) => !record.isSigned)
    return records
  }, [filter, records])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 border-b border-outline-variant/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
            Agreement Gate
          </span>
          <h2 className="font-serif text-3xl text-primary">Signed Agreements</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'unsigned', 'signed'] as AgreementStatusFilter[]).map((value) => (
            <Button
              key={value}
              type="button"
              variant={filter === value ? 'default' : 'outline'}
              size="sm"
              className="rounded-full capitalize"
              onClick={() => setFilter(value)}
            >
              {value}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">Required</p>
          <p className="mt-2 font-serif text-4xl text-primary">{records.length}</p>
        </div>
        <div className="rounded-2xl border border-success/15 bg-success/5 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-success">Signed</p>
          <p className="mt-2 font-serif text-4xl text-success">{signedCount}</p>
        </div>
        <div className="rounded-2xl border border-warning/15 bg-warning/5 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-warning">Unsigned</p>
          <p className="mt-2 font-serif text-4xl text-warning">{unsignedCount}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-primary-container/18 bg-[var(--card)] shadow-card">
        <ScrollArea className="h-[680px]">
          <div className="min-w-[1080px]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)] text-left">
                <tr className="border-b border-outline-variant/10">
                  <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">
                    User
                  </th>
                  <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">
                    Agreement
                  </th>
                  <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">
                    Signature
                  </th>
                  <th className="px-6 py-4 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">
                    Signed
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr
                    key={`${record.profileId}:${record.agreementVersionId}`}
                    className="border-b border-outline-variant/5 bg-transparent"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-primary">{record.fullName}</p>
                      <p className="text-xs text-on-surface-variant/75">{record.email}</p>
                      <Badge variant="outline" className="mt-2 capitalize">
                        {record.role.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-primary">{record.agreementTitle}</p>
                      <p className="text-xs text-on-surface-variant/75">Version {record.agreementVersion}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={record.isSigned ? 'accent' : 'outline'}
                        className={
                          record.isSigned
                            ? 'border-success/20 bg-success/10 text-success'
                            : 'border-warning/20 bg-warning/10 text-warning'
                        }
                      >
                        {record.isSigned ? <CheckCircle className="size-3" /> : <XCircle className="size-3" />}
                        {record.isSigned ? 'Signed' : 'Unsigned'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {record.signatureSvg ? (
                        <div className="space-y-2">
                          <div className="flex h-20 w-56 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-white p-2">
                            <img
                              src={signatureDataUrl(record.signatureSvg)}
                              alt={`Signature by ${record.fullName}`}
                              className="max-h-full max-w-full"
                            />
                          </div>
                          <p className="text-xs text-on-surface-variant/75">
                            Typed: {record.typedSignature ?? 'Not recorded'}
                          </p>
                        </div>
                      ) : (
                        <span className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant/70">
                          <Clock className="size-4" />
                          Awaiting signature
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant/85">
                      {record.signedAt ? formatDate(record.signedAt) : 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="px-6 py-4">
                  <Skeleton className="h-5 w-full" />
                </div>
              ))
            ) : null}

            {!isLoading && filteredRecords.length === 0 ? (
              <EmptyState
                className="border-0 shadow-none"
                icon={<FileSignature className="size-8" />}
                title="No agreement records"
                description="Required agreement status records will appear here."
              />
            ) : null}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
