const rewardMeExperienceSlugs = new Set(['pinas', 'rewardme', 'wondertown'])

/**
 * RewardMe is the production experience and Wondertown is its branded sandbox.
 * Keep shared page routing behind this one boundary so the sandbox cannot drift.
 */
export function isRewardMeExperience(programSlug: string) {
  return rewardMeExperienceSlugs.has(programSlug)
}
