import { z } from 'zod'

export const authSchema = z.object({
  fullName: z.string().min(2, 'Enter your name').optional(),
  email: z.email('Enter a valid email'),
  password: z.string().min(6, 'Use at least 6 characters'),
  role: z.enum(['customer', 'business-owner', 'platform-admin']),
})

export type AuthFormValues = z.infer<typeof authSchema>

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  phone: z.string().min(8, 'Enter a phone number'),
  location: z.string().min(2, 'Enter a location'),
  favoriteOrder: z.string().min(2, 'Enter a favorite order'),
})

export type ProfileFormValues = z.infer<typeof profileSchema>

export const redeemSchema = z.object({
  notes: z.string().max(120, 'Keep notes under 120 characters').optional(),
  pickupWindow: z.enum(['Now', 'Within 30 mins', 'Later today']),
})

export type RedeemFormValues = z.infer<typeof redeemSchema>

export const rewardAdjustmentSchema = z.object({
  profileId: z.string().min(1, 'Select a member'),
  delta: z.number().int().min(-500, 'Minimum -500').max(500, 'Maximum 500'),
  reason: z.string().min(4, 'Add a clear reason'),
})

export type RewardAdjustmentFormValues = z.infer<typeof rewardAdjustmentSchema>

export const rewardDraftSchema = z.object({
  businessId: z.string().min(1, 'Select a business'),
  title: z.string().min(2, 'Enter a reward title'),
  description: z.string().min(8, 'Add a short description'),
  category: z.enum(['Drink', 'Pastry', 'Merch', 'Experience']),
  pointsCost: z.number().int().min(10, 'Set a realistic points cost'),
  highlight: z.string().min(2, 'Add a highlight'),
})

export type RewardDraftFormValues = z.infer<typeof rewardDraftSchema>

export const promotionDraftSchema = z.object({
  title: z.string().min(2, 'Enter a promotion title'),
  description: z.string().min(8, 'Add a short description'),
  badge: z.string().min(2, 'Add a badge'),
  cta: z.string().min(2, 'Add a CTA'),
  audience: z.string().min(2, 'Add an audience'),
})

export type PromotionDraftFormValues = z.infer<typeof promotionDraftSchema>

export const productDraftSchema = z.object({
  businessId: z.string().min(1, 'Select a business'),
  title: z.string().min(2, 'Enter a product title'),
  description: z.string().min(8, 'Add a short description'),
  category: z.enum(['Coffee', 'Pastry', 'Merch', 'Equipment']),
  price: z.number().min(0.5, 'Minimum price is $0.50'),
  highlight: z.string().min(2, 'Add a highlight'),
  inventory: z.number().int().min(0, 'Inventory cannot be negative'),
})

export type ProductDraftFormValues = z.infer<typeof productDraftSchema>

export const checkoutSchema = z.object({
  paymentMethod: z.enum(['visa', 'mastercard', 'applepay']),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>

export const businessSettingsSchema = z.object({
  earnRate: z.number().min(0, 'Earn rate cannot be negative').max(100, 'Maximum 100 pts/$1'),
  taxRate: z.number().min(0).max(0.5, 'Maximum 50% tax rate'),
})

export type BusinessSettingsFormValues = z.infer<typeof businessSettingsSchema>
