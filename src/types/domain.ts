export type UserRole = 'customer' | 'platform-admin' | 'business-owner'

export interface Business {
  id: string
  name: string
  slug: string
  description: string
  earnRate: number // points earned per $1 spent
  taxRate: number // e.g. 0.0875 for 8.75%
  currency: string
  active: boolean
}

export interface BusinessWithMetrics {
  id: string
  name: string
  slug: string
  description: string | null
  earnRate: number
  currency: string
  active: boolean
  logoUrl: string | null
  totalMembers: number
  totalRevenue: number
  pointsIssued: number
  creditsOutstanding: number
}

export interface Profile {
  id: string
  fullName: string
  email: string
  phone: string
  location: string
  favoriteOrder: string
  joinedAt: string
  role: UserRole
  businessId?: string // For business owners - which business they belong to
}

export interface RewardBalance {
  profileId: string
  points: number
  nextRewardPoints: number
  availableCredits: number
  tierProgress: number
}

export type ReferralStatus = 'pending' | 'approved' | 'rejected'

export interface ReferralWithProfiles {
  id: string
  referrerId: string
  refereeId: string
  businessId: string | null
  status: ReferralStatus
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
  referrer: {
    fullName: string
    email: string
  }
  referee: {
    fullName: string
    email: string
  }
}

export interface Reward {
  id: string
  businessId: string
  title: string
  description: string
  category: 'Drink' | 'Pastry' | 'Merch' | 'Experience'
  pointsCost: number
  inventory: number
  featured: boolean
  highlight: string
}

export interface Product {
  id: string
  businessId: string
  title: string
  description: string
  category: 'Coffee' | 'Pastry' | 'Merch' | 'Equipment'
  price: number
  inventory: number
  featured: boolean
  highlight: string
}

export interface CartItem {
  productId: string
  quantity: number
}

export interface OrderLineItem {
  productId: string
  productTitle: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface Order {
  id: string
  profileId: string
  businessId: string
  items: OrderLineItem[]
  subtotal: number
  tax: number
  total: number
  pointsEarned: number
  pointsStatus: 'pending' | 'posted'
  paymentMethod: string
  status: 'confirmed' | 'processing' | 'delivered'
  createdAt: string
}

export interface OrderForVerification {
  id: string
  profileId: string
  businessId: string
  businessName: string
  total: number
  pointsEarned: number
  expectedPoints: number
  mismatch: boolean
  createdAt: string
}

export interface Promotion {
  id: string
  businessId: string
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
  businessId?: string // Business owner's business
}

export interface BusinessMetrics {
  totalMembers: number
  totalOrders: number
  totalRevenue: number
  pointsIssued: number
  pointsRedeemed: number
  activePromotions: number
}

export interface MockStore {
  businesses: Business[]
  profiles: Profile[]
  balances: RewardBalance[]
  rewards: Reward[]
  products: Product[]
  promotions: Promotion[]
  activities: Activity[]
  redemptions: Redemption[]
  orders: Order[]
  adminLogs: AdminLog[]
  session: SessionUser | null
}
