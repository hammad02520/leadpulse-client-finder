import { WebsiteAudit } from '../types';

export function runWebsiteAudit(domain: string, presetIssues?: Partial<WebsiteAudit>): WebsiteAudit {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const hasWebsite = cleanDomain !== 'none' && cleanDomain.length > 3;

  if (!hasWebsite) {
    return {
      domain: 'No Domain',
      hasWebsite: false,
      hasMobileApp: false,
      mobileFriendly: false,
      performanceScore: 0,
      hasHttps: false,
      hasModernUi: false,
      hasCta: false,
      hasContactForm: false,
      hasOnlineBooking: false,
      hasOnlineOrdering: false,
      techFramework: 'None',
      opportunityScore: 95,
      issuesDetected: [
        'No digital presence or website found',
        'Losing 100% of organic search & mobile traffic',
        'Direct customer booking/contact impossible online'
      ],
      aiOpportunityReason: `This business has zero web presence online. Building a modern, responsive website + Google Business profile would immediately unlock customer acquisition.`
    };
  }

  const mobileFriendly = presetIssues?.mobileFriendly ?? Math.random() > 0.4;
  const performanceScore = presetIssues?.performanceScore ?? Math.floor(Math.random() * 45 + 40); // 40-85
  const hasHttps = presetIssues?.hasHttps ?? Math.random() > 0.2;
  const hasModernUi = presetIssues?.hasModernUi ?? Math.random() > 0.5;
  const hasCta = presetIssues?.hasCta ?? Math.random() > 0.5;
  const hasContactForm = presetIssues?.hasContactForm ?? Math.random() > 0.3;
  const hasMobileApp = presetIssues?.hasMobileApp ?? false;
  const hasOnlineBooking = presetIssues?.hasOnlineBooking ?? Math.random() > 0.6;
  const hasOnlineOrdering = presetIssues?.hasOnlineOrdering ?? Math.random() > 0.6;
  const techFramework = presetIssues?.techFramework ?? (Math.random() > 0.5 ? 'WordPress 6.4' : 'Custom HTML/PHP');

  const issuesDetected: string[] = [];
  if (!mobileFriendly) issuesDetected.push('Mobile Viewport Unoptimized (Text wrapping & overflow)');
  if (performanceScore < 60) issuesDetected.push(`Slow Page Load (${performanceScore}/100 Performance Score)`);
  if (!hasHttps) issuesDetected.push('Missing SSL Certificate (Not Secure Warning)');
  if (!hasModernUi) issuesDetected.push('Outdated Design Layout (Pre-2018 UI elements)');
  if (!hasCta) issuesDetected.push('No Prominent Call-To-Action or Lead Capture');
  if (!hasContactForm) issuesDetected.push('Missing Direct Contact Form / Booking Widget');
  if (!hasOnlineBooking) issuesDetected.push('Missing Online Booking Widget');

  let opportunityScore = 30;
  if (!mobileFriendly) opportunityScore += 25;
  if (performanceScore < 60) opportunityScore += 20;
  if (!hasCta) opportunityScore += 15;
  if (!hasModernUi) opportunityScore += 10;
  opportunityScore = Math.min(99, opportunityScore);

  let aiOpportunityReason = `Website is online at ${cleanDomain}. `;
  if (!mobileFriendly && !hasCta) {
    aiOpportunityReason += `Critical issue: Mobile view is broken and lacks a clear conversion CTA. Redesigning for mobile-first with direct booking widget will dramatically improve lead conversion.`;
  } else if (performanceScore < 60) {
    aiOpportunityReason += `Performance bottleneck: Score is ${performanceScore}/100. Modernizing tech stack (React/Next.js or fast web builder) will drop bounce rate and boost search ranking.`;
  } else if (!hasModernUi) {
    aiOpportunityReason += `UI modernization opportunity: Current layout feels dated compared to competitors. A visual refresh will build trust with potential clients.`;
  } else {
    aiOpportunityReason += `Solid base website, but custom web app / customer portal integration can add high recurring value for their business.`;
  }

  return {
    domain: cleanDomain,
    hasWebsite: true,
    hasMobileApp,
    mobileFriendly,
    performanceScore,
    hasHttps,
    hasModernUi,
    hasCta,
    hasContactForm,
    hasOnlineBooking,
    hasOnlineOrdering,
    techFramework,
    opportunityScore,
    issuesDetected,
    aiOpportunityReason
  };
}
