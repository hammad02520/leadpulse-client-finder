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
  | 'TWITTER' 
  | 'MANUAL_IMPORT';

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
  opportunityScore: number;
  issuesDetected: string[];
  aiOpportunityReason: string;
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
  phone?: string;
  hasWhatsapp: boolean;
  linkedinUrl?: string;
  twitterHandle?: string;
}

export interface CompanyInfo {
  name: string;
  industry: string;
  location: string;
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
}

export interface SourceFilter {
  query?: string;
  sourceType?: SourceType | 'ALL';
  niche?: string;
  minScore?: number;
  temperature?: LeadTemperature | 'ALL';
  freshOnly?: boolean;
}
