import { Lead } from '../types';

export function deduplicateLeads(existingLeads: Lead[], newLeads: Lead[]): Lead[] {
  const seenUrls = new Set<string>();
  const seenEmails = new Set<string>();
  const seenDomains = new Set<string>();

  existingLeads.forEach(l => {
    if (l.sourceUrl) seenUrls.add(l.sourceUrl.toLowerCase());
    if (l.contact.email) seenEmails.add(l.contact.email.toLowerCase());
    if (l.websiteAudit.domain && l.websiteAudit.domain !== 'No Domain') {
      seenDomains.add(l.websiteAudit.domain.toLowerCase());
    }
  });

  return newLeads.map(lead => {
    const isUrlDup = lead.sourceUrl && seenUrls.has(lead.sourceUrl.toLowerCase());
    const isEmailDup = lead.contact.email && seenEmails.has(lead.contact.email.toLowerCase());
    const isDomainDup = lead.websiteAudit.domain && lead.websiteAudit.domain !== 'No Domain' && seenDomains.add(lead.websiteAudit.domain.toLowerCase());

    if (isUrlDup || isEmailDup) {
      // Mark as duplicate
      lead.scoreBreakdown.penalties += 30;
      lead.scoreBreakdown.totalScore = Math.max(0, lead.scoreBreakdown.totalScore - 30);
      lead.tags.push('DUPLICATE');
      if (lead.scoreBreakdown.totalScore < 40) {
        lead.scoreBreakdown.temperature = 'IGNORE';
      }
    } else {
      if (lead.sourceUrl) seenUrls.add(lead.sourceUrl.toLowerCase());
      if (lead.contact.email) seenEmails.add(lead.contact.email.toLowerCase());
    }

    return lead;
  });
}
