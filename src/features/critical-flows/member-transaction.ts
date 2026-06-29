export const MEMBER_TRANSACTION_POINTS_PER_REWARD_DOLLAR = 100

export interface MemberTransactionCalculationInput {
  purchaseAmount: number
  rewardRatePercent: number
  commissionRatePercent: number
}

export interface RewardablePurchaseCalculationInput {
  receiptTotal: number
  taxRate: number
  serviceChargeRate: number
  serviceChargeEnabled: boolean
  giftCardAmount?: number
}

export interface RewardablePurchaseCalculation {
  originalReceiptTotal: number
  giftCardAmount: number
  amountAfterGiftCard: number
  taxableChargeAmount: number
  serviceChargeAmount: number
  rewardableAmount: number
}

export interface MemberTransactionCalculation {
  rewardValue: number
  pointsAwarded: number
  commissionAmount: number
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

export function calculateRewardablePurchaseAmount({
  receiptTotal,
  taxRate,
  serviceChargeRate,
  serviceChargeEnabled,
  giftCardAmount = 0,
}: RewardablePurchaseCalculationInput): RewardablePurchaseCalculation {
  const safeReceiptTotal = Number.isFinite(receiptTotal) ? Math.max(receiptTotal, 0) : 0
  const safeGiftCardAmount = Number.isFinite(giftCardAmount) ? Math.max(giftCardAmount, 0) : 0
  const safeTaxRate = Number.isFinite(taxRate) ? Math.max(taxRate, 0) : 0
  const safeServiceChargeRate = serviceChargeEnabled && Number.isFinite(serviceChargeRate)
    ? Math.max(serviceChargeRate, 0)
    : 0
  const amountAfterGiftCard = roundCurrency(Math.max(safeReceiptTotal - safeGiftCardAmount, 0))
  const chargeMultiplier = 1 + safeTaxRate + safeServiceChargeRate
  const rewardableAmount = chargeMultiplier > 1
    ? roundCurrency(amountAfterGiftCard / chargeMultiplier)
    : amountAfterGiftCard

  return {
    originalReceiptTotal: roundCurrency(safeReceiptTotal),
    giftCardAmount: roundCurrency(Math.min(safeGiftCardAmount, safeReceiptTotal)),
    amountAfterGiftCard,
    taxableChargeAmount: roundCurrency(rewardableAmount * safeTaxRate),
    serviceChargeAmount: roundCurrency(rewardableAmount * safeServiceChargeRate),
    rewardableAmount,
  }
}

export function calculateMemberTransaction({
  purchaseAmount,
  rewardRatePercent,
  commissionRatePercent,
}: MemberTransactionCalculationInput): MemberTransactionCalculation {
  if (!Number.isFinite(purchaseAmount) || purchaseAmount <= 0) {
    throw new Error('Purchase amount must be greater than 0.')
  }

  const rewardValue = roundCurrency(purchaseAmount * (rewardRatePercent / 100))
  const commissionAmount = roundCurrency(purchaseAmount * (commissionRatePercent / 100))

  return {
    rewardValue,
    pointsAwarded: Math.floor(rewardValue * MEMBER_TRANSACTION_POINTS_PER_REWARD_DOLLAR),
    commissionAmount,
  }
}
