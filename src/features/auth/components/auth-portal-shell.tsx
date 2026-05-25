import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type AuthPortalShellProps = {
  activeTab: 'signin' | 'signup'
  children: ReactNode
}

function tabClass(isActive: boolean) {
  return [
    'flex h-10 flex-1 items-center justify-center rounded-[9px] text-[13px] font-semibold transition',
    isActive
      ? 'bg-[#d1ad4a] text-[#060606]'
      : 'text-[#8b8b8b] hover:bg-[#0e0e0e] hover:text-[#d1ad4a]',
  ].join(' ')
}

export function AuthPortalShell({ activeTab, children }: AuthPortalShellProps) {
  return (
    <main className="auth-portal-shell flex min-h-screen items-start justify-center bg-[#000000] px-4 py-8 text-[#f7f7f7] sm:px-6">
      <div className="flex w-full max-w-[420px] flex-col items-center">
        <nav className="grid h-[42px] w-full grid-cols-2 rounded-[10px] border border-[#d1ad4a] bg-[#000000] p-0">
          <Link to="/signin" className={tabClass(activeTab === 'signin')}>
            Sign in
          </Link>
          <Link to="/join" className={tabClass(activeTab === 'signup')}>
            Create account
          </Link>
        </nav>

        <section className="mt-8 w-full rounded-[12px] border border-[#d1ad4a] bg-[#000000] px-8 pb-9 pt-9 shadow-[0_18px_60px_rgba(0,0,0,0.45)] sm:px-8">
          {children}
        </section>
      </div>
    </main>
  )
}
