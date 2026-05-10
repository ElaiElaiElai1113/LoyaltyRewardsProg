import { z } from 'zod'

export const authSchema = z.object({
  fullName: z.string().optional(),
  email: z.email('Enter a valid email'),
  password: z.string().min(5, 'Use at least 5 characters'),
  role: z.enum(['customer', 'business-owner', 'business-staff', 'platform-admin']),
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
  delta: z.number().int().min(-10000, 'Minimum -10000').max(10000, 'Maximum 10000'),
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

export const giftCardCatalogItemSchema = z.object({
  businessId: z.string().min(1, 'Select a business'),
  title: z.string().trim().min(2, 'Enter a gift card title'),
  description: z.string().trim().min(8, 'Add a short description'),
  imageUrl: z.union([z.literal(''), z.url('Enter a valid image URL')]).optional(),
  pointsCost: z.number().int().min(1, 'Set a points cost'),
  valueLabel: z.string().trim().min(1, 'Add a value label'),
  expiryDays: z.number().int().min(1, 'Expiry must be at least 1 day').max(365, 'Maximum 365 days'),
  isActive: z.boolean(),
})

export type GiftCardCatalogItemFormValues = z.infer<typeof giftCardCatalogItemSchema>

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

export const createBusinessSchema = z.object({
  name: z.string().trim().min(2, 'Enter a business name'),
  slug: z
    .string()
    .trim()
    .min(1, 'Enter a slug')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens only'),
  description: z.string().optional(),
  logoUrl: z.union([z.literal(''), z.url('Enter a valid logo URL')]).optional(),
  earnRate: z.number().min(0, 'Earn rate cannot be negative'),
  taxRate: z.number().min(0, 'Tax rate cannot be negative'),
  currency: z
    .string()
    .trim()
    .length(3, 'Use a 3-letter currency code')
    .regex(/^[A-Za-z]{3}$/, 'Use a 3-letter currency code'),
  active: z.boolean(),
  ownerEmail: z.email('Enter a valid owner email'),
})

export type CreateBusinessFormValues = z.infer<typeof createBusinessSchema>

export const assignBusinessOwnerSchema = z.object({
  email: z.email('Enter a valid email'),
})

export type AssignBusinessOwnerFormValues = z.infer<typeof assignBusinessOwnerSchema>

export const partnerReferrerDraftSchema = z.object({
  businessId: z.string().min(1, 'Select a business'),
  sourceLabel: z.string().trim().min(2, 'Enter a referral source'),
  contactEmail: z.union([z.literal(''), z.email('Enter a valid email')]).optional(),
  notes: z.string().max(240, 'Keep notes under 240 characters').optional(),
})

export type PartnerReferrerDraftFormValues = z.infer<typeof partnerReferrerDraftSchema>

export const partnerAttributionSchema = z.object({
  code: z.string().trim().min(4, 'Enter a valid partner code'),
})

export type PartnerAttributionFormValues = z.infer<typeof partnerAttributionSchema>

export const ambassadorLeadSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name'),
    email: z.email('Enter a valid email'),
    phone: z.string().trim().optional(),
    city: z.string().trim().min(2, 'Enter your city or location'),
    instagram: z.string().trim().optional(),
    tiktok: z.string().trim().optional(),
    otherSocial: z.string().trim().optional(),
    notes: z.string().trim().max(300, 'Keep notes under 300 characters').optional(),
    marketingConsent: z.boolean().refine((value) => value, 'Contact consent is required'),
  })
  .refine(
    (values) => Boolean(values.instagram || values.tiktok || values.otherSocial),
    {
      message: 'Add at least one social link or handle',
      path: ['instagram'],
    },
  )

export type AmbassadorLeadFormValues = z.infer<typeof ambassadorLeadSchema>
