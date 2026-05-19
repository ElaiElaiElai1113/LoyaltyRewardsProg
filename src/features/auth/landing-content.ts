export const landingLogo = 'Medellin Rewards'

export const landingEyebrow = "The world's highest paying rewards program"

export const landingHeroEyebrow = "THE WORLD'S HIGHEST PAYING REWARDS PROGRAM"

export const landingHeadline = 'Earn a free vacation every year — doing what you already do'

export const landingHeroHeadline = {
  beforeHighlight: 'Earn a ',
  highlight: 'free vacation',
  afterHighlight: ' every year — doing what you already do',
} as const

export const landingTagline = landingHeadline

export const landingParagraphs = [
  'Imagine being able to earn enough rewards every year for a free vacation by doing what you already do, with Medellin Rewards you can do exactly that!',
  'Medellin Rewards pays a minimum of 20% to a maximum of 100% in Rewards when you spend your money with the businesses that are within our network.',
] as const

export const landingBody = landingParagraphs[0]

export const landingRewardStatement = landingParagraphs[1]

export const landingHighlights = [
  'Earn between 20% - 100% by simply spending at amazing businesses within our platform',
  'Earn from purchasing almost any type of product or service from going to a restaurant or hotel to buying a car or home.',
] as const

export const landingTags = landingHighlights

export const landingHeroInfoRows = [
  {
    icon: 'chart',
    text: landingHighlights[0],
  },
  {
    icon: 'cart',
    text: landingHighlights[1],
  },
] as const

export const landingCategoryTags = [
  'Restaurants & hotels',
  'Cars & real estate',
  '20% – 100% back',
  'Any product or service',
] as const

export const landingHeroPills = [
  {
    icon: 'building',
    label: landingCategoryTags[0],
  },
  {
    icon: 'car',
    label: landingCategoryTags[1],
  },
  {
    icon: 'gift',
    label: landingCategoryTags[2],
  },
  {
    icon: 'leaf',
    label: landingCategoryTags[3],
  },
] as const

export const landingJoinButtonLabel = 'Join Medellin Rewards'

export const landingAgreementLabel = 'View Agreement'

export const landingSubscription = {
  eyebrow: 'Monthly subscription',
  bonusLabel: '$100,000 bonus 100%',
  rewardValue: '$100,000 in Rewards',
  offerBadge: 'Early adopter offer',
} as const

export const landingOfferLines = [
  'Early adopter',
  landingSubscription.eyebrow,
  landingSubscription.bonusLabel,
  landingSubscription.rewardValue,
] as const

export const landingHowItWorksLead = 'Three simple steps to start earning rewards'

export const landingHowItWorksSteps = [
  {
    number: '1',
    title: 'Join',
    body: 'Sign up as a member and receive your $100k early adopter bonus rewards.',
  },
  {
    number: '2',
    title: 'Spend',
    body: 'Shop, dine, and buy services at any business in our network.',
  },
  {
    number: '3',
    title: 'Earn',
    body: 'Automatically earn 20%–100% back in rewards on every purchase.',
  },
  {
    number: '4',
    title: 'Redeem',
    body: 'Use your rewards for travel, experiences, and more — free vacation every year.',
  },
] as const

export const landingFaqQuestions = [
  'Where can I use my rewards?',
  'Can I have more than one rewards account?',
  'Can I transfer rewards to another account?',
  'Can rewards be exchanged for money?',
] as const

export const landingFaqItems = [
  {
    question: landingFaqQuestions[0],
    answer:
      'You can use rewards with participating businesses inside the Medellin Rewards platform as new partners are added.',
  },
  {
    question: landingFaqQuestions[1],
    answer:
      'Each member should use one rewards account so rewards, bonuses, and account activity stay connected correctly.',
  },
  {
    question: landingFaqQuestions[2],
    answer:
      'Reward transfers are not available in the first version. Transfer options may be reviewed as the program grows.',
  },
  {
    question: landingFaqQuestions[3],
    answer:
      'Rewards are program credits for eligible offers and purchases. They are not automatically exchangeable for cash.',
  },
] as const
