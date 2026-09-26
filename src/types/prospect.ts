/**
 * New Business & No-Website Prospect Finder
 * Domain Models & Schema Definitions
 * Strictly aligned with Blueprint Specification
 */

export type ProspectCategory = 
  | 'NEW_BUSINESS_NO_WEBSITE'       // Recent registration/opening evidence; presence search completed; prioritize if operating & contactable
  | 'EXISTING_BUSINESS_NO_WEBSITE'  // Operating business; no matching standalone website located; main prospect category
  | 'SOCIAL_ONLY_BUSINESS'          // Matching business social profile found; no standalone website located; separate prospect category
  | 'WEBSITE_EXISTS'                // Confirmed independent website (exclude from no-website campaign)
  | 'PRESENCE_UNCERTAIN';           // Search incomplete, blocked, or identity ambiguous (hold automatically)

export type PresenceStatus = 
  | 'found'                         // Matching independent website confirmed
  | 'not_found_after_checks'        // Configured checks completed without a confirmed website
  | 'uncertain'                     // Conflicting or ambiguous results
  | 'not_checked'                   // Not yet processed
  | 'check_failed';                 // Search or processing failed

export type SocialPresenceStatus =
  | 'social_found'                  // Matching official Facebook, Instagram, or LinkedIn page confirmed
  | 'no_social_found'               // Checks completed without confirmed social profile
  | 'not_checked'
  | 'uncertain';

export type ResultClassification =
  | 'official_business_website'
  | 'official_business_social_profile'
  | 'directory_listing'             // Yell, Yelp, Checkatrade, Bark, Google Maps, etc.
  | 'marketplace_or_booking_profile'
  | 'unrelated'
  | 'uncertain';

export type PipelineSource = 
  | 'OSM_REGIONAL'                  // Pipeline A: OpenStreetMap / Geofabrik regional operating business data
  | 'COMPANIES_HOUSE'               // Pipeline B: Official UK Companies House new company registrations
  | 'MUNICIPAL_LICENCE';            // Pipeline C: Municipal business licensing records (e.g. US City Data)

export type ProspectPool = 
  | 'CANDIDATE'                     // Awaiting presence and contact verification checks
  | 'RESERVE'                       // Passed checks & strict gates, unreleased in reserve
  | 'DELIVERED';                    // Supplied in daily batch / exported to user

export interface ProspectContact {
  contact_value: string;
  contact_type: 'PHONE' | 'EMAIL' | 'WHATSAPP';
  source_url: string;
  observed_at: string;
  business_match_evidence: string;
  verification_status: 'VERIFIED' | 'UNVERIFIED' | 'DELIVERABLE' | 'SUSPECT';
  outreach_eligibility: {
    is_eligible: boolean;
    channel: 'CALL' | 'EMAIL' | 'WHATSAPP';
    compliance_note?: string;      // e.g. "Screen against UK TPS/CTPS before live calling"
  };
}

export interface PresenceCheckStep {
  step_number: number;
  query_used: string;
  purpose: string;
  completed_at: string;
  result_classification: ResultClassification;
  matched_url?: string;
  notes?: string;
}

export interface PresenceEvidence {
  website_status: PresenceStatus;
  social_status: SocialPresenceStatus;
  identity_confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  search_completed_at?: string;
  checks_completed: number;
  checks_failed: number;
  matching_website_url?: string;
  matching_social_urls: string[];
  next_check_at?: string;
  audit_steps: PresenceCheckStep[];
  reason_selected: string;
}

export interface ProspectScore {
  service_fit_score: number;         // Max 25: Industry margin and website impact
  contact_quality_score: number;     // Max 25: Verified phone / email presence
  operation_evidence_score: number;  // Max 20: Verified physical address & trade status
  presence_completeness_score: number;// Max 20: Full 4-step search sequence completed
  recent_opening_score: number;      // Max 10: Supported recent incorporation / opening
  total_score: number;               // Max 100
}

/**
 * Common Unified Record Format
 * Every discovery pipeline converts into this exact canonical schema
 */
export interface CommonProspectRecord {
  id: string;                        // Unique internal UUID
  source_name: PipelineSource;
  source_record_id: string;          // Original source ID (OSM ID, Company Number)
  legal_name: string;                // Registered legal entity name
  trading_name: string;              // Normalized customer-facing business name
  category: string;                  // e.g. "Car Repair", "Cleaning Services", "Landscaping"
  sic_code?: string;                 // UK SIC Code (e.g. "45200" for maintenance & repair of motor vehicles)
  country: string;                   // "UK", "US", etc.
  city: string;                      // City / Region
  address: string;                   // Full standardized postal address
  postcode?: string;
  latitude?: number;
  longitude?: number;
  
  // Normalized contacts
  published_phone?: string;          // E.164 normalized phone (e.g. +44 20 ...)
  published_email?: string;          // Discovered verified public email
  listed_website?: string;           // Initial listed presence if declared in raw source
  
  // Temporal & Provenance signals
  registration_date?: string;        // Official company incorporation date
  licence_date?: string;             // Official municipal licence date
  source_url: string;
  source_updated_at: string;
  imported_at: string;

  // Pipeline lifecycle state
  pool: ProspectPool;
  prospect_category: ProspectCategory;
  contacts: ProspectContact[];
  presence: PresenceEvidence;
  score: ProspectScore;

  // Daily batch metadata
  batch_id?: string;
  delivered_at?: string;
  suggested_service: string;         // "Mobile-friendly website with services, enquiry form & appointment booking"
}

export interface SearchSpendingBudget {
  monthly_credit_allowance: number;  // e.g. $5.00
  cost_per_thousand: number;         // e.g. $5.00 per 1000 searches
  total_searches_run: number;
  estimated_cost_usd: number;
  budget_cap_usd: number;            // e.g. $10.00
  is_cap_reached: boolean;
}

export interface DailyBatchSummary {
  batch_id: string;
  date_string: string;
  delivered_count: number;
  email_ready_count: number;
  call_ready_count: number;
  social_only_count: number;
  no_presence_count: number;
  average_score: number;
  records: CommonProspectRecord[];
}
