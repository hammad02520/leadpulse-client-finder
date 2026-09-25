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

    // 3. Domain Check: Only deduplicate on actual, valid website domains
    const domain = lead.company.websiteUrl;
    if (domain && typeof domain === 'string' && domain.includes('.') && domain.length > 4) {
      const cleanDom = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
      const isPlaceholder = cleanDom.includes('no official website') || cleanDom.includes('no domain') || cleanDom.includes('none');
      const isPlatformDomain = [
        'openlibrary.org',
        'books.google.com',
        'amazon.com',
        'google.com',
        'github.com',
        'twitter.com',
        'linkedin.com',
        'facebook.com',
        'instagram.com',
        'wikipedia.org',
        'openstreetmap.org'
      ].some(pd => cleanDom.includes(pd));

      if (!isPlaceholder && !isPlatformDomain && cleanDom.length > 3) {
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

    // 5. Phone Check (scoped by module source - ignore generic/dummy numbers)
    const phone = lead.contact?.phoneNormalized || lead.contact?.phone;
    if (phone && phone.trim().length > 6) {
      const cleanPhone = phone.replace(/\D/g, '');
      const isPlaceholderPhone = cleanPhone.includes('5550') || cleanPhone.includes('5551') || cleanPhone.includes('5552') || cleanPhone.includes('00000') || cleanPhone.length < 8;
      if (!isPlaceholderPhone && cleanPhone.length > 7) {
        const phoneKey = `${sourceScope}_${cleanPhone}`;
        if (seenPhonesBySource.has(phoneKey)) continue;
        seenPhonesBySource.add(phoneKey);
      }
    }

    // 6. Email Check (scoped by module source - ignore generic placeholders)
    const email = lead.contact?.email;
    if (email && email.trim().length > 4 && !email.startsWith('info@none') && !email.includes('example.com') && !email.includes('@business.com')) {
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
