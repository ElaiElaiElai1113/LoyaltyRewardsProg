import { Building2, ChevronDown } from 'lucide-react'

import { useAccessiblePrograms } from '@/hooks/use-program-access'
import { useTenant } from '@/hooks/use-tenant'

export function ProgramSwitcher({ className = '' }: { className?: string }) {
  const { program } = useTenant()
  const programs = useAccessiblePrograms()
  if (!programs.data || programs.data.length < 2) return null
  const prioritizedPrograms = [...programs.data].sort((left, right) =>
    left.slug === 'pinas' ? -1 : right.slug === 'pinas' ? 1 : left.name.localeCompare(right.name),
  )

  function changeProgram(slug: string) {
    const next = programs.data?.find((item) => item.slug === slug)
    if (!next || next.id === program.id) return
    if (next.hostname && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      window.location.assign(`${window.location.protocol}//${next.hostname}/`)
      return
    }
    window.location.assign(`/?tenant=${next.slug}`)
  }

  return (
    <label className={`relative flex items-center gap-2 ${className}`}>
      <Building2 className="size-4 shrink-0 text-[var(--muted-foreground)]" />
      <span className="sr-only">Rewards program</span>
      <select
        value={program.slug}
        onChange={(event) => changeProgram(event.target.value)}
        className="h-9 min-w-0 appearance-none rounded-md border border-[var(--border)] bg-card py-1 pl-2 pr-8 text-sm font-semibold text-[var(--foreground)]"
      >
        {prioritizedPrograms.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 size-3.5 text-[var(--muted-foreground)]" />
    </label>
  )
}
