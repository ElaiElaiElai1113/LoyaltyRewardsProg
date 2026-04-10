import { type ReactNode, useEffect, useState } from 'react'

import { AuthContext } from '@/features/auth/auth-context'
import { authService } from '@/integrations/supabase/services/auth-service'
import type { Profile } from '@/types/domain'
import type { AuthFormValues } from '@/types/forms'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    authService
      .getSessionProfile()
      .then((sessionProfile) => setProfile(sessionProfile))
      .finally(() => setIsLoading(false))
  }, [])

  const value = {
    profile,
    isLoading,
    async signIn(values: AuthFormValues) {
      const sessionProfile = await authService.signIn(values)
      setProfile(sessionProfile)
      return sessionProfile
    },
    async signUp(values: AuthFormValues) {
      const sessionProfile = await authService.signUp(values)
      setProfile(sessionProfile)
      return sessionProfile
    },
    async continueAsDemo(role: 'customer' | 'admin') {
      const sessionProfile = await authService.continueAsDemo(role)
      setProfile(sessionProfile)
      return sessionProfile
    },
    async signOut() {
      await authService.signOut()
      setProfile(null)
    },
    syncProfile(nextProfile: Profile) {
      setProfile(nextProfile)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
