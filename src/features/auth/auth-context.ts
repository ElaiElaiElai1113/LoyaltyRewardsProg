import { createContext } from 'react'

import type { Profile } from '@/types/domain'
import type { AuthFormValues } from '@/types/forms'

export interface AuthContextValue {
  profile: Profile | null
  isLoading: boolean
  signIn: (values: AuthFormValues) => Promise<Profile>
  signUp: (values: AuthFormValues) => Promise<Profile>
  continueAsDemo: (role: 'customer' | 'admin') => Promise<Profile>
  signOut: () => Promise<void>
  syncProfile: (profile: Profile) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
