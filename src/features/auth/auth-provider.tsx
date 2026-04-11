import { type ReactNode, useEffect, useState } from 'react'

import { AuthContext } from '@/features/auth/auth-context'
import { authService } from '@/integrations/supabase/services/auth-service'
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
    authService
      .getSessionProfile()
      .then((sessionProfile) => {
        setProfile(sessionProfile)
        if (sessionProfile) {
          setSession({
            profileId: sessionProfile.id,
            role: sessionProfile.role,
            businessId: sessionProfile.businessId,
          })
        }
      })
      .finally(() => setIsLoading(false))
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
