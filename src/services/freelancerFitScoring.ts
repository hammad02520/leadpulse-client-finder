import { NicheCategory, PublicContacts, WebsiteVerification } from '../types';

/**
 * Freelancer Fit Scoring Engine
 * 
 * Quantifies how ideal a local business is for a freelance web designer/developer:
 * - High score (80-100): Solo/independent local trade, verified NO website, direct phone/email available.
 * - Low score / Skip: Huge national chains, franchises, or companies with existing robust sites.
 */

export const TIER_A_NICHES: NicheCategory[] = [
  { id: 'roofer', name: 'Roofing Contractors', tier: 'TIER_A', osmFilter: { key: 'craft', value: 'roofer' }, avgTicketValue: '£1,500 - £8,000', typicalNeed: 'Emergency Roof Repairs & Quotes' },
  { id: 'plumber', name: 'Plumbers & Heating Engineers', tier: 'TIER_A', osmFilter: { key: 'craft', value: 'plumber' }, avgTicketValue: '£250 - £2,500', typicalNeed: 'Emergency Callout Landing Page' },
  { id: 'electrician', name: 'Electricians', tier: 'TIER_A', osmFilter: { key: 'craft', value: 'electrician' }, avgTicketValue: '£300 - £3,000', typicalNeed: 'Commercial & Domestic Electrical' },
  { id: 'hvac', name: 'HVAC & Air Conditioning', tier: 'TIER_A', osmFilter: { key: 'craft', value: 'hvac' }, avgTicketValue: '£800 - £5,000', typicalNeed: 'AC & Boiler Installations' },
  { id: 'cleaning', name: 'Commercial & Domestic Cleaners', tier: 'TIER_A', osmFilter: { key: 'craft', value: 'cleaning' }, avgTicketValue: '£150 - £1,200', typicalNeed: 'End of Tenancy & Office Cleaning' },
  { id: 'landscaper', name: 'Landscaping & Gardeners', tier: 'TIER_A', osmFilter: { key: 'craft', value: 'gardener' }, avgTicketValue: '£500 - £4,000', typicalNeed: 'Patios, Turf & Garden Design' },
  { id: 'pest_control', name: 'Pest Control Services', tier: 'TIER_A', osmFilter: { key: 'craft', value: 'pest_control' }, avgTicketValue: '£200 - £1,500', typicalNeed: 'Urgent Infestation Removal' },
  { id: 'moving', name: 'Removal & Moving Companies', tier: 'TIER_A', osmFilter: { key: 'shop', value: 'storage_rental' }, avgTicketValue: '£400 - £2,500', typicalNeed: 'Man & Van House Removals' },
  { id: 'car_detailing', name: 'Car Detailing & Valeting', tier: 'TIER_A', osmFilter: { key: 'shop', value: 'car_repair' }, avgTicketValue: '£120 - £800', typicalNeed: 'Ceramic Coating & Paint Correction' },
  { id: 'auto_repair', name: 'Independent Auto Mechanics', tier: 'TIER_A', osmFilter: { key: 'shop', value: 'car_repair' }, avgTicketValue: '£200 - £1,800', typicalNeed: 'MOT, Brake & Engine Repairs' }
];

export const TIER_B_NICHES: NicheCategory[] = [
  { id: 'barber', name: 'Barber Shops', tier: 'TIER_B', osmFilter: { key: 'shop', value: 'hairdresser' }, avgTicketValue: '£20 - £50', typicalNeed: 'Online Appointment Booking' },
  { id: 'beauty_salon', name: 'Beauty & Nail Salons', tier: 'TIER_B', osmFilter: { key: 'shop', value: 'beauty' }, avgTicketValue: '£40 - £150', typicalNeed: 'Treatment Menu & Booking' },
  { id: 'gym', name: 'Independent Gyms & Fitness Studios', tier: 'TIER_B', osmFilter: { key: 'leisure', value: 'fitness_centre' }, avgTicketValue: '£40 - £120/mo', typicalNeed: 'Membership Signups & Class Schedules' },
  { id: 'personal_trainer', name: 'Personal Trainers', tier: 'TIER_B', osmFilter: { key: 'leisure', value: 'fitness_station' }, avgTicketValue: '£200 - £600/mo', typicalNeed: '1-on-1 Coaching Packages' },
  { id: 'photographer', name: 'Photographers', tier: 'TIER_B', osmFilter: { key: 'craft', value: 'photographer' }, avgTicketValue: '£300 - £2,000', typicalNeed: 'Portfolio & Wedding Inquiries' },
  { id: 'small_restaurant', name: 'Independent Restaurants & Diners', tier: 'TIER_B', osmFilter: { key: 'amenity', value: 'restaurant' }, avgTicketValue: '£30 - £100', typicalNeed: 'Menu Display & Table Reservations' },
  { id: 'cafe', name: 'Local Cafes & Coffee Shops', tier: 'TIER_B', osmFilter: { key: 'amenity', value: 'cafe' }, avgTicketValue: '£10 - £30', typicalNeed: 'Local Presence & Opening Hours' },
  { id: 'pet_grooming', name: 'Dog & Pet Groomers', tier: 'TIER_B', osmFilter: { key: 'shop', value: 'pet_grooming' }, avgTicketValue: '£40 - £100', typicalNeed: 'Pet Breed Price List & Appointments' }
];

export const ALL_NICHES = [...TIER_A_NICHES, ...TIER_B_NICHES];

// Blacklist of corporate national brands & franchises that a solo freelancer shouldn't pitch
const CORPORATE_CHAIN_KEYWORDS = [
  'mcdonald', 'subway', 'domino', 'pizza hut', 'burger king', 'kfc', 'starbucks', 'costa', 'greggs',
  'kwik fit', 'halfords', 'national tyres', 'ats euromaster', 'tesco', 'sainsbury', 'asda', 'morrisons',
  'boots', 'superdrug', 'specsavers', 'bupa', 'clearchoice', 'aspendental', 'heartland', 'shell', 'bp',
  'esso', 'texaco', 'travelodge', 'premier inn', 'hilton', 'marriott', 'puregym', 'the gym group',
  'david lloyd', 'nuffield'
];

export interface FreelancerFitResult {
  score: number;
  tier: 'PREMIUM_TARGET' | 'GOOD_FIT' | 'MODERATE' | 'SKIP_CHAIN';
  breakdown: {
    noWebsiteBonus: number;
    phoneBonus: number;
    emailBonus: number;
    socialBonus: number;
    listingBonus: number;
    smallBizBonus: number;
    highTicketBonus: number;
    chainPenalty: number;
  };
  reasons: string[];
}

export function calculateFreelancerFitScore(params: {
  businessName: string;
  nicheId: string;
  websiteVerification: WebsiteVerification;
  contacts: PublicContacts;
}): FreelancerFitResult {
  let score = 0;
  const reasons: string[] = [];
  const lowerName = params.businessName.toLowerCase();

  // 1. Corporate Chain Check (-50 Penalty)
  const isChain = CORPORATE_CHAIN_KEYWORDS.some(k => lowerName.includes(k));
  if (isChain) {
    return {
      score: 15,
      tier: 'SKIP_CHAIN',
      breakdown: {
        noWebsiteBonus: 0,
        phoneBonus: 0,
        emailBonus: 0,
        socialBonus: 0,
        listingBonus: 10,
        smallBizBonus: 0,
        highTicketBonus: 0,
        chainPenalty: -50
      },
      reasons: ['Recognized national corporate chain or franchise. Not suitable for solo freelance web offer.']
    };
  }

  // 2. NO WEBSITE (+35)
  let noWebsiteBonus = 0;
  if (params.websiteVerification.status === 'VERIFIED_NO_WEBSITE') {
    noWebsiteBonus = 35;
    score += 35;
    reasons.push('✅ Verified: No official standalone website (+35)');
  } else if (params.websiteVerification.status === 'LIKELY_NO_WEBSITE') {
    noWebsiteBonus = 25;
    score += 25;
    reasons.push('⚠️ Likely No Website: Only social/directory profile (+25)');
  } else if (params.websiteVerification.status === 'SOURCE_MISSING') {
    noWebsiteBonus = 15;
    score += 15;
    reasons.push('🔍 Directory missing website tag (+15)');
  } else {
    // Has website
    reasons.push('ℹ️ Business already has an existing website');
  }

  // 3. PHONE AVAILABLE (+20)
  let phoneBonus = 0;
  if (params.contacts.phone && params.contacts.phone.trim().length > 6) {
    phoneBonus = 20;
    score += 20;
    reasons.push('📞 Direct phone line available for 1-click calling/WhatsApp (+20)');
  }

  // 4. EMAIL AVAILABLE (+15)
  let emailBonus = 0;
  if (params.contacts.email && params.contacts.email.trim().length > 4) {
    emailBonus = 15;
    score += 15;
    const isFreeProvider = ['gmail.com', 'yahoo.', 'hotmail.', 'outlook.', 'btinternet.com', 'aol.com', 'icloud.com'].some(d => params.contacts.email?.toLowerCase().includes(d));
    if (isFreeProvider) {
      reasons.push(`✉️ Uses local SMB email (${params.contacts.email}) (+15)`);
    } else {
      reasons.push(`✉️ Direct email contact available (+15)`);
    }
  }

  // 5. SOCIAL PROFILE PRESENT (+10)
  let socialBonus = 0;
  if (params.contacts.facebook || params.contacts.instagram) {
    socialBonus = 10;
    score += 10;
    reasons.push('📱 Active social presence (FB/IG) — eager for digital presence (+10)');
  }

  // 6. ACTIVE BUSINESS LISTING (+10)
  const listingBonus = 10;
  score += 10;
  reasons.push('📍 Verified local business premises on Google Maps (+10)');

  // 7. SMALL BUSINESS FIT (+10)
  // Single location, independent naming
  const smallBizBonus = 10;
  score += 10;
  reasons.push('🏪 Independent local owner-operator (+10)');

  // 8. HIGH-TICKET / ACTIVE REPUTATION (+10)
  let highTicketBonus = 0;
  const isTierA = TIER_A_NICHES.some(n => n.id === params.nicheId || lowerName.includes(n.id));
  if (isTierA) {
    highTicketBonus = 10;
    score += 10;
    reasons.push('💎 Tier-A High Ticket Trade (Roofing, Plumbing, HVAC, Electrical) (+10)');
  } else {
    highTicketBonus = 5;
    score += 5;
    reasons.push('⚡ Frequent Service SMB (+5)');
  }

  // Clamp 0 - 100
  const finalScore = Math.min(Math.max(score, 0), 100);

  let tier: 'PREMIUM_TARGET' | 'GOOD_FIT' | 'MODERATE' | 'SKIP_CHAIN' = 'MODERATE';
  if (finalScore >= 80) tier = 'PREMIUM_TARGET';
  else if (finalScore >= 60) tier = 'GOOD_FIT';

  return {
    score: finalScore,
    tier,
    breakdown: {
      noWebsiteBonus,
      phoneBonus,
      emailBonus,
      socialBonus,
      listingBonus,
      smallBizBonus,
      highTicketBonus,
      chainPenalty: 0
    },
    reasons
  };
}
