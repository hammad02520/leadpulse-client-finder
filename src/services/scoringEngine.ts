import { ScoreBreakdown, LeadTemperature, WebsiteAudit, FreshnessTier } from '../types';

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
}): ScoreBreakdown {
  let needSignalScore = 0;
  let businessQualityScore = 0;
  let websiteProblemsScore = 0;
  let contactabilityScore = 0;
  let activitySignalScore = 0;
  let freshnessScore = 0;
  let penalties = 0;

  // 1. Need Signal (+30)
  if (data.hasExplicitHiringSignal) {
    needSignalScore = 30;
  } else {
    penalties += 15;
  }

  // 2. Business Quality (+10)
  if (data.hasBusinessQuality) {
    businessQualityScore = 10;
  }

  // 3. Website Audit Problems (+15 to +30)
  if (data.websiteAudit.hasWebsite) {
    if (!data.websiteAudit.mobileFriendly) websiteProblemsScore += 15;
    if (data.websiteAudit.performanceScore < 60) websiteProblemsScore += 15;
    if (!data.websiteAudit.hasCta) websiteProblemsScore += 10;
  } else {
    websiteProblemsScore = 25;
  }
  websiteProblemsScore = Math.min(30, websiteProblemsScore);

  // 4. Contactability (+10 Email, +10 WhatsApp)
  if (data.hasEmail) contactabilityScore += 10;
  if (data.hasWhatsapp) contactabilityScore += 10;

  // 5. Freshness Score Signal (+15 to +0)
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
