export type RewardMeAgreementSection = {
  title: string
  paragraphs?: readonly string[]
  items?: readonly string[]
}

const commonSections = {
  selective: {
    title: '3. Membership Is Selective',
    paragraphs: [
      'RewardMe reviews participating businesses to keep the program and its member experience high quality. We can decline or remove a business from the program at our discretion.',
    ],
  },
  standards: {
    title: '4. Standards and Enforcement',
    items: [
      'We may review, warn, suspend, or remove any business whose quality, service, reliability, or conduct falls short of our standards, or who acts dishonestly or in bad faith toward members or RewardMe.',
      "We'll act reasonably and give notice where we can — but if a situation is serious (fraud, harm to members, illegal activity), we may suspend participation immediately and sort out the details after.",
    ],
  },
  responsibility: {
    title: '5. Responsibility for Goods and Services',
    paragraphs: [
      "RewardMe connects members with participating businesses and administers reward payouts — we are not a party to the underlying purchase. You're fully responsible for the goods and services you provide.",
    ],
  },
  confidentiality: {
    title: '8. Confidentiality',
    paragraphs: [
      "Please don't share other participating businesses' information, pricing, or details you learn through the program outside of it, except as needed to complete a transaction.",
    ],
  },
  changes: {
    title: '9. Changes to This Agreement',
    paragraphs: [
      "We may update these terms as the program grows. We'll give reasonable written notice of material changes before they take effect. Continuing to participate after that notice means you accept the update.",
    ],
  },
  electronic: {
    title: '11. Electronic Agreement',
    paragraphs: [
      'Checking the acceptance box below and clicking Submit counts as your agreement to these terms, on behalf of the business named in this form, exactly as if signed by hand. We keep a timestamped record of your acceptance, the version of the Agreement you accepted, and the information you submitted as proof.',
    ],
  },
} satisfies Record<string, RewardMeAgreementSection>

export const rewardMeCommissionAgreement: readonly RewardMeAgreementSection[] = [
  {
    title: '1. What RewardMe Is',
    paragraphs: [
      'RewardMe is a subscription-based membership rewards program. Members earn rewards through participating businesses and redeem them at the RewardMe store. This Agreement covers your participation as a business on the Commission Model: RewardMe pays rewards directly to members on your behalf, and you pay RewardMe a commission.',
    ],
  },
  {
    title: '2. How the Commission Model Works',
    items: [
      "When a member earns rewards at your business, RewardMe pays that reward amount to the member directly — you don't issue your own credit.",
      "You pay RewardMe a commission of between 15% and 25% on rewards spent by members at your business. Your exact rate is set based on your industry (see the industry entered in this application). This is RewardMe's fee for administering and paying out the reward.",
      'Your reward rate (the percentage back that members earn) is the rate you select in this application, and applies to purchases at your business unless changed with notice.',
      'If you selected earn-only access, members can earn rewards at your business but cannot redeem/spend rewards there.',
    ],
  },
  commonSections.selective,
  commonSections.standards,
  commonSections.responsibility,
  {
    title: '6. Payouts and Reporting',
    paragraphs: [
      "RewardMe will provide you with regular reporting on rewards earned and commissions owed at your business, and will invoice or deduct commissions per the payment terms provided separately. You're responsible for reporting any tax obligations related to your participation.",
    ],
  },
  {
    title: '7. Term and Leaving the Program',
    items: [
      'Participation continues until either side gives written notice to end it.',
      'You may leave the program at any time by giving us written notice.',
    ],
  },
  commonSections.confidentiality,
  commonSections.changes,
  {
    title: '10. The Basics',
    items: [
      'This Agreement is the entire understanding between you and RewardMe regarding your participation on the Commission Model.',
      "If any part of this Agreement isn't enforceable, the rest still stands.",
      'This Agreement is governed by the laws of [STATE/COUNTRY — TO BE FILLED IN].',
    ],
  },
  commonSections.electronic,
]

export const rewardMeCreditAgreement: readonly RewardMeAgreementSection[] = [
  {
    title: '1. What RewardMe Is',
    paragraphs: [
      'RewardMe is a subscription-based membership rewards program. Members earn rewards through participating businesses and redeem them at the RewardMe store. This Agreement covers your participation as a business on the Credit Model: you pay out rewards as your own business credit rather than cash, and other members redeem that credit at your business.',
    ],
  },
  {
    title: '2. How the Credit Model Works',
    items: [
      'When a member earns a reward at your business, you issue that reward as your own business credit (for example, a store credit, gift-card balance, or equivalent), functioning much like your own internal currency.',
      "Members — including members who didn't originally earn that credit at your business — can come in and redeem it with you, which brings you new customers who spend real cash to unlock using that credit.",
      "You pay RewardMe a commission of between 15% and 25% on rewards redeemed at your business through the program. Your exact rate is set based on your industry (see the industry entered in this application). This is RewardMe's fee for administering the program and driving that customer activity to you.",
      'Your reward rate (the percentage back that members earn) is the rate you select in this application, and applies to purchases at your business unless changed with notice.',
      'If you selected earn-only access, members can earn credit at your business but cannot redeem it there.',
      'Credit you issue through the program is only redeemable within RewardMe and only by RewardMe members; it is not cash, not a security, and not redeemable by RewardMe for cash.',
    ],
  },
  commonSections.selective,
  commonSections.standards,
  commonSections.responsibility,
  {
    title: '6. Payouts and Reporting',
    paragraphs: [
      "RewardMe will provide you with regular reporting on credit issued and redeemed at your business and commissions owed, and will invoice or deduct commissions per the payment terms provided separately. You're responsible for reporting any tax obligations related to your participation.",
    ],
  },
  {
    title: '7. Term and Leaving the Program',
    items: [
      'Participation continues until either side gives written notice to end it.',
      "You may leave the program at any time by giving us written notice. Outstanding credit you've issued that hasn't yet been redeemed remains your responsibility to honor per the terms of this Agreement, even after you leave, unless we agree otherwise in writing.",
    ],
  },
  commonSections.confidentiality,
  commonSections.changes,
  {
    title: '10. The Basics',
    items: [
      'This Agreement is the entire understanding between you and RewardMe regarding your participation on the Credit Model.',
      "If any part of this Agreement isn't enforceable, the rest still stands.",
      'This Agreement is governed by the laws of [STATE/COUNTRY — TO BE FILLED IN].',
    ],
  },
  commonSections.electronic,
]
