import { Lead } from '../types';

export interface AIPitchResult {
  emailSubject: string;
  emailBody: string;
  whatsappMessage: string;
  whatsappUrl: string;
}

export function generateAIPitch(lead: Lead): AIPitchResult {
  const companyName = lead.company.name || 'there';
  const personName = lead.contact.personName || 'Team';
  const audit = lead.websiteAudit;
  const projectNeed = lead.projectNeed;

  let emailSubject = '';
  let opening = `Hi ${personName},`;
  let problemObserved = '';
  let solutionProposed = '';
  let cta = `Would you be open to a 10-minute quick chat or short video walkthrough this week?`;

  // Build Truthful Pitch based on Audit Signals & Need
  if (projectNeed === 'WEB_REDESIGN' || !audit.mobileFriendly || !audit.hasModernUi) {
    emailSubject = `Quick thought on ${companyName}'s digital experience & mobile conversion`;
    
    if (audit.hasWebsite && !audit.mobileFriendly) {
      problemObserved = `While checking out ${companyName} (${audit.domain}), I noticed that the mobile layout currently has viewport overflow issues and lacks an easy tap-to-action CTA for phone users.`;
      solutionProposed = `As a Fullstack Developer, I help businesses transform their existing site into a lightning-fast, mobile-first web app that turns visitors into paying clients.`;
    } else if (!audit.hasWebsite) {
      problemObserved = `I noticed ${companyName} currently doesn't have an active website or online booking portal, which means potential customers searching for your services online might be going to competitors.`;
      solutionProposed = `I specialize in building sleek, high-converting websites and mobile web apps that establish immediate credibility and drive direct client inquiries.`;
    } else {
      problemObserved = `I came across ${companyName} and saw a strong opportunity to modernize the web UI and streamline your customer booking flow.`;
      solutionProposed = `I build modern, high-performance web applications using React/Next.js and clean responsive UI design.`;
    }
  } else if (projectNeed === 'MOBILE_APP') {
    emailSubject = `Mobile App idea for ${companyName}`;
    problemObserved = `I reviewed ${companyName}'s offerings and noticed your clients would benefit hugely from a dedicated iOS & Android mobile app (or PWA) for instant push notifications and streamlined services.`;
    solutionProposed = `I engineer cross-platform mobile apps (React Native / Flutter) that deliver native speed and seamless user experience on both iOS and Android.`;
  } else if (projectNeed === 'SAAS_MVP') {
    emailSubject = `Fullstack Web & API engineering for ${companyName}'s MVP`;
    problemObserved = `I saw your post regarding needing a fullstack developer to build out the MVP platform for ${companyName}.`;
    solutionProposed = `I build scalable SaaS MVPs from scratch — handling backend API architecture, database design, secure authentication, Stripe payments, and clean dashboard UI.`;
  } else if (projectNeed === 'SPEED_PERFORMANCE' || audit.performanceScore < 60) {
    emailSubject = `Performance bottleneck analysis for ${companyName}`;
    problemObserved = `I ran a quick performance scan on ${audit.domain} and observed a Google Lighthouse performance score of ${audit.performanceScore}/100, which is likely impacting search ranking and bounce rate.`;
    solutionProposed = `I optimize web architecture to achieve 90+ Lighthouse performance scores, instant page loads, and smooth mobile UX.`;
  } else {
    emailSubject = `Fullstack Web/App development for ${companyName}`;
    problemObserved = `I saw your post on ${lead.source} regarding ${lead.title}.`;
    solutionProposed = `I am a fullstack web and mobile application developer experienced in building modern, scalable digital products tailored to business goals.`;
  }

  const emailBody = `${opening}

${problemObserved}

${solutionProposed}

${lead.description ? `Re: "${lead.description.slice(0, 150)}..."` : ''}

${cta}

Best regards,
Fullstack Web & App Developer
Portfolio / GitHub`;

  // WhatsApp Short Draft (Encoded)
  const shortWhatsapp = `Hi ${personName}, I saw ${companyName}'s business and noticed a quick opportunity to boost your mobile web conversion (${audit.domain || 'website'}). Would love to share a short 2-min demo if you're open to it!`;

  const phoneClean = lead.contact.phone ? lead.contact.phone.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = phoneClean 
    ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(shortWhatsapp)}`
    : `https://wa.me/?text=${encodeURIComponent(shortWhatsapp)}`;

  return {
    emailSubject,
    emailBody,
    whatsappMessage: shortWhatsapp,
    whatsappUrl
  };
}
