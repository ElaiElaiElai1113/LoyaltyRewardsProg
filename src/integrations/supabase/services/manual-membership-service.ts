import { getActiveProgram } from '@/features/tenant/tenant-service'
import type {
  ManualMembershipEvent,
  ManualMembershipRequest,
  ManualMembershipRequestStatus,
  ManualMembershipTier,
  MembershipStatus,
} from '@/types/domain'
import { camelCaseRow, friendlySupabaseError, requireSupabase } from './shared'

function mapRequest(row: Record<string, unknown>): ManualMembershipRequest {
  const mapped = camelCaseRow(row)
  return {
    id: (mapped.id ?? mapped.requestId) as string,
    programId: mapped.programId as string,
    programName: (mapped.programName as string | undefined) ?? undefined,
    programSlug: (mapped.programSlug as string | undefined) ?? undefined,
    profileId: mapped.profileId as string,
    memberName: (mapped.memberName as string | undefined) ?? undefined,
    memberEmail: (mapped.memberEmail as string | undefined) ?? undefined,
    memberPhone: (mapped.memberPhone as string | undefined) ?? undefined,
    requestKind: mapped.requestKind as ManualMembershipRequest['requestKind'],
    requestedTier: mapped.requestedTier as ManualMembershipTier,
    status: (mapped.status ?? mapped.requestStatus) as ManualMembershipRequestStatus,
    memberNote: (mapped.memberNote as string | null) ?? '',
    reviewerNote: (mapped.reviewerNote as string | null) ?? '',
    requestedAt: mapped.requestedAt as string,
    reviewedAt: (mapped.reviewedAt as string | null) ?? null,
    membershipStatus: (mapped.membershipStatus as MembershipStatus | null) ?? null,
    membershipTier: (mapped.membershipTier as ManualMembershipTier | null) ?? null,
    membershipEnd: (mapped.membershipEnd as string | null) ?? null,
  }
}

function mapEvent(row: Record<string, unknown>): ManualMembershipEvent {
  const mapped = camelCaseRow(row)
  return {
    id: mapped.id as string,
    requestId: (mapped.requestId as string | null) ?? null,
    programId: mapped.programId as string,
    profileId: mapped.profileId as string,
    actorProfileId: (mapped.actorProfileId as string | null) ?? null,
    eventType: mapped.eventType as ManualMembershipEvent['eventType'],
    tier: mapped.tier as ManualMembershipTier,
    fromStatus: (mapped.fromStatus as string | null) ?? null,
    toStatus: mapped.toStatus as string,
    reason: (mapped.reason as string | null) ?? '',
    createdAt: mapped.createdAt as string,
  }
}

function rpcRow(data: unknown) {
  return (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
}

function membershipError(error: unknown, fallback: string) {
  return friendlySupabaseError(error as Parameters<typeof friendlySupabaseError>[0], fallback)
    .replace('complete_contact_details_required', 'Add your full name, email, and WhatsApp or phone in your profile first.')
    .replace('membership_already_active', 'Your RewardMe membership is already active.')
    .replace('pending_request_not_found', 'That request is no longer pending. Refresh the page to see its latest status.')
    .replace('active_manual_membership_required', 'No active manually managed membership was found.')
    .replace('review_note_required', 'Add a short operations note before completing this review.')
}

export const manualMembershipService = {
  async getMyRequests(): Promise<ManualMembershipRequest[]> {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('manual_membership_requests')
      .select('*')
      .eq('program_id', getActiveProgram().id)
      .order('requested_at', { ascending: false })
    if (error) throw new Error(membershipError(error, 'Membership requests could not be loaded.'))
    return ((data ?? []) as Record<string, unknown>[]).map(mapRequest)
  },

  async getMyEvents(): Promise<ManualMembershipEvent[]> {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('manual_membership_events')
      .select('*')
      .eq('program_id', getActiveProgram().id)
      .order('created_at', { ascending: false })
    if (error) throw new Error(membershipError(error, 'Membership history could not be loaded.'))
    return ((data ?? []) as Record<string, unknown>[]).map(mapEvent)
  },

  async requestMembership(tier: ManualMembershipTier, memberNote: string): Promise<ManualMembershipRequest> {
    const sb = requireSupabase()
    const { data, error } = await sb.rpc('request_manual_membership', {
      p_program_id: getActiveProgram().id,
      p_tier: tier,
      p_member_note: memberNote.trim(),
    })
    const row = rpcRow(data)
    if (error || !row) throw new Error(membershipError(error, 'Membership request could not be submitted.'))
    return mapRequest(row)
  },

  async requestCancellation(reason: string): Promise<ManualMembershipRequest> {
    const sb = requireSupabase()
    const { data, error } = await sb.rpc('request_manual_membership_cancellation', {
      p_program_id: getActiveProgram().id,
      p_reason: reason.trim(),
    })
    const row = rpcRow(data)
    if (error || !row) throw new Error(membershipError(error, 'Cancellation request could not be submitted.'))
    return mapRequest(row)
  },

  async cancelPendingRequest(requestId: string, reason: string): Promise<ManualMembershipRequest> {
    const sb = requireSupabase()
    const { data, error } = await sb.rpc('cancel_manual_membership_request', {
      p_request_id: requestId,
      p_reason: reason.trim(),
    })
    const row = rpcRow(data)
    if (error || !row) throw new Error(membershipError(error, 'Membership request could not be canceled.'))
    return mapRequest(row)
  },

  async getOperationsRequests(): Promise<ManualMembershipRequest[]> {
    const sb = requireSupabase()
    const { data, error } = await sb.rpc('get_manual_membership_requests')
    if (error) throw new Error(membershipError(error, 'Membership operations queue could not be loaded.'))
    return ((data ?? []) as Record<string, unknown>[]).map(mapRequest)
  },

  async getOperationsEvents(): Promise<ManualMembershipEvent[]> {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('manual_membership_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) throw new Error(membershipError(error, 'Membership audit history could not be loaded.'))
    return ((data ?? []) as Record<string, unknown>[]).map(mapEvent)
  },

  async reviewRequest(input: {
    requestId: string
    decision: 'approve' | 'reject'
    reviewerNote: string
    effectiveUntil?: string | null
  }): Promise<ManualMembershipRequest> {
    const sb = requireSupabase()
    const { data, error } = await sb.rpc('review_manual_membership_request', {
      p_request_id: input.requestId,
      p_decision: input.decision,
      p_reviewer_note: input.reviewerNote.trim(),
      p_effective_until: input.effectiveUntil || null,
    })
    const row = rpcRow(data)
    if (error || !row) throw new Error(membershipError(error, 'Membership request review could not be completed.'))
    return mapRequest(row)
  },

  async renewMembership(input: {
    programId: string
    profileId: string
    reviewerNote: string
    effectiveUntil?: string | null
  }) {
    const sb = requireSupabase()
    const { error } = await sb.rpc('renew_manual_membership', {
      p_program_id: input.programId,
      p_profile_id: input.profileId,
      p_reviewer_note: input.reviewerNote.trim(),
      p_effective_until: input.effectiveUntil || null,
    })
    if (error) throw new Error(membershipError(error, 'Membership renewal could not be completed.'))
  },

  async cancelMembership(input: { programId: string; profileId: string; reason: string }) {
    const sb = requireSupabase()
    const { error } = await sb.rpc('cancel_manual_membership', {
      p_program_id: input.programId,
      p_profile_id: input.profileId,
      p_reason: input.reason.trim(),
    })
    if (error) throw new Error(membershipError(error, 'Membership cancellation could not be completed.'))
  },
}
