import { Lead } from '../types';

export interface AIPitchResult {
  emailSubject: string;
  emailBody: string;
  whatsappMessage: string;
  whatsappUrl: string;
  angleTitle: string;
}

export function generateAIPitch(lead: Lead): AIPitchResult {
  const companyName = lead.company.name || 'there';
  const personName = lead.contact.personName && !lead.contact.personName.includes('Owner') 
    ? lead.contact.personName 
    : 'there';
  const city = lead.company.city || lead.company.location || 'your area';
  const industry = lead.company.industry || 'service';
  const hasSocial = Boolean(lead.publicContacts?.facebook || lead.publicContacts?.instagram || lead.company.socialPresence);
  const isVerifiedNoWebsite = lead.websiteVerification?.status === 'VERIFIED_NO_WEBSITE' || !lead.websiteAudit.hasWebsite;

  let angleTitle = 'Local Business Website Offer';
  let emailSubject = '';
  let opening = `Hi ${personName},`;
  let problemObserved = '';
  let solutionProposed = '';
  let cta = `Would you be open to a quick 2-minute mockup preview I made for ${companyName}?`;
  let shortWhatsapp = '';

  // ANGLE 1: Verified No Official Website (Primary Angle)
  if (isVerifiedNoWebsite && !hasSocial) {
    angleTitle = 'Missing Website & Local Search Lead Capture';
    emailSubject = `Quick thought on ${companyName}'s local visibility in ${city}`;
    problemObserved = `I was researching reliable ${industry.toLowerCase()} services in ${city} and saw ${companyName} has a great local reputation. However, when local homeowners and clients search on Google for ${industry.toLowerCase()} in ${city}, you don't have an official website listed. Right now, competitor businesses with websites are taking 60-80% of direct phone inquiries and emergency calls.`;
    solutionProposed = `I help local trades & independent businesses launch fast, professional 5-page websites in under 48 hours — complete with click-to-call buttons, instant WhatsApp chat, and Google Business integration so local customers call you first.`;
    cta = `Can I send you a 60-second video mockup of how a custom site for ${companyName} would look? No obligation at all.`;
    shortWhatsapp = `Hi ${personName}! Saw ${companyName} offers great ${industry.toLowerCase()} work in ${city}, but you don't have an official website listed on Google yet. Competitors with websites are taking most local search calls. I build fast, high-converting sites for local trades in 48h. Can I send a quick 60-sec preview for ${companyName}?`;
  }
  // ANGLE 2: Social-Only Business (Active on Facebook/Instagram, but missing standalone website)
  else if (isVerifiedNoWebsite && hasSocial) {
    angleTitle = 'Social-to-Website Conversion Upgrade';
    emailSubject = `Turning ${companyName}'s social followers into direct bookings in ${city}`;
    problemObserved = `I came across your active social page for ${companyName} and really like your work! However, a lot of local clients searching for urgent ${industry.toLowerCase()} in ${city} search Google rather than social media, and without an official website domain, you're missing out on high-intent local calls every single week.`;
    solutionProposed = `I can build an official website for ${companyName} that links seamlessly with your social pages, showcases your photos and customer reviews, and lets local clients book quotes directly on WhatsApp.`;
    cta = `Would you be open to a quick 2-minute preview of a design that matches your social brand?`;
    shortWhatsapp = `Hi ${personName}! Love your work on social for ${companyName}. Noticed you don't have an official website domain yet for local ${city} customers searching Google. I can build a clean site that links to your social page & brings direct WhatsApp booking. Can I share a quick 1-min preview?`;
  }
  // ANGLE 3: Existing Website needs Mobile & Speed Redesign
  else {
    angleTitle = 'Mobile Booking & Speed Upgrade';
    emailSubject = `Improving mobile customer conversion for ${companyName}`;
    problemObserved = `While checking out ${companyName} online, I noticed the website takes over 3 seconds to load on mobile phones and doesn't have an instant click-to-WhatsApp quote button. Over 75% of local service searchers are on mobile phones, and even a small friction causes them to bounce to another provider.`;
    solutionProposed = `I upgrade local service websites to ultra-fast, mobile-friendly landing pages that load instantly and feature prominent tap-to-call and WhatsApp quote buttons.`;
    cta = `Can I share a quick 2-minute diagnostic showing where customers might be dropping off on mobile?`;
    shortWhatsapp = `Hi ${personName}, I checked out ${companyName}'s website and noticed a quick opportunity to boost your mobile call inquiries with an instant WhatsApp quote button. Would love to share a short 60-second demo if you're open to it!`;
  }

  const emailBody = `${opening}

${problemObserved}

${solutionProposed}

${cta}

Best regards,
Independent Web & Digital Specialist
Portfolio: [Your Portfolio Link]
Phone/WhatsApp: [Your Phone]`;

  const phoneClean = lead.contact.phone ? lead.contact.phone.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = phoneClean 
    ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(shortWhatsapp)}`
    : `https://wa.me/?text=${encodeURIComponent(shortWhatsapp)}`;

  return {
    emailSubject,
    emailBody,
    whatsappMessage: shortWhatsapp,
    whatsappUrl,
    angleTitle
  };
}
