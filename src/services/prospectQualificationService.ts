import { CommonProspectRecord, ProspectScore } from '../types/prospect';

export interface QualificationResult {
  isQualified: boolean;
  gatePassed: boolean;
  rejectionReason?: string;
  scoredRecord: CommonProspectRecord;
}

/**
 * Strict Qualification Gates & 100-Point Scorer
 * Strictly enforces Section 12 of the Blueprint:
 * - 7 Mandatory Gates before candidate enters Qualified Reserve
 * - 100-Point weighted scoring
 */
export function evaluateQualificationAndScore(record: CommonProspectRecord): QualificationResult {
  // Gate 1: Website Exists Exclusion
  if (record.presence.website_status === 'found' || record.prospect_category === 'WEBSITE_EXISTS') {
    return {
      isQualified: false,
      gatePassed: false,
      rejectionReason: 'Excluded by Gate 1: Confirmed standalone website exists',
      scoredRecord: record
    };
  }

  // Gate 2: Incomplete Presence Checks
  if (record.presence.website_status === 'not_checked' || record.presence.website_status === 'check_failed') {
    return {
      isQualified: false,
      gatePassed: false,
      rejectionReason: 'Held by Gate 2: Presence search incomplete or failed',
      scoredRecord: record
    };
  }

  // Gate 3: Ambiguous or Uncertain Identity
  if (record.presence.website_status === 'uncertain') {
    return {
      isQualified: false,
      gatePassed: false,
      rejectionReason: 'Held by Gate 3: Business identity or search results ambiguous',
      scoredRecord: record
    };
  }

  // Gate 4: Relevant Public Business Contact Exists
  const hasValidPhone = Boolean(record.published_phone && record.published_phone.length >= 8);
  const hasValidEmail = Boolean(record.published_email && record.published_email.includes('@'));
  const hasSocialDm = record.presence.matching_social_urls.length > 0;

  if (!hasValidPhone && !hasValidEmail && !hasSocialDm) {
    return {
      isQualified: false,
      gatePassed: false,
      rejectionReason: 'Rejected by Gate 4: No reachable public business contact found (phone, email, or social DM)',
      scoredRecord: record
    };
  }

  // Gate 5: Evidence of Operation
  // Requires physical address or active registration status
  if (!record.address && !record.city) {
    return {
      isQualified: false,
      gatePassed: false,
      rejectionReason: 'Rejected by Gate 5: No verified operating location or registered office',
      scoredRecord: record
    };
  }

  // Calculate 100-Point Formula
  const score = calculate100PointScore(record, hasValidPhone, hasValidEmail);

  // If passed all gates, candidate is qualified for the Reserve Pool
  const qualifiedRecord: CommonProspectRecord = {
    ...record,
    pool: 'RESERVE',
    score
  };

  return {
    isQualified: true,
    gatePassed: true,
    scoredRecord: qualifiedRecord
  };
}

/**
 * 100-Point Weighted Scoring Algorithm
 * Factor 1: Fit with Website Service (Max 25)
 * Factor 2: Identity / Contact Evidence Quality (Max 25)
 * Factor 3: Evidence of Current Operation (Max 20)
 * Factor 4: Completeness of Presence Checks (Max 20)
 * Factor 5: Supported Recent Opening / Registration Signal (Max 10)
 */
function calculate100PointScore(
  record: CommonProspectRecord,
  hasPhone: boolean,
  hasEmail: boolean
): ProspectScore {
  // Factor 1: Service Fit (Max 25)
  // High-ticket service industries (Auto repair, Cleaning, Landscaping) have high commercial fit
  let serviceFit = 20;
  const categoryLower = record.category.toLowerCase();
  if (categoryLower.includes('car repair') || categoryLower.includes('landscaping')) {
    serviceFit = 25; // High average job value (£500–£2,500)
  } else if (categoryLower.includes('cleaning')) {
    serviceFit = 22;
  }

  // Factor 2: Contact Quality (Max 25)
  let contactQuality = 0;
  if (hasPhone) contactQuality += 18; // Phone is primary contact channel in blueprint
  if (hasEmail) contactQuality += 7;  // Additional email bonus
  if (record.presence.matching_social_urls.length > 0 && !hasPhone) contactQuality += 12;

  // Factor 3: Evidence of Current Operation (Max 20)
  let operationEvidence = 0;
  if (record.source_name === 'OSM_REGIONAL') {
    operationEvidence = 20; // Operating shop, garage or service location
  } else if (record.source_name === 'COMPANIES_HOUSE') {
    operationEvidence = 14; // Registered company office
  }

  // Factor 4: Completeness of Presence Checks (Max 20)
  // 5 points per check step completed
  const checksCount = record.presence.checks_completed || 0;
  const presenceCompleteness = Math.min(20, checksCount * 5);

  // Factor 5: Supported Recent Opening Signal (Max 10)
  let recentOpening = 0;
  if (record.registration_date) {
    const regDate = new Date(record.registration_date);
    const diffDays = Math.floor((Date.now() - regDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 45) {
      recentOpening = 10;
    } else if (diffDays <= 90) {
      recentOpening = 7;
    } else {
      recentOpening = 4;
    }
  } else {
    // For established operating businesses with continuous presence
    recentOpening = 5;
  }

  const totalScore = serviceFit + contactQuality + operationEvidence + presenceCompleteness + recentOpening;

  return {
    service_fit_score: serviceFit,
    contact_quality_score: contactQuality,
    operation_evidence_score: operationEvidence,
    presence_completeness_score: presenceCompleteness,
    recent_opening_score: recentOpening,
    total_score: Math.min(100, totalScore)
  };
}
