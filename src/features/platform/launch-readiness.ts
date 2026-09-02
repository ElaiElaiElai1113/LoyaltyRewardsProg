export type LaunchReadinessStatus = 'verified' | 'ready' | 'approval-required' | 'external-required'

export type LaunchReadinessWorkstream = {
  id: string
  title: string
  description: string
  status: LaunchReadinessStatus
  owner: string
  nextAction: string
  href?: string
  actionLabel?: string
}

export const launchReadinessStatusLabels: Record<LaunchReadinessStatus, string> = {
  verified: 'Verified',
  ready: 'Ready to execute',
  'approval-required': 'Approval required',
  'external-required': 'External input required',
}

export const rewardMeLaunchWorkstreams: LaunchReadinessWorkstream[] = [
  {
    id: 'brand', title: 'RewardMe brand and public journey', status: 'verified', owner: 'Product and engineering',
    description: 'Canonical naming, pitch-aligned public copy, responsive imagery, navigation, and legal routes are implemented.',
    nextAction: 'Keep regression coverage green for every release.', href: '/', actionLabel: 'Open RewardMe',
  },
  {
    id: 'recovery', title: 'Empty and error recovery', status: 'verified', owner: 'Engineering',
    description: 'Core empty, filtered, missing-page, and unexpected-error states provide a useful recovery action.',
    nextAction: 'Review any newly added page against the same no-dead-end contract.', href: '/admin/guide', actionLabel: 'Open guide',
  },
  {
    id: 'partner-import', title: 'Partner and offer intake', status: 'ready', owner: 'Partner operations',
    description: 'CSV validation, inactive examples, review-only packaging, checksums, and activation blockers are available.',
    nextAction: 'Replace samples with signed, owner-approved partner data and create the review package.', href: '/admin/import', actionLabel: 'Open import tools',
  },
  {
    id: 'authenticated-qa', title: 'Authenticated release verification', status: 'external-required', owner: 'Release owner',
    description: 'Temporary-user isolation and RewardMe member browser checks run only with private release credentials and clean up created users.',
    nextAction: 'Provide isolated release credentials and run the hosted-safe browser verification command.', href: '/admin/guide', actionLabel: 'Review verification guide',
  },
  {
    id: 'commercial', title: 'Commercial rules', status: 'approval-required', owner: 'RewardMe owner, legal, tax, and accounting',
    description: 'Trial, plan, cancellation, eligible-spend, referral, commission, settlement, and support defaults are decision-ready.',
    nextAction: 'Approve or amend every recommendation in the commercial owner sign-off.', href: '/admin/portal#agreements', actionLabel: 'Open agreements',
  },
  {
    id: 'membership-enrollment', title: 'Membership enrollment', status: 'approval-required', owner: 'RewardMe owner and operations',
    description: 'The secure member request flow, staff review queue, activation, renewal, cancellation, recovery, and immutable audit history are implemented. Online payments remain out of scope.',
    nextAction: 'Approve final plan, identity-check, fee, renewal, cancellation, refund, and notification rules before public paid launch.', href: '/admin/memberships', actionLabel: 'Open membership queue',
  },
  {
    id: 'rewards', title: 'Rewards and referral funding', status: 'approval-required', owner: 'RewardMe owner and accounting',
    description: 'Marketing examples are not treated as universal live rates; each calculation and funding rule still needs signed authority.',
    nextAction: 'Approve eligible-spend, rounding, rate, reversal, cap, and referral qualification rules.', href: '/admin/portal#commissions', actionLabel: 'Open commissions',
  },
  {
    id: 'savings-gifts', title: 'Savings match and gift cards', status: 'approval-required', owner: 'RewardMe owner, legal, tax, and accounting',
    description: 'Both experiences are safely unavailable and non-transactable until custody, tax, accounting, funding, and fulfillment are approved.',
    nextAction: 'Complete the dedicated activation gates before enabling any transaction.', href: '/admin/gift-cards', actionLabel: 'Review gift cards',
  },
  {
    id: 'partners', title: 'Live partner catalog', status: 'external-required', owner: 'Partner operations',
    description: 'No sample record is eligible for activation; real signed partner, offer, inventory, settlement, and staff details are still required.',
    nextAction: 'Collect real intake files, signed agreements, approval evidence, and training-test results.', href: '/admin/portal#partners', actionLabel: 'Open partners',
  },
  {
    id: 'support-domain', title: 'Support, email, and domain operations', status: 'external-required', owner: 'Operations owner',
    description: 'Launch requires a monitored support mailbox, approved response targets, DNS verification, and production sender credentials.',
    nextAction: 'Assign the support owner and supply verified domain and email-provider evidence.', href: '/admin/programs', actionLabel: 'Open programs',
  },
]

export function summarizeLaunchReadiness(workstreams = rewardMeLaunchWorkstreams) {
  return workstreams.reduce<Record<LaunchReadinessStatus, number>>(
    (summary, workstream) => ({ ...summary, [workstream.status]: summary[workstream.status] + 1 }),
    { verified: 0, ready: 0, 'approval-required': 0, 'external-required': 0 },
  )
}
