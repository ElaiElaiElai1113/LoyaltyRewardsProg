import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TenantContext } from '@/features/tenant/tenant-context'
import { applyProgramDocumentBrand } from '@/features/tenant/tenant-document-brand'
import {
  getFallbackProgram,
  inferTenantSlugHint,
  resolveProgram,
  setActiveProgram,
} from '@/features/tenant/tenant-service'
import type { Program } from '@/types/domain'

function isPlatformAdminPath() {
  return /^\/admin(?:\/|$)/.test(window.location.pathname)
}


function applyProgram(program: Program, applyDocumentBrand = true) {
  setActiveProgram(program)
  document.documentElement.dataset.program = program.slug
  if (applyDocumentBrand && !isPlatformAdminPath()) applyProgramDocumentBrand(program)
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [program, setProgram] = useState(() => {
    const initialProgram = getFallbackProgram()
    applyProgram(initialProgram, inferTenantSlugHint(window.location.hostname) !== null)
    return initialProgram
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const resolved = await resolveProgram(window.location.hostname)
      setProgram(resolved)
      applyProgram(resolved)
      setError(null)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Program could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <TenantContext.Provider value={{ program, isLoading, error, refresh }}>
      {isLoading ? (
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-sm text-[var(--muted-foreground)]">
          Loading rewards program...
        </div>
      ) : error ? <TenantUnavailable error={error} onRetry={() => void refresh()} /> : children}
    </TenantContext.Provider>
  )
}

function TenantUnavailable({ error, onRetry }: { error: string; onRetry: () => void }) {
  const content = error === 'program_suspended'
    ? { title: 'Program temporarily unavailable', body: 'This rewards program has been suspended. Contact the program administrator for assistance.' }
    : error === 'domain_pending'
      ? { title: 'Domain connection pending', body: 'This domain has not completed ownership verification yet.' }
      : { title: 'Rewards program not found', body: 'This hostname is not connected to an active rewards program.' }
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 text-[var(--foreground)]">
      <div className="max-w-lg text-center">
        <AlertTriangle className="mx-auto size-10 text-[var(--muted-foreground)]" />
        <h1 className="mt-5 text-3xl font-semibold">{content.title}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{content.body}</p>
        <Button className="mt-6" variant="outline" onClick={onRetry}><RotateCw className="size-4" />Try again</Button>
      </div>
    </main>
  )
}
