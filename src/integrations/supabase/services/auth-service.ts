import type { Profile, UserRole } from '@/types/domain'
import type { AuthFormValues } from '@/types/forms'
import { requireSupabase, camelCaseRow } from './shared'

export const authService = {
  async getSessionProfile(): Promise<Profile | null> {
    const sb = requireSupabase()

    const { data: { session } } = await sb.auth.getSession()
    if (!session) return null

    const { data: row, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error || !row) return null
    return camelCaseRow(row) as unknown as Profile
  },

  async signIn(input: AuthFormValues): Promise<Profile> {
    const sb = requireSupabase()

    const { error: authError } = await sb.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    })

    if (authError) {
      throw new Error(authError.message)
    }

    const { data: row, error: profileError } = await sb
      .from('profiles')
      .select('*')
      .eq('email', input.email.toLowerCase())
      .single()

    if (profileError || !row) {
      throw new Error('Profile not found. Try creating an account first.')
    }

    const profile = camelCaseRow(row) as unknown as Profile
    if (profile.role !== input.role) {
      await sb.auth.signOut()
      throw new Error(`This account is a ${profile.role}, not a ${input.role}.`)
    }

    return profile
  },

  async signUp(input: AuthFormValues): Promise<Profile> {
    const sb = requireSupabase()

    const name = input.fullName?.trim()
    if (!name) {
      throw new Error('Enter your full name to create an account.')
    }

    const { error: authError } = await sb.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new Error('That email already exists. Try signing in instead.')
      }
      throw new Error(authError.message)
    }

    // Auth trigger creates profile & balance automatically.
    // Fetch the profile that was just created.
    const { data: row, error: profileError } = await sb
      .from('profiles')
      .select('*')
      .eq('email', input.email)
      .single()

    if (profileError || !row) {
      throw new Error('Account created but profile could not be loaded. Please sign in.')
    }

    return camelCaseRow(row) as unknown as Profile
  },

  async continueAsDemo(_role: UserRole): Promise<Profile> {
    throw new Error(
      'Demo mode is not available with the live database. Please sign in or create an account.',
    )
  },

  async signOut(): Promise<void> {
    const sb = requireSupabase()
    await sb.auth.signOut()
  },
}
