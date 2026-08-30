export type LegalPageKind = 'terms' | 'privacy' | 'reward-terms' | 'verification-policy'

export interface LegalPageContent {
  title: string
  intro: string
  notice?: string
  sections: Array<{ title: string; body: string }>
}

const defaultLegalPages: Record<LegalPageKind, LegalPageContent> = {
  terms: {
    title: 'Terms of Use',
    intro: 'These plain-language terms explain the current RewardMe member experience and the responsibilities that come with using it.',
    notice: 'Operational summary — pending final legal approval before paid membership launch.',
    sections: [
      {
        title: 'Member accounts',
        body: 'Members are responsible for keeping account details accurate and secure. One member account should represent one real person.',
      },
      {
        title: 'Rewards are offer-based',
        body: 'Rewards are not cash payouts. Available rewards, point costs, eligibility, and redemption steps may change as the program evolves.',
      },
      {
        title: 'Membership subscription',
        body: 'Membership access follows the current RewardMe program offering. Reward actions may require sign-in, active membership status, and completed ID verification before earning or redeeming value.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'This privacy summary explains the information RewardMe uses to operate accounts, rewards, support, and verification.',
    notice: 'Operational summary — pending final legal approval before paid membership launch.',
    sections: [
      {
        title: 'Information we collect',
        body: 'The app may collect account details, contact details, activity, reward history, and ID verification submissions needed to operate the program.',
      },
      {
        title: 'How information is used',
        body: 'Information is used to manage accounts, review verification, protect reward value, support redemptions, and improve the member experience.',
      },
      {
        title: 'Support contact',
        body: 'For privacy questions, members can contact support@rewardme.ph.',
      },
    ],
  },
  'reward-terms': {
    title: 'Reward Terms',
    intro: 'These reward terms explain how RewardMe offers, point costs, eligibility, and redemptions work for members.',
    notice: 'Operational summary — pending final legal approval before paid membership launch.',
    sections: [
      {
        title: 'No cash payout promise',
        body: 'Rewards represent offers, perks, credits, or experiences available through RewardMe. They are not a promise of cash payment.',
      },
      {
        title: 'Reward availability',
        body: 'Rewards may have inventory, eligibility, location, point cost, or verification requirements before they can be claimed. Issued gift cards and stored balances do not expire.',
      },
      {
        title: 'Redemption review',
        body: 'Some reward actions may be validated by staff or administrators to keep the program fair and prevent duplicate or invalid claims.',
      },
    ],
  },
  'verification-policy': {
    title: 'Verification Policy',
    intro: 'This policy explains why member verification may be required before protected reward actions become available.',
    notice: 'Operational summary — pending final legal approval before paid membership launch.',
    sections: [
      {
        title: 'Why verification is required',
        body: 'Verification helps support one member account per person and protects reward value for legitimate members.',
      },
      {
        title: 'How review works',
        body: 'Admins review submitted ID details. Reward actions may stay locked while a submission is pending or if more information is needed.',
      },
      {
        title: 'How ID information is used',
        body: 'ID information should be used only for member verification and account protection. Members can contact support@rewardme.ph with questions.',
      },
    ],
  },
}

const loyalityLegalPages: Record<LegalPageKind, LegalPageContent> = {
  terms: {
    title: 'Terms of Use',
    intro: 'These terms explain how your customer account works with the business loyalty program powered by Loyality.',
    sections: [
      {
        title: 'Customer accounts',
        body: 'Keep your account details accurate and secure. One customer account should represent one real person.',
      },
      {
        title: 'Business-specific rewards',
        body: 'Offers, visit rewards, vouchers, and eligibility rules are set for this business. Rewards are not cash and may change or end under the terms shown with each offer.',
      },
      {
        title: 'Account access',
        body: 'Creating a standard customer account is free. Sign-in may be required to claim or use an offer, but no paid membership or government ID is required to create that account.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'This privacy summary explains the information used to run your customer account and rewards with this business.',
    sections: [
      {
        title: 'Information we collect',
        body: 'The service may collect the account and contact details you provide, plus visits, offer claims, voucher activity, and reward history associated with this business.',
      },
      {
        title: 'How information is used',
        body: 'Information is used to connect your account to this business, show reward progress, process claims and redemptions, prevent misuse, and provide support.',
      },
      {
        title: 'Support contact',
        body: 'For privacy questions, customers can contact support@rewardme.ph.',
      },
    ],
  },
  'reward-terms': {
    title: 'Reward Terms',
    intro: 'These terms explain how offers, visit rewards, vouchers, and redemptions work for this business.',
    sections: [
      {
        title: 'No cash payout promise',
        body: 'Rewards are business offers, perks, or vouchers. They are not cash and cannot be exchanged for a cash payment.',
      },
      {
        title: 'Reward availability',
        body: 'The business sets each reward’s eligibility, timing, limits, and redemption instructions. The terms shown with the specific offer or voucher apply.',
      },
      {
        title: 'Redemption review',
        body: 'Business staff may confirm a visit, voucher, or claim before completing a redemption. Duplicate, expired, or ineligible claims may be declined.',
      },
    ],
  },
  'verification-policy': {
    title: 'Verification Policy',
    intro: 'This policy explains how account and reward activity may be checked to keep this business’s loyalty program accurate and secure.',
    sections: [
      {
        title: 'No paid membership or ID requirement',
        body: 'A standard Loyality customer account does not require a paid membership or government ID. The business may ask you to confirm account or transaction details when resolving a specific issue.',
      },
      {
        title: 'How checks work',
        body: 'Business staff may review the relevant visit, offer claim, voucher, or redemption record and contact you if details are missing or inconsistent.',
      },
      {
        title: 'Data minimization',
        body: 'Only account and program activity needed to resolve the issue should be used. For questions, customers can contact support@rewardme.ph.',
      },
    ],
  },
}

const wondertownDemoNotice = 'Wondertown Rewards is a fictional demo environment. It does not charge real membership fees or request real identity documents.'

const wondertownLegalPages: Record<LegalPageKind, LegalPageContent> = {
  terms: {
    title: 'Terms of Use',
    intro: 'These demo terms explain the fictional Wondertown Rewards member experience and responsible use of the test environment.',
    notice: wondertownDemoNotice,
    sections: [
      {
        title: 'Demo accounts',
        body: 'Use only fictional or test details in a Wondertown account. Demo accounts and their activity may be reset without notice.',
      },
      {
        title: 'Demo rewards',
        body: 'Points, credits, offers, and vouchers in Wondertown are demonstrations only and have no cash value.',
      },
      {
        title: 'No real charges',
        body: 'The demo does not sell a paid membership, process real purchases, or issue real gift cards.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'This privacy summary explains how test data is used inside the fictional Wondertown Rewards demo.',
    notice: wondertownDemoNotice,
    sections: [
      {
        title: 'Test data only',
        body: 'Do not submit real identity documents, payment details, or other sensitive personal information in this demo.',
      },
      {
        title: 'How test data is used',
        body: 'Test data is used only to demonstrate account, reward, and redemption workflows.',
      },
      {
        title: 'Support contact',
        body: 'For demo support, contact support@rewardme.ph.',
      },
    ],
  },
  'reward-terms': {
    title: 'Reward Terms',
    intro: 'These demo reward terms apply only to fictional Wondertown offers, points, gift cards, and redemptions.',
    notice: wondertownDemoNotice,
    sections: [
      {
        title: 'No real-world value',
        body: 'Demo rewards, balances, and gift cards have no monetary value and cannot be exchanged for cash, goods, or services.',
      },
      {
        title: 'Demo availability',
        body: 'Demo content may change, expire, or reset at any time as test scenarios are updated.',
      },
      {
        title: 'Redemption simulation',
        body: 'Staff and administrator actions simulate reward review and redemption; they do not complete a real transaction.',
      },
    ],
  },
  'verification-policy': {
    title: 'Verification Policy',
    intro: 'Wondertown does not perform real identity verification in this demo environment.',
    notice: wondertownDemoNotice,
    sections: [
      {
        title: 'Do not submit real ID',
        body: 'Use fictional test details only. Never upload or enter a real identity document in Wondertown.',
      },
      {
        title: 'Simulated review',
        body: 'Any pending, approved, or rejected status exists only to demonstrate an administrator workflow.',
      },
      {
        title: 'Demo data cleanup',
        body: 'Test accounts and simulated verification records may be reset or removed without notice.',
      },
    ],
  },
}

export function getLegalPageContent(kind: LegalPageKind, programSlug: string) {
  if (programSlug === 'loyality') return loyalityLegalPages[kind]
  if (programSlug === 'wondertown') return wondertownLegalPages[kind]
  return defaultLegalPages[kind]
}

export function getLegalJoinLabel(programSlug: string) {
  return programSlug === 'loyality' ? 'Create customer account' : 'Join Rewards Club'
}
