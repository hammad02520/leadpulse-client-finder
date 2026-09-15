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

  // Source-Specific Tailored Pitch Strategies
  if (lead.source === 'B2B_APOLLO' && lead.b2bInfo) {
    emailSubject = `Quick thought on ${companyName}'s product development & engineering bandwidth`;
    problemObserved = `I came across your profile as ${lead.contact.role || 'Executive'} at ${companyName}. At your current scale (${lead.b2bInfo.employeeCount} team, ${lead.b2bInfo.estimatedRevenue || 'growing ARR'}), keeping engineering velocity high without accumulating technical debt is often a delicate balance.`;
    solutionProposed = `I partner with fast-moving founders as a senior fullstack contractor, shipping high-impact web apps, customer dashboards, and API integrations with zero hand-holding.`;
    cta = `Would you have 10 minutes for a quick intro call this Tuesday or Thursday?`;
  } else if (lead.source === 'FUNDED_STARTUP' && lead.fundingInfo) {
    emailSubject = `Congrats on ${companyName}'s ${lead.fundingInfo.stage} round + engineering velocity`;
    problemObserved = `Saw the exciting news about ${companyName} raising ${lead.fundingInfo.amountRaised || 'fresh capital'} backed by ${lead.fundingInfo.leadInvestor || 'top investors'}. Scaling the product quickly to hit post-raise milestones is crucial right now.`;
    solutionProposed = `I build scalable SaaS MVPs, responsive frontend apps (Next.js/React), and cross-platform mobile apps (React Native/Flutter) that help venture-backed startups ship features in days instead of months.`;
    cta = `Happy to share a 2-minute Loom walkthrough of relevant apps I've built if you're open to it.`;
  } else if (lead.source === 'TECH_STACK' && lead.techStackInfo) {
    emailSubject = `Speed & conversion bottleneck observed on ${audit.domain || companyName}`;
    problemObserved = `I noticed ${companyName}'s website is running on ${lead.techStackInfo.detectedCms}. A quick Lighthouse diagnostic revealed a mobile performance score of ${audit.performanceScore}/100 with ${audit.fcp || 'high'} First Contentful Paint latency, which directly damages search ranking and paid ad conversion.`;
    solutionProposed = `I specialize in migrating legacy ${lead.techStackInfo.detectedCms.split(' ')[0]} sites to modern, ultra-fast Next.js architecture — achieving 95+ Google Lighthouse scores, instant sub-second page loads, and seamless mobile conversion.`;
    cta = `Can I send you a free 3-minute video breakdown of the specific bottlenecks hurting your site's load speed?`;
  } else if (projectNeed === 'WEB_REDESIGN' || !audit.mobileFriendly || !audit.hasModernUi || !audit.hasWebsite || lead.source === 'LOCAL_BIZ') {
    emailSubject = !audit.hasWebsite 
      ? `Quick thought on ${companyName}'s local web presence & competitor edge`
      : `Quick thought on ${companyName}'s digital experience & mobile conversion`;
    
    if (!audit.hasWebsite) {
      problemObserved = `I came across ${companyName} on Google Maps and saw you have a strong local reputation. However, I noticed you don't have an official website linked yet. Your local competitors already have websites, which means customers searching online are finding and contacting them first.`;
      solutionProposed = `I specialize in building sleek, high-converting 1-page websites & mobile booking portals for local businesses — equipped with direct WhatsApp chat & tap-to-call buttons to turn local searchers into immediate paying clients.`;
      cta = `Can I share a quick 2-minute visual preview of a custom site layout designed for ${companyName}?`;
    } else if (!audit.mobileFriendly) {
      problemObserved = `While checking out ${companyName} (${audit.domain}), I noticed that the mobile layout currently has viewport overflow issues and lacks an easy tap-to-action CTA for phone users.`;
      solutionProposed = `As a Fullstack Developer, I help businesses transform their existing site into a lightning-fast, mobile-first web app that turns visitors into paying clients.`;
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

  // WhatsApp Short Draft (High-converting competitor pitch for local SMBs)
  const isNoWebsite = !audit.hasWebsite || projectNeed === 'NO_WEBSITE_NO_APP';
  const shortWhatsapp = isNoWebsite
    ? `Hi ${personName}! Maine dekha aapka business ${companyName} Maps pe active hai par official website nahi hai. Aapke competitors ke paas website hai jisse customers unhe pehle dhoondh lete hain. Main ${companyName} ke liye fast, professional site bana sakta hoon jisse direct WhatsApp leads aayen. 2-min preview share karoon?`
    : `Hi ${personName}, I saw ${companyName}'s business and noticed a quick opportunity to boost your mobile web conversion (${audit.domain || 'website'}). Would love to share a short 2-min demo if you're open to it!`;

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
