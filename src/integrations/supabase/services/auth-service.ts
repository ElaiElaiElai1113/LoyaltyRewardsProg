import type { Membership, Profile, UserRole } from '@/types/domain'
import type { AuthFormValues } from '@/types/forms'
import { requireSupabase, camelCaseRow } from './shared'

function mapMembership(row: Record<string, unknown>): Membership {
  const mapped = camelCaseRow(row)

  return {
    id: mapped.id as string,
    profileId: mapped.profileId as string,
    status: mapped.status as Membership['status'],
    currentPeriodStart: mapped.currentPeriodStart as string,
    currentPeriodEnd: mapped.currentPeriodEnd as string,
    cancelAtPeriodEnd: mapped.cancelAtPeriodEnd as boolean,
    priceCents: mapped.priceCents as number,
    currency: mapped.currency as string,
    provider: mapped.provider as string,
    providerSubscriptionId: (mapped.providerSubscriptionId as string | null) ?? null,
    lastCreditAt: (mapped.lastCreditAt as string | null) ?? null,
    createdAt: mapped.createdAt as string,
    updatedAt: mapped.updatedAt as string,
  }
}

async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const sb = requireSupabase()

  const [{ data: row, error }, { data: membershipRow }] = await Promise.all([
    sb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single(),
    sb
      .from('memberships')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle(),
  ])

  if (error || !row) return null
  return {
    ...(camelCaseRow(row) as unknown as Profile),
    membership: membershipRow ? mapMembership(membershipRow as Record<string, unknown>) : null,
  }
}

export const authService = {
  async getProfileForUserId(userId: string): Promise<Profile | null> {
    return getProfileByUserId(userId)
  },

  async getSessionProfile(): Promise<Profile | null> {
    const sb = requireSupabase()

    const { data: { session } } = await sb.auth.getSession()
    if (!session) return null

    return getProfileByUserId(session.user.id)
  },

  async signIn(input: AuthFormValues): Promise<Profile> {
    const sb = requireSupabase()
    const email = input.email.trim().toLowerCase()

    const { data, error: authError } = await sb.auth.signInWithPassword({
      email,
      password: input.password,
    })

    if (authError) {
      throw new Error(authError.message)
    }

    const userId = data.user?.id
    if (!userId) {
      throw new Error('Sign-in succeeded but the session user could not be loaded.')
    }

    const profile = await getProfileByUserId(userId)
    if (!profile) {
      await sb.auth.signOut()
      throw new Error('Profile not found. Try creating an account first.')
    }

    if (profile.role !== input.role) {
      await sb.auth.signOut()
      throw new Error(`This account is a ${profile.role}, not a ${input.role}.`)
    }

    return profile
  },

  async signUp(input: AuthFormValues): Promise<Profile> {
    const sb = requireSupabase()

    const name = input.fullName?.trim()
    const email = input.email.trim().toLowerCase()
    if (!name) {
      throw new Error('Enter your full name to create an account.')
    }

    const { data, error: authError } = await sb.auth.signUp({
      email,
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
    const userId = data.user?.id
    if (!userId) {
      throw new Error('Account created but the session user could not be loaded. Please sign in.')
    }

    const profile = await getProfileByUserId(userId)
    if (!profile) {
      throw new Error('Account created but profile could not be loaded. Please sign in.')
    }

    return profile
  },

  async continueAsDemo(role: UserRole): Promise<Profile> {
    void role
    throw new Error(
      'Demo mode is not available with the live database. Please sign in or create an account.',
    )
  },

  async resetPassword(email: string): Promise<void> {
    const sb = requireSupabase()
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })

    if (error) throw error
  },

  async signOut(): Promise<void> {
    const sb = requireSupabase()
    await sb.auth.signOut()
  },
}
