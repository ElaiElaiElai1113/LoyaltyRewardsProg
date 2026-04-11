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
