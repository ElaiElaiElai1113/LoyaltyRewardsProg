import { readStore } from '@/lib/mock-store'

import { delay } from './shared'

export const activityService = {
  async getActivities(profileId: string) {
    await delay()
    return readStore()
      .activities
      .filter((activity) => activity.profileId === profileId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
}
