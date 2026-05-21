export const MEMBER_TRANSACTION_POINTS_PER_REWARD_DOLLAR = 100

export interface MemberTransactionCalculationInput {
  purchaseAmount: number
  rewardRatePercent: number
  commissionRatePercent: number
}

export interface MemberTransactionCalculation {
  rewardValue: number
  pointsAwarded: number
  commissionAmount: number
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
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
