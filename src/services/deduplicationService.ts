import { Lead } from '../types';

/**
 * Strict Deduplication Engine:
 * Ensures zero duplicate entries across:
 * - Unique ID
 * - Source URL
 * - Domain Name
 * - Company Name + Location/City
 * - Exact Phone Number
 * - Exact Email Address
 */
export function strictDeduplicate(leads: Lead[]): Lead[] {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const seenDomains = new Set<string>();
  const seenNameLocation = new Set<string>();
  const seenPhones = new Set<string>();
  const seenEmails = new Set<string>();

  const uniqueList: Lead[] = [];

  for (const lead of leads) {
    if (!lead || !lead.company) continue;

    // 1. ID Check
    if (lead.id && seenIds.has(lead.id)) continue;

    // 2. Source URL Check
    if (lead.sourceUrl && lead.sourceUrl.trim().length > 5) {
      const cleanUrl = lead.sourceUrl.toLowerCase().trim();
      if (seenUrls.has(cleanUrl)) continue;
      seenUrls.add(cleanUrl);
    }

    // 3. Domain Check
    const domain = lead.company.websiteUrl || lead.websiteAudit?.domain;
    if (domain && domain !== 'none' && domain !== 'No Domain' && domain.length > 3) {
      const cleanDom = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
      if (cleanDom.length > 3 && !cleanDom.includes('openstreetmap.org')) {
        if (seenDomains.has(cleanDom)) continue;
        seenDomains.add(cleanDom);
      }
    }

    // 4. Company Name + City/Location Check
    const nameKey = (lead.company.name || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const cityKey = (lead.company.city || lead.company.location || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const nameCity = `${nameKey}_${cityKey}`;

    if (nameKey.length > 2) {
      if (seenNameLocation.has(nameCity)) continue;
      seenNameLocation.add(nameCity);
    }

    // 5. Phone Check
    const phone = lead.contact?.phoneNormalized || lead.contact?.phone;
    if (phone && phone.trim().length > 6) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length > 6) {
        if (seenPhones.has(cleanPhone)) continue;
        seenPhones.add(cleanPhone);
      }
    }

    // 6. Email Check
    const email = lead.contact?.email;
    if (email && email.trim().length > 4 && !email.startsWith('info@none')) {
      const cleanEmail = email.toLowerCase().trim();
      if (seenEmails.has(cleanEmail)) continue;
      seenEmails.add(cleanEmail);
    }

    if (lead.id) seenIds.add(lead.id);
    uniqueList.push(lead);
  }

  return uniqueList;
}

export function deduplicateLeads(existingLeads: Lead[], newLeads: Lead[]): Lead[] {
  const combined = [...existingLeads, ...newLeads];
  return strictDeduplicate(combined);
}
