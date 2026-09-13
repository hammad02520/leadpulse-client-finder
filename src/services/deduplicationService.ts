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
  const seenDomainsBySource = new Set<string>();
  const seenNameLocationBySource = new Set<string>();
  const seenPhonesBySource = new Set<string>();
  const seenEmailsBySource = new Set<string>();

  const uniqueList: Lead[] = [];

  for (const lead of leads) {
    if (!lead || !lead.company) continue;

    // 1. Global ID Check
    if (lead.id && seenIds.has(lead.id)) continue;

    const sourceScope = lead.source || 'GLOBAL';

    // 2. Source URL Check (within same module)
    if (lead.sourceUrl && lead.sourceUrl.trim().length > 5) {
      const cleanUrl = `${sourceScope}_${lead.sourceUrl.toLowerCase().trim()}`;
      if (seenUrls.has(cleanUrl)) continue;
      seenUrls.add(cleanUrl);
    }

    // 3. Domain Check (scoped by module source so a job posting doesn't block B2B or TechStack)
    const domain = lead.company.websiteUrl || lead.websiteAudit?.domain;
    if (domain && domain !== 'none' && domain !== 'No Domain' && domain.length > 3) {
      const cleanDom = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
      if (cleanDom.length > 3 && !cleanDom.includes('openstreetmap.org')) {
        const domKey = `${sourceScope}_${cleanDom}`;
        if (seenDomainsBySource.has(domKey)) continue;
        seenDomainsBySource.add(domKey);
      }
    }

    // 4. Company Name + City/Location Check (scoped by module source)
    const nameKey = (lead.company.name || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const cityKey = (lead.company.city || lead.company.location || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const nameCity = `${sourceScope}_${nameKey}_${cityKey}`;

    if (nameKey.length > 2) {
      if (seenNameLocationBySource.has(nameCity)) continue;
      seenNameLocationBySource.add(nameCity);
    }

    // 5. Phone Check (scoped by module source)
    const phone = lead.contact?.phoneNormalized || lead.contact?.phone;
    if (phone && phone.trim().length > 6) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length > 6) {
        const phoneKey = `${sourceScope}_${cleanPhone}`;
        if (seenPhonesBySource.has(phoneKey)) continue;
        seenPhonesBySource.add(phoneKey);
      }
    }

    // 6. Email Check (scoped by module source)
    const email = lead.contact?.email;
    if (email && email.trim().length > 4 && !email.startsWith('info@none')) {
      const cleanEmail = `${sourceScope}_${email.toLowerCase().trim()}`;
      if (seenEmailsBySource.has(cleanEmail)) continue;
      seenEmailsBySource.add(cleanEmail);
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
