export type UserRole = 'customer' | 'admin'

export interface Profile {
  id: string
  fullName: string
  email: string
  phone: string
  location: string
  favoriteOrder: string
  tier: 'Bronze' | 'Silver' | 'Gold'
  joinedAt: string
  role: UserRole
}

export interface RewardBalance {
  profileId: string
  points: number
  nextRewardPoints: number
  availableCredits: number
  tierProgress: number
}

export interface Reward {
  id: string
  title: string
  description: string
  category: 'Drink' | 'Pastry' | 'Merch' | 'Experience'
  pointsCost: number
  inventory: number
  featured: boolean
  highlight: string
}

export interface Promotion {
  id: string
  title: string
  description: string
  badge: string
  cta: string
  expiresAt: string
  audience: string
}

export interface Activity {
  id: string
  profileId: string
  type: 'earned' | 'redeemed' | 'bonus' | 'adjustment'
  title: string
  description: string
  points: number
  createdAt: string
  status: 'posted' | 'pending'
}

export interface Redemption {
  id: string
  profileId: string
  rewardId: string
  rewardTitle: string
  pointsCost: number
  notes?: string
  redeemedAt: string
  status: 'ready' | 'fulfilled'
}

export interface AdminLog {
  id: string
  actorName: string
  action: string
  details: string
  createdAt: string
}

export interface SessionUser {
  profileId: string
  role: UserRole
}

export interface MockStore {
  profiles: Profile[]
  balances: RewardBalance[]
  rewards: Reward[]
  promotions: Promotion[]
  activities: Activity[]
  redemptions: Redemption[]
  adminLogs: AdminLog[]
  session: SessionUser | null
}
