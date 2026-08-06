import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { AuthPortalShell } from '@/features/auth/components/auth-portal-shell'
import { authService } from '@/integrations/supabase/services/auth-service'
import { getHomePathForRole } from '@/lib/role-routes'

type ConfirmationState = 'checking' | 'confirmed' | 'error'

export function EmailConfirmationPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<ConfirmationState>('checking')
  const [message, setMessage] = useState('Confirming your email securely...')

  useEffect(() => {
    let isMounted = true

    void authService
      .ensureEmailConfirmationSession()
      .then((profile) => {
        if (!isMounted) return

        if (!profile) {
          setState('confirmed')
          setMessage('Your email is confirmed. Sign in to continue.')
          return
        }

        setState('confirmed')
        setMessage('Your email is confirmed. Opening your account...')
        navigate(getHomePathForRole(profile.role), { replace: true })
      })
      .catch((error) => {
        if (!isMounted) return
        setState('error')
        setMessage(
          error instanceof Error
            ? error.message
            : 'This confirmation link is invalid or has expired.',
        )
      })

    return () => {
      isMounted = false
    }
  }, [navigate])

  return (
    <AuthPortalShell activeTab="signin">
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#d1ad4a]">
            Email confirmation
          </p>
          <h1 className="font-serif text-3xl text-[var(--foreground)]">
            {state === 'error' ? 'Confirmation link problem' : 'Account confirmation'}
          </h1>
          <p
            className={
              state === 'error'
                ? 'text-sm font-bold leading-6 text-red-500'
                : 'text-sm font-medium leading-6 text-[var(--muted-foreground)]'
            }
          >
            {message}
          </p>
        </div>

        {state !== 'checking' ? (
          <Button asChild className="w-full">
            <Link to="/signin">Continue to sign in</Link>
          </Button>
        ) : null}
      </div>
    </AuthPortalShell>
  )
}
