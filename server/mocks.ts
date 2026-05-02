/**
 * Mock data for questions and rewards
 * This layer is designed to be easily replaced with a real API later
 */

export interface MockQuestion {
  id: string;
  type: "swipe" | "rating" | "choice" | "open_ended";
  text: string;
  textAr: string;
  options?: Array<{ id: string; label: string; labelAr: string }>;
  difficulty: "easy" | "medium" | "hard";
  pointsValue: number;
}

export interface MockReward {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  pointsCost: number;
  category: "mobile_recharge" | "discount" | "voucher" | "other";
  platform: string;
  trustRequired: "low" | "medium" | "high";
  imageUrl: string;
}

export interface WheelPrize {
  id: string;
  label: string;
  labelAr: string;
  points: number;
  color: string;
}

// Mock Questions Dataset
export const mockQuestions: MockQuestion[] = [
  {
    id: "q1",
    type: "swipe",
    text: "Which brand do you prefer?",
    textAr: "أنهي براند تفضل؟",
    options: [
      { id: "opt1", label: "Hamoud Frères", labelAr: "حمود فريرز" },
      { id: "opt2", label: "Boga", labelAr: "بوقة" },
    ],
    difficulty: "easy",
    pointsValue: 10,
  },
  {
    id: "q2",
    type: "rating",
    text: "Rate your satisfaction with Jumia",
    textAr: "قيّم رضاك عن جوميا",
    difficulty: "easy",
    pointsValue: 10,
  },
  {
    id: "q3",
    type: "choice",
    text: "What's your favorite shopping platform?",
    textAr: "أنهي منصة تسوق تفضل؟",
    options: [
      { id: "opt1", label: "Jumia", labelAr: "جوميا" },
      { id: "opt2", label: "Glovo", labelAr: "جلوفو" },
      { id: "opt3", label: "Carrefour", labelAr: "كارفور" },
    ],
    difficulty: "easy",
    pointsValue: 15,
  },
  {
    id: "q4",
    type: "open_ended",
    text: "What's your favorite product category?",
    textAr: "أنهي فئة منتجات تفضل؟",
    difficulty: "medium",
    pointsValue: 20,
  },
  {
    id: "q5",
    type: "swipe",
    text: "Which payment method do you use most?",
    textAr: "أنهي طريقة دفع تستعملها أكثر؟",
    options: [
      { id: "opt1", label: "Credit Card", labelAr: "بطاقة ائتمان" },
      { id: "opt2", label: "Mobile Money", labelAr: "محفظة رقمية" },
    ],
    difficulty: "easy",
    pointsValue: 10,
  },
  {
    id: "q6",
    type: "rating",
    text: "How often do you shop online?",
    textAr: "كيفاش تتسوق أونلاين؟",
    difficulty: "easy",
    pointsValue: 10,
  },
  {
    id: "q7",
    type: "choice",
    text: "What's your age range?",
    textAr: "أنهي فئة عمرك؟",
    options: [
      { id: "opt1", label: "18-25", labelAr: "18-25" },
      { id: "opt2", label: "26-35", labelAr: "26-35" },
      { id: "opt3", label: "36-45", labelAr: "36-45" },
      { id: "opt4", label: "45+", labelAr: "45+" },
    ],
    difficulty: "easy",
    pointsValue: 15,
  },
  {
    id: "q8",
    type: "open_ended",
    text: "What's your favorite Tunisian brand?",
    textAr: "أنهي براند تونسي تفضل؟",
    difficulty: "medium",
    pointsValue: 20,
  },
  {
    id: "q9",
    type: "swipe",
    text: "Do you prefer local or international brands?",
    textAr: "تفضل براندات محلية ولا عالمية؟",
    options: [
      { id: "opt1", label: "Local", labelAr: "محلية" },
      { id: "opt2", label: "International", labelAr: "عالمية" },
    ],
    difficulty: "easy",
    pointsValue: 10,
  },
  {
    id: "q10",
    type: "rating",
    text: "How satisfied are you with delivery speed?",
    textAr: "كيفاش رضاك على سرعة التوصيل؟",
    difficulty: "easy",
    pointsValue: 10,
  },
];

// Mock Rewards Dataset
export const mockRewards: MockReward[] = [
  {
    id: "r1",
    name: "Jumia 10 TND Voucher",
    nameAr: "قسيمة جوميا 10 دينار",
    description: "Get 10 TND discount on Jumia",
    descriptionAr: "احصل على خصم 10 دينار على جوميا",
    pointsCost: 100,
    category: "voucher",
    platform: "Jumia",
    trustRequired: "low",
    imageUrl: "https://via.placeholder.com/150?text=Jumia+10TND",
  },
  {
    id: "r2",
    name: "Glovo 5 TND Credit",
    nameAr: "رصيد جلوفو 5 دينار",
    description: "Get 5 TND credit on Glovo",
    descriptionAr: "احصل على 5 دينار رصيد على جلوفو",
    pointsCost: 50,
    category: "discount",
    platform: "Glovo",
    trustRequired: "low",
    imageUrl: "https://via.placeholder.com/150?text=Glovo+5TND",
  },
  {
    id: "r3",
    name: "Ooredoo Mobile Recharge 5 TND",
    nameAr: "تعبئة أوريدو 5 دينار",
    description: "Recharge your Ooredoo number with 5 TND",
    descriptionAr: "عبّي رقمك الأوريدو بـ 5 دينار",
    pointsCost: 80,
    category: "mobile_recharge",
    platform: "Ooredoo",
    trustRequired: "low",
    imageUrl: "https://via.placeholder.com/150?text=Ooredoo+5TND",
  },
  {
    id: "r4",
    name: "Carrefour 20 TND Voucher",
    nameAr: "قسيمة كارفور 20 دينار",
    description: "Get 20 TND discount at Carrefour",
    descriptionAr: "احصل على خصم 20 دينار في كارفور",
    pointsCost: 200,
    category: "voucher",
    platform: "Carrefour",
    trustRequired: "medium",
    imageUrl: "https://via.placeholder.com/150?text=Carrefour+20TND",
  },
  {
    id: "r5",
    name: "Tunisie Telecom Mobile Recharge 10 TND",
    nameAr: "تعبئة تونيسي تليكوم 10 دينار",
    description: "Recharge your Tunisie Telecom number with 10 TND",
    descriptionAr: "عبّي رقمك تونيسي تليكوم بـ 10 دينار",
    pointsCost: 150,
    category: "mobile_recharge",
    platform: "Tunisie Telecom",
    trustRequired: "low",
    imageUrl: "https://via.placeholder.com/150?text=TT+10TND",
  },
  {
    id: "r6",
    name: "Jumia 50 TND Voucher",
    nameAr: "قسيمة جوميا 50 دينار",
    description: "Get 50 TND discount on Jumia",
    descriptionAr: "احصل على خصم 50 دينار على جوميا",
    pointsCost: 500,
    category: "voucher",
    platform: "Jumia",
    trustRequired: "high",
    imageUrl: "https://via.placeholder.com/150?text=Jumia+50TND",
  },
  {
    id: "r7",
    name: "Glovo 20 TND Credit",
    nameAr: "رصيد جلوفو 20 دينار",
    description: "Get 20 TND credit on Glovo",
    descriptionAr: "احصل على 20 دينار رصيد على جلوفو",
    pointsCost: 200,
    category: "discount",
    platform: "Glovo",
    trustRequired: "medium",
    imageUrl: "https://via.placeholder.com/150?text=Glovo+20TND",
  },
  {
    id: "r8",
    name: "Mystery Gift",
    nameAr: "هدية غامضة",
    description: "Surprise reward - could be anything!",
    descriptionAr: "هدية مفاجأة - ممكن تكون أي حاجة!",
    pointsCost: 300,
    category: "other",
    platform: "Mystery",
    trustRequired: "medium",
    imageUrl: "https://via.placeholder.com/150?text=Mystery+Gift",
  },
];

// Wheel Prizes Dataset
export const wheelPrizes: WheelPrize[] = [
  {
    id: "p1",
    label: "50 Points",
    labelAr: "50 نقطة",
    points: 50,
    color: "#FF6B6B",
  },
  {
    id: "p2",
    label: "100 Points",
    labelAr: "100 نقطة",
    points: 100,
    color: "#4ECDC4",
  },
  {
    id: "p3",
    label: "Free Spin",
    labelAr: "دورة مجانية",
    points: 0,
    color: "#FFE66D",
  },
  {
    id: "p4",
    label: "200 Points",
    labelAr: "200 نقطة",
    points: 200,
    color: "#95E1D3",
  },
  {
    id: "p5",
    label: "Mystery Box",
    labelAr: "صندوق غامض",
    points: 150,
    color: "#C7CEEA",
  },
  {
    id: "p6",
    label: "75 Points",
    labelAr: "75 نقطة",
    points: 75,
    color: "#FF8B94",
  },
  {
    id: "p7",
    label: "Lucky Draw",
    labelAr: "سحب الحظ",
    points: 0,
    color: "#FFDDC1",
  },
  {
    id: "p8",
    label: "300 Points",
    labelAr: "300 نقطة",
    points: 300,
    color: "#A8E6CF",
  },
];

/**
 * Get a random question from the mock dataset
 */
export function getRandomMockQuestion(): MockQuestion {
  return mockQuestions[Math.floor(Math.random() * mockQuestions.length)];
}

/**
 * Get multiple random questions
 */
export function getRandomMockQuestions(count: number): MockQuestion[] {
  const shuffled = [...mockQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, mockQuestions.length));
}

/**
 * Get all mock rewards
 */
export function getAllMockRewards(): MockReward[] {
  return mockRewards;
}

/**
 * Get mock rewards by trust level
 */
export function getMockRewardsByTrustLevel(trustLevel: "low" | "medium" | "high"): MockReward[] {
  return mockRewards.filter(r => r.trustRequired === trustLevel);
}

/**
 * Get a random wheel prize
 */
export function getRandomWheelPrize(): WheelPrize {
  return wheelPrizes[Math.floor(Math.random() * wheelPrizes.length)];
}

/**
 * Get all wheel prizes
 */
export function getAllWheelPrizes(): WheelPrize[] {
  return wheelPrizes;
}
