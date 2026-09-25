export type LeadStatus = 
  | 'NEW' 
  | 'QUALIFIED' 
  | 'CONTACTED' 
  | 'FOLLOW_UP' 
  | 'REPLIED' 
  | 'MEETING' 
  | 'PROPOSAL' 
  | 'WON' 
  | 'LOST';

export type LeadTemperature = 'HOT' | 'WARM' | 'COLD' | 'IGNORE';

export type SourceType = 
  | 'REDDIT' 
  | 'JOB_FEED' 
  | 'LOCAL_BIZ' 
  | 'GOOGLE_PLACES'
  | 'GOOGLE_MAPS_SCRAPER'
  | 'B2B_APOLLO'
  | 'TECH_STACK'
  | 'FUNDED_STARTUP'
  | 'Y_COMBINATOR'
  | 'PRODUCT_HUNT'
  | 'INDIE_HACKERS'
  | 'BETALIST'
  | 'WIKIDATA'
  | 'GITHUB_FOUNDER'
  | 'TWITTER' 
  | 'GLOBAL_REGISTRY'
  | 'TRADE_EXPO'
  | 'META_ADS'
  | 'GOOGLE_PPC'
  | 'EBOOK_AUTHOR'
  | 'ECOMMERCE_HUNTER'
  | 'AI_AUTOMATION'
  | 'AGENCY_HUNTER'
  | 'SAAS_GITHUB'
  | 'SEC_FORM_D'
  | 'REVIEW_PAIN'
  | 'SECURITY_HUNTER'
  | 'SWEDEN_VAT_REGISTRY'
  | 'MANUAL_IMPORT';

export type JobFeedSource = 'ALL' | 'REMOTIVE' | 'ARBEITNOW' | 'JOBICY' | 'HACKERNEWS';

export type ProjectNeedType = 
  | 'NO_WEBSITE_NO_APP'
  | 'HAS_WEBSITE_NO_APP'
  | 'EBOOK_CREATOR_NEED_APP'
  | 'WEB_REDESIGN' 
  | 'MOBILE_APP' 
  | 'SAAS_MVP' 
  | 'ECOMMERCE' 
  | 'SPEED_PERFORMANCE'
  | 'AI_AUTOMATION_BOT'
  | 'WHITE_LABEL_DEV'
  | 'ECOMMERCE_OPTIMIZATION'
  | 'TECH_DEBT_REBUILD'
  | 'SECURITY_HARDENING'
  | 'REVIEW_COMPLAINT_FIX';

export type FreshnessTier = 'JUST_NOW' | 'TODAY' | 'RECENT' | 'STALE_EXPIRED';

export type EmailValidationStage = 
  | 'FOUND' 
  | 'FORMAT_VALID' 
  | 'DOMAIN_VALID' 
  | 'MX_VALID' 
  | 'DELIVERABILITY_CHECK' 
  | 'VERIFIED';

export type WebsiteVerificationStatus = 
  | 'UNKNOWN' 
  | 'SOURCE_MISSING' 
  | 'LIKELY_NO_WEBSITE' 
  | 'VERIFIED_NO_WEBSITE' 
  | 'WEBSITE_FOUND';

export interface WebsiteVerification {
  status: WebsiteVerificationStatus;
  url?: string;
  osmChecked: boolean;
  foursquareChecked: boolean;
  searchChecked: boolean;
  googleChecked?: boolean;
  confidence: number;
  reason: string;
}

export interface PublicContacts {
  phone?: string;
  email?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  address?: string;
  openingHours?: string;
}

export interface NicheCategory {
  id: string;
  name: string;
  tier: 'TIER_A' | 'TIER_B';
  osmFilter: { key: string; value: string };
  avgTicketValue: string;
  typicalNeed: string;
}

export interface WebsiteAudit {
  domain: string;
  hasWebsite: boolean;
  hasMobileApp: boolean;
  mobileFriendly: boolean;
  performanceScore: number;
  hasHttps: boolean;
  hasModernUi: boolean;
  hasCta: boolean;
  hasContactForm: boolean;
  hasOnlineBooking: boolean;
  hasOnlineOrdering: boolean;
  techFramework?: string;
  opportunityScore: number;
  issuesDetected: string[];
  aiOpportunityReason: string;
  isLiveAudit?: boolean;
  fcp?: string;
  lcp?: string;
  cls?: string;
  speedIndex?: string;
  seoScore?: number;
  accessibilityScore?: number;
  hasMetaPixel?: boolean;
  hasGtm?: boolean;
  hasGa4?: boolean;
  hasChatbot?: boolean;
  hasCalendly?: boolean;
  faqCount?: number;
  phoneOnlyBooking?: boolean;
  legacyLibraries?: string[];
  securityAudit?: {
    hasTls: boolean;
    hstsEnabled: boolean;
    securityGrade: string;
    missingHeaders: string[];
  };
}

export interface ScoreBreakdown {
  needSignalScore: number;
  businessQualityScore: number;
  websiteProblemsScore: number;
  contactabilityScore: number;
  activitySignalScore: number;
  freshnessScore: number;
  penalties: number;
  totalScore: number;
  temperature: LeadTemperature;
}

export interface ContactInfo {
  personName?: string;
  role?: string;
  email?: string;
  emailValidationStage?: EmailValidationStage;
  phone?: string;
  phoneNormalized?: string;
  phoneCountryCode?: string;
  isPhoneVerified?: boolean;
  hasWhatsapp: boolean;
  linkedinUrl?: string;
  twitterHandle?: string;
}

export interface CompanyInfo {
  name: string;
  industry: string;
  location: string;
  country?: string;
  city?: string;
  lat?: number;
  lon?: number;
  websiteUrl?: string;
  size?: string;
  socialPresence: boolean;
}

export interface IntentSignals {
  hiringIntent?: {
    role: string;
    urgency: string;
    careerKeywords: string[];
  };
  fundingIntent?: {
    round: string;
    amount?: string;
    source: 'SEC_FORM_D' | 'PRODUCT_HUNT' | 'YC';
    filingDate?: string;
  };
  techDebtIntent?: {
    cms: string;
    legacyLibs: string[];
    pageSpeed: number;
    migrationUrgency: 'HIGH' | 'MEDIUM' | 'LOW';
    stalledRepo?: string;
  };
  ecommerceIntent?: {
    platform: string;
    hasPixel: boolean;
    hasGtm: boolean;
    speedScore: number;
    cartIssues?: string[];
  };
  aiAutomationIntent?: {
    hasFaq: boolean;
    hasPhoneBookingOnly: boolean;
    hasChatbot: boolean;
    opportunity: string;
    aiNeedScore: number;
  };
  agencyPartnerIntent?: {
    agencyType: string;
    missingDevCap: boolean;
    whiteLabelScore: number;
    offeredServices?: string[];
  };
  reviewPainIntent?: {
    techComplaintDetected: boolean;
    complaintSummary: string;
    reviewRating?: number;
  };
  securityIntent?: {
    missingTls: boolean;
    missingHeaders: string[];
    sslWarning: boolean;
  };
}

export interface Lead {
  id: string;
  title: string;
  description: string;
  company: CompanyInfo;
  contact: ContactInfo;
  source: SourceType;
  sourceUrl: string;
  projectNeed: ProjectNeedType;
  budgetSignal?: string;
  
  scoreBreakdown: ScoreBreakdown;
  websiteAudit: WebsiteAudit;
  intentSignals?: IntentSignals;
  
  // Local SMB Freelancer Intelligence
  freelancerFitScore?: number;
  freelancerFitTier?: 'PREMIUM_TARGET' | 'GOOD_FIT' | 'MODERATE' | 'SKIP_CHAIN';
  websiteVerification?: WebsiteVerification;
  publicContacts?: PublicContacts;
  
  status: LeadStatus;
  tags: string[];
  notes: string[];
  
  discoveredAt: string;
  postedAt: string;
  freshnessTier: FreshnessTier;
  isExpired: boolean;
  lastVerifiedAt: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  
  outreachHistory: {
    id: string;
    type: 'EMAIL' | 'WHATSAPP';
    pitchText: string;
    sentAt: string;
  }[];
  b2bInfo?: {
    employeeCount?: string;
    estimatedRevenue?: string;
    department?: string;
    decisionLevel: 'FOUNDER_OWNER' | 'C_SUITE' | 'VP_DIRECTOR' | 'MANAGER';
  };
  techStackInfo?: {
    detectedCms: string;
    framework?: string;
    legacyIssues: string[];
    rebuildUrgency: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  fundingInfo?: {
    stage: 'PRE_SEED' | 'SEED' | 'SERIES_A' | 'SERIES_B' | 'BOOTSTRAPPED' | 'PRODUCT_HUNT' | 'Y_COMBINATOR' | 'INDIE_HACKERS' | 'BETALIST';
    amountRaised?: string;
    leadInvestor?: string;
    launchDate?: string;
  };
  registryInfo?: {
    country: string;
    registrationId: string;
    incorporationDate: string;
    companyType: string;
    status: string;
  };
  expoInfo?: {
    expoName: string;
    boothNumber: string;
    expoCity: string;
    expoCountry: string;
    eventDates: string;
    category: string;
  };
  ebookInfo?: {
    bookTitle: string;
    genre: string;
    publicationDate?: string;
    isbn?: string;
    storeUrl?: string;
    platform: 'GOOGLE_BOOKS' | 'OPEN_LIBRARY' | 'GUMROAD' | 'AMAZON';
    coverUrl?: string;
    authorKey?: string;
  };
  swedenVatInfo?: SwedenVatBusinessInfo;
}

export interface SwedenVatBusinessInfo {
  orgNumber: string; // e.g. "556912-3456"
  vatNumber: string; // e.g. "SE556912345601"
  vatStatus: 'REGISTERED' | 'EXEMPT';
  fSkattStatus: 'APPROVED' | 'NOT_APPROVED';
  employerRegistered: boolean;
  companyType: 'Aktiebolag (AB)' | 'Enskild firma' | 'Handelsbolag (HB)' | 'Kommanditbolag (KB)' | 'Företag';
  legalForm?: 'AB' | 'HB' | 'KB' | 'EF' | 'OTHER';
  marketingBlocked?: boolean; // reklamspärr from SCB/Bolagsverket HVD
  revenueSek?: string; // Annual turnover (omsättning)
  profitSek?: string;
  employeeRange?: string;
  municipality: string; // Kommun (e.g. Stockholm, Göteborg, Malmö)
  county: string; // Län
  sniCode?: string; // Swedish Standard Industrial Classification (SNI)
  sniDescription?: string;
  ceoOrContact?: string;
  registeredAddress?: string;
  sourceRegistry: 'Bolagsverket & Skatteverket' | 'Allabolag' | 'EU_VIES' | 'Bolagsverket & SCB (Officiellt HVD)';
  hittaUrl?: string;
  allabolagUrl?: string;
  eniroUrl?: string;
  googleUrl?: string;
}

export interface SourceFilter {
  query?: string;
  sourceType?: SourceType | 'ALL';
  niche?: string;
  minScore?: number;
  temperature?: LeadTemperature | 'ALL';
  freshOnly?: boolean;
}

export interface OsmSearchParams {
  country: string;
  city: string;
  category: string;
  customCategory?: string;
  filterType?: 'ALL' | 'NO_WEBSITE' | 'HAS_WEBSITE_NO_APP';
  limit?: number;
  isNationwide?: boolean;
}

export interface EbookSearchParams {
  genre: 'business' | 'self_help' | 'technology' | 'finance' | 'fitness' | 'fiction' | 'all';
  filterType?: 'ALL' | 'NO_WEBSITE' | 'NEEDS_APP';
  limit?: number;
  searchTerm?: string;
  minPublishYear?: number;
}

export type AppViewMode = 
  | 'sweden_registry'
  | 'dashboard' 
  | 'kanban' 
  | 'table';
