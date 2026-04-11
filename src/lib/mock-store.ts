import type {
  Activity,
  MockStore,
  Profile,
  Promotion,
  Redemption,
  Reward,
  RewardBalance,
  SessionUser,
  UserRole,
} from '@/types/domain'

const STORAGE_KEY = 'velvet-brew-store-v1'

const profiles: Profile[] = [
  {
    id: 'profile-customer',
    fullName: 'Ava Mercer',
    email: 'ava@velvetbrew.co',
    phone: '+1 (415) 555-0188',
    location: 'Mission District',
    favoriteOrder: 'Velvet oat latte',
    tier: 'Gold',
    joinedAt: '2025-11-12T08:00:00.000Z',
    role: 'customer',
  },
  {
    id: 'profile-admin',
    fullName: 'Noah Reyes',
    email: 'staff@velvetbrew.co',
    phone: '+1 (415) 555-0140',
    location: 'Hayes Valley',
    favoriteOrder: 'Cortado',
    tier: 'Gold',
    joinedAt: '2025-10-01T08:00:00.000Z',
    role: 'admin',
  },
]

const balances: RewardBalance[] = [
  {
    profileId: 'profile-customer',
    points: 1280,
    nextRewardPoints: 1500,
    availableCredits: 4,
    tierProgress: 85,
  },
  {
    profileId: 'profile-admin',
    points: 960,
    nextRewardPoints: 1200,
    availableCredits: 3,
    tierProgress: 72,
  },
]

const rewards: Reward[] = [
  {
    id: 'reward-1',
    title: 'Signature Velvet Latte',
    description: 'Redeem any handcrafted latte with your choice of milk and syrup.',
    category: 'Drink',
    pointsCost: 250,
    inventory: 99,
    featured: true,
    highlight: 'Most redeemed this week',
  },
  {
    id: 'reward-2',
    title: 'Cold Brew Flight',
    description: 'Sample three seasonal cold brew profiles in one curated tasting.',
    category: 'Experience',
    pointsCost: 480,
    inventory: 24,
    featured: true,
    highlight: 'Weekend-only tasting',
  },
  {
    id: 'reward-3',
    title: 'Butter Croissant Pairing',
    description: 'Fresh-baked croissant paired with any small brewed coffee.',
    category: 'Pastry',
    pointsCost: 180,
    inventory: 44,
    featured: false,
    highlight: 'Morning favorite',
  },
  {
    id: 'reward-4',
    title: 'Velvet Brew Tote',
    description: 'Canvas tote in oat with embossed monogram and internal bottle sleeve.',
    category: 'Merch',
    pointsCost: 700,
    inventory: 12,
    featured: false,
    highlight: 'Limited spring merch',
  },
]

const promotions: Promotion[] = [
  {
    id: 'promo-1',
    title: 'Double points after 3 PM',
    description: 'Stop by after 3 PM and earn twice the points on any handcrafted drink.',
    badge: 'Weekday perk',
    cta: 'Drop by after work',
    expiresAt: '2026-04-24T23:59:59.000Z',
    audience: 'All members',
  },
  {
    id: 'promo-2',
    title: 'Spring pairing menu',
    description: 'Unlock a bonus 120 points when you pair a pistachio bun with any iced espresso.',
    badge: 'Seasonal',
    cta: 'Try the pairing',
    expiresAt: '2026-04-17T23:59:59.000Z',
    audience: 'Silver and Gold',
  },
  {
    id: 'promo-3',
    title: 'Bring-a-friend Saturdays',
    description: 'Invite a friend to scan your code in-store and both of you receive a surprise bonus.',
    badge: 'Referral',
    cta: 'Share your code',
    expiresAt: '2026-05-01T23:59:59.000Z',
    audience: 'Gold members',
  },
]

const activities: Activity[] = [
  {
    id: 'activity-1',
    profileId: 'profile-customer',
    type: 'earned',
    title: 'Morning purchase',
    description: 'Velvet oat latte and cardamom bun at Valencia St.',
    points: 96,
    createdAt: '2026-04-09T08:12:00.000Z',
    status: 'posted',
  },
  {
    id: 'activity-2',
    profileId: 'profile-customer',
    type: 'bonus',
    title: 'Promo bonus',
    description: 'Double points from the afternoon handcrafted drink campaign.',
    points: 120,
    createdAt: '2026-04-08T15:43:00.000Z',
    status: 'posted',
  },
  {
    id: 'activity-3',
    profileId: 'profile-customer',
    type: 'redeemed',
    title: 'Reward redeemed',
    description: 'Free butter croissant pairing picked up in-store.',
    points: -180,
    createdAt: '2026-04-06T10:08:00.000Z',
    status: 'posted',
  },
  {
    id: 'activity-4',
    profileId: 'profile-admin',
    type: 'earned',
    title: 'Staff training visit',
    description: 'Cortado and tasting notes session.',
    points: 60,
    createdAt: '2026-04-07T13:20:00.000Z',
    status: 'posted',
  },
]

const redemptions: Redemption[] = [
  {
    id: 'redemption-1',
    profileId: 'profile-customer',
    rewardId: 'reward-3',
    rewardTitle: 'Butter Croissant Pairing',
    pointsCost: 180,
    notes: 'Warm if possible',
    redeemedAt: '2026-04-06T10:08:00.000Z',
    status: 'fulfilled',
  },
]

export function createSeedStore(): MockStore {
  return {
    profiles,
    balances,
    rewards,
    promotions,
    activities,
    redemptions,
    adminLogs: [
      {
        id: 'log-1',
        actorName: 'Noah Reyes',
        action: 'Reward adjustment',
        details: 'Added 90 points to Ava Mercer for service recovery.',
        createdAt: '2026-04-08T18:30:00.000Z',
      },
    ],
    session: null,
  }
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function cloneStore<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T
}

export function readStore(): MockStore {
  const fallback = createSeedStore()

  if (!canUseStorage()) {
    return cloneStore(fallback)
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback))
    return cloneStore(fallback)
  }

  try {
    return { ...fallback, ...JSON.parse(raw) } as MockStore
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback))
    return cloneStore(fallback)
  }
}

export function writeStore(store: MockStore) {
  if (!canUseStorage()) {
    return store
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  return store
}

export function updateStore(updater: (store: MockStore) => MockStore) {
  const next = updater(readStore())
  return writeStore(next)
}

export function getProfileByRole(role: UserRole) {
  return readStore().profiles.find((profile) => profile.role === role) ?? null
}

export function setSession(session: SessionUser | null) {
  updateStore((store) => ({ ...store, session }))
}
