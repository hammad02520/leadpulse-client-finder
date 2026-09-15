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
  | 'SPEED_PERFORMANCE';

export type FreshnessTier = 'JUST_NOW' | 'TODAY' | 'RECENT' | 'STALE_EXPIRED';

export type EmailValidationStage = 
  | 'FOUND' 
  | 'FORMAT_VALID' 
  | 'DOMAIN_VALID' 
  | 'MX_VALID' 
  | 'DELIVERABILITY_CHECK' 
  | 'VERIFIED';

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

export type AppViewMode = 
  | 'dashboard' 
  | 'local_biz' 
  | 'b2b_founders' 
  | 'tech_stack' 
  | 'funded_startups' 
  | 'remote_jobs' 
  | 'global_registries'
  | 'trade_expos'
  | 'ad_hunter'
  | 'kanban' 
  | 'table';
