import { ScoreBreakdown, LeadTemperature, WebsiteAudit, FreshnessTier, IntentSignals } from '../types';

export function calculateLeadScore(data: {
  hasExplicitHiringSignal: boolean;
  hasBusinessQuality: boolean;
  websiteAudit: WebsiteAudit;
  hasEmail: boolean;
  hasWhatsapp: boolean;
  hasSocialPresence: boolean;
  freshnessTier: FreshnessTier;
  isExpired: boolean;
  isDuplicate?: boolean;
  outreachCount?: number;
  intentSignals?: IntentSignals;
}): ScoreBreakdown {
  let needSignalScore = 0;
  let businessQualityScore = 0;
  let websiteProblemsScore = 0;
  let contactabilityScore = 0;
  let activitySignalScore = 0;
  let freshnessScore = 0;
  let penalties = 0;

  // 1. Need Signal (+20 to +35 based on intent vectors)
  const intents = data.intentSignals;
  if (data.hasExplicitHiringSignal || intents?.hiringIntent) {
    needSignalScore = 30;
  } else if (intents?.aiAutomationIntent && intents.aiAutomationIntent.aiNeedScore > 70) {
    needSignalScore = 32;
  } else if (intents?.agencyPartnerIntent && intents.agencyPartnerIntent.missingDevCap) {
    needSignalScore = 30;
  } else if (intents?.ecommerceIntent && intents.ecommerceIntent.hasPixel && intents.ecommerceIntent.speedScore < 50) {
    needSignalScore = 32;
  } else if (intents?.fundingIntent) {
    needSignalScore = 28;
  } else if (intents?.techDebtIntent && intents.techDebtIntent.migrationUrgency === 'HIGH') {
    needSignalScore = 28;
  } else if (intents?.reviewPainIntent && intents.reviewPainIntent.techComplaintDetected) {
    needSignalScore = 26;
  } else {
    // General baseline
    needSignalScore = 15;
  }

  // 2. Business Quality (+10)
  if (data.hasBusinessQuality) {
    businessQualityScore = 10;
  }

  // 3. Website Audit Problems (+15 to +30)
  if (data.websiteAudit.hasWebsite) {
    if (!data.websiteAudit.mobileFriendly) websiteProblemsScore += 10;
    if (data.websiteAudit.performanceScore < 60) websiteProblemsScore += 12;
    if (!data.websiteAudit.hasCta) websiteProblemsScore += 8;
    if (data.websiteAudit.hasMetaPixel && data.websiteAudit.performanceScore < 50) websiteProblemsScore += 10;
    if (data.websiteAudit.legacyLibraries && data.websiteAudit.legacyLibraries.length > 0) websiteProblemsScore += 8;
  } else {
    websiteProblemsScore = 25;
  }
  websiteProblemsScore = Math.min(30, websiteProblemsScore);

  // 4. Contactability (+10 Email, +10 WhatsApp)
  if (data.hasEmail) contactabilityScore += 10;
  if (data.hasWhatsapp) contactabilityScore += 10;

  // 5. Activity Signal Score (+0 to +10)
  if (data.outreachCount && data.outreachCount > 0) {
    activitySignalScore = Math.min(10, data.outreachCount * 3);
  }

  // 6. Freshness Score Signal (+15 to +0)
  if (data.freshnessTier === 'JUST_NOW') freshnessScore = 15;
  else if (data.freshnessTier === 'TODAY') freshnessScore = 10;
  else if (data.freshnessTier === 'RECENT') freshnessScore = 5;
  else freshnessScore = 0;

  // Penalties
  if (data.isExpired) {
    penalties += 25; // Expired / Stale penalty (-25)
  }
  if (data.isDuplicate) {
    penalties += 30; // Duplicate penalty (-30)
  }

  const rawTotal = 
    needSignalScore + 
    businessQualityScore + 
    websiteProblemsScore + 
    contactabilityScore + 
    activitySignalScore +
    freshnessScore - 
    penalties;

  const totalScore = Math.max(0, Math.min(100, rawTotal));

  let temperature: LeadTemperature = 'IGNORE';
  if (totalScore >= 80) temperature = 'HOT';
  else if (totalScore >= 60) temperature = 'WARM';
  else if (totalScore >= 40) temperature = 'COLD';
  else temperature = 'IGNORE';

  return {
    needSignalScore,
    businessQualityScore,
    websiteProblemsScore,
    contactabilityScore,
    activitySignalScore,
    freshnessScore,
    penalties,
    totalScore,
    temperature,
  };
}
