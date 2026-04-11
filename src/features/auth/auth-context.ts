import { createContext } from 'react'

import type { Profile, SessionUser, UserRole } from '@/types/domain'
import type { AuthFormValues } from '@/types/forms'

export interface AuthContextValue {
  profile: Profile | null
  session: SessionUser | null
  isLoading: boolean
  signIn: (values: AuthFormValues) => Promise<Profile>
  signUp: (values: AuthFormValues) => Promise<Profile>
  continueAsDemo: (role: UserRole) => Promise<Profile>
  signOut: () => Promise<void>
  syncProfile: (profile: Profile) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
