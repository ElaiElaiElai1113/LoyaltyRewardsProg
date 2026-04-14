import { type ReactNode, useEffect, useState } from 'react'

import { AuthContext } from '@/features/auth/auth-context'
import { authService } from '@/integrations/supabase/services/auth-service'
import { supabase } from '@/integrations/supabase/client'
import type { Profile, SessionUser, UserRole } from '@/types/domain'
import type { AuthFormValues } from '@/types/forms'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    function syncSession(nextProfile: Profile | null) {
      if (!isActive) return

      setProfile(nextProfile)
      setSession(
        nextProfile
          ? {
              profileId: nextProfile.id,
              role: nextProfile.role,
              businessId: nextProfile.businessId,
            }
          : null,
      )
    }

    const loadingFallback = window.setTimeout(() => {
      if (isActive) {
        setIsLoading(false)
      }
    }, 5000)

    void authService
      .getSessionProfile()
      .then((sessionProfile) => {
        syncSession(sessionProfile)
      })
      .catch((error) => {
        console.error('Failed to restore auth session:', error)
        syncSession(null)
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
        window.clearTimeout(loadingFallback)
      })

    if (!supabase) {
      return () => {
        isActive = false
        window.clearTimeout(loadingFallback)
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      try {
        if (!nextSession) {
          syncSession(null)
          return
        }

        const sessionProfile = await authService.getSessionProfile()
        syncSession(sessionProfile)
      } catch (error) {
        console.error('Failed to sync auth state:', error)
        syncSession(null)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    })

    return () => {
      isActive = false
      window.clearTimeout(loadingFallback)
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    profile,
    session,
    isLoading,
    async signIn(values: AuthFormValues) {
      const sessionProfile = await authService.signIn(values)
      setProfile(sessionProfile)
      setSession({
        profileId: sessionProfile.id,
        role: sessionProfile.role,
        businessId: sessionProfile.businessId,
      })
      return sessionProfile
    },
    async signUp(values: AuthFormValues) {
      const sessionProfile = await authService.signUp(values)
      setProfile(sessionProfile)
      setSession({
        profileId: sessionProfile.id,
        role: sessionProfile.role,
        businessId: sessionProfile.businessId,
      })
      return sessionProfile
    },
    async continueAsDemo(role: UserRole) {
      const sessionProfile = await authService.continueAsDemo(role)
      setProfile(sessionProfile)
      setSession({
        profileId: sessionProfile.id,
        role: sessionProfile.role,
        businessId: sessionProfile.businessId,
      })
      return sessionProfile
    },
    async signOut() {
      await authService.signOut()
      setProfile(null)
      setSession(null)
    },
    syncProfile(nextProfile: Profile) {
      setProfile(nextProfile)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
