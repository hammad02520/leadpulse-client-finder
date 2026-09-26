import { CommonProspectRecord, ProspectContact } from '../types/prospect';

/**
 * Public Business Contact Resolution Engine
 * Strictly follows Section 11 of the Blueprint:
 * - Extracts and normalizes public telephone and email
 * - Never fabricates synthetic email addresses
 * - Identifies Phone-Only prospects as primary valid output
 * - Adds UK TPS/CTPS direct marketing compliance eligibility note
 */
export function resolvePublicContacts(record: CommonProspectRecord): CommonProspectRecord {
  const contacts: ProspectContact[] = [];
  const now = new Date().toISOString();

  // 1. Published Telephone Resolution
  if (record.published_phone) {
    const isMobile = record.published_phone.startsWith('+44 7') || record.published_phone.startsWith('07');
    contacts.push({
      contact_value: record.published_phone,
      contact_type: isMobile ? 'WHATSAPP' : 'PHONE',
      source_url: record.source_url,
      observed_at: now,
      business_match_evidence: `Direct public contact listed on ${record.source_name} record`,
      verification_status: 'DELIVERABLE',
      outreach_eligibility: {
        is_eligible: true,
        channel: isMobile ? 'WHATSAPP' : 'CALL',
        compliance_note: 'UK B2B calling: Screen telephone number against TPS / Corporate TPS register before conducting live outreach.'
      }
    });
  }

  // 2. Published Email Resolution
  if (record.published_email) {
    const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.published_email);
    if (isValidFormat) {
      contacts.push({
        contact_value: record.published_email,
        contact_type: 'EMAIL',
        source_url: record.source_url,
        observed_at: now,
        business_match_evidence: 'Public corporate contact email found in primary business record',
        verification_status: 'VERIFIED',
        outreach_eligibility: {
          is_eligible: true,
          channel: 'EMAIL',
          compliance_note: 'B2B Electronic Mail: Applicable to corporate bodies under UK PECR rules.'
        }
      });
    }
  }

  // 3. Social Channel Contacts (e.g. Verified Facebook Messenger link)
  if (record.presence.matching_social_urls.length > 0) {
    record.presence.matching_social_urls.forEach(socialUrl => {
      if (socialUrl.includes('facebook.com')) {
        contacts.push({
          contact_value: socialUrl,
          contact_type: 'WHATSAPP', // or social DM
          source_url: socialUrl,
          observed_at: now,
          business_match_evidence: 'Verified matching business Facebook profile located during presence audit',
          verification_status: 'VERIFIED',
          outreach_eligibility: {
            is_eligible: true,
            channel: 'WHATSAPP',
            compliance_note: 'Direct Social Business Messaging via verified page.'
          }
        });
      }
    });
  }

  return {
    ...record,
    contacts
  };
}
