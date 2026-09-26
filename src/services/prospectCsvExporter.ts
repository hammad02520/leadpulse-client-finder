import { CommonProspectRecord } from '../types/prospect';

/**
 * Standardized 15-Column Enterprise CSV Exporter
 * Strictly fulfills Section 17 of the Blueprint Specification
 */
export function exportProspectsToCsv(
  records: CommonProspectRecord[], 
  filenamePrefix = 'LeadPulse_NoWebsite_Prospects'
): void {
  if (!records || records.length === 0) {
    alert('No prospect records available to export.');
    return;
  }

  const headers = [
    'Lead ID',
    'Business Name',
    'Category',
    'City / Country',
    'Published Business Phone',
    'Published Business Email',
    'Contact Source URL',
    'Registration / Opening Evidence',
    'Website Status',
    'Social Status',
    'Relevant Profile URLs',
    'Reason Selected',
    'Presence Checked Date',
    'Opportunity Score',
    'Suggested Service'
  ];

  const escapeCsv = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = records.map(r => {
    // 1. Lead ID
    const leadId = r.id;

    // 2. Business Name
    const businessName = r.trading_name || r.legal_name;

    // 3. Category
    const category = r.category;

    // 4. City / Country
    const cityCountry = `${r.city}, ${r.country}`;

    // 5. Published Business Phone
    const phone = r.published_phone || '';

    // 6. Published Business Email
    const email = r.published_email || '';

    // 7. Contact Source URL
    const contactSourceUrl = r.source_url || '';

    // 8. Registration / Opening Evidence
    const regEvidence = r.registration_date 
      ? `UK Companies House Active Reg (${r.registration_date}) - Company #${r.source_record_id}`
      : `Operating Physical Trader location identified via ${r.source_name}`;

    // 9. Website Status (Strict blueprint wording)
    let websiteStatus = 'No independent website found in completed checks';
    if (r.presence.website_status === 'found') {
      websiteStatus = 'Confirmed independent website located';
    } else if (r.presence.website_status === 'uncertain') {
      websiteStatus = 'Presence search uncertain or incomplete';
    }

    // 10. Social Status
    const socialStatus = r.presence.social_status === 'social_found' 
      ? 'Matching business social profile located' 
      : 'No active social profile found';

    // 11. Relevant Profile URLs
    const profileUrls = r.presence.matching_social_urls.length > 0 
      ? r.presence.matching_social_urls.join(' | ') 
      : '';

    // 12. Reason Selected
    const reasonSelected = r.presence.reason_selected || 'Qualified: High service fit and contactable operating business';

    // 13. Presence Checked Date
    const checkedDate = r.presence.search_completed_at 
      ? new Date(r.presence.search_completed_at).toLocaleDateString('en-GB')
      : new Date().toLocaleDateString('en-GB');

    // 14. Opportunity Score
    const oppScore = `${r.score.total_score} / 100`;

    // 15. Suggested Service
    const suggestedService = r.suggested_service || 'Mobile-friendly service website with quote request form & appointment booking';

    return [
      escapeCsv(leadId),
      escapeCsv(businessName),
      escapeCsv(category),
      escapeCsv(cityCountry),
      escapeCsv(phone),
      escapeCsv(email),
      escapeCsv(contactSourceUrl),
      escapeCsv(regEvidence),
      escapeCsv(websiteStatus),
      escapeCsv(socialStatus),
      escapeCsv(profileUrls),
      escapeCsv(reasonSelected),
      escapeCsv(checkedDate),
      escapeCsv(oppScore),
      escapeCsv(suggestedService)
    ].join(',');
  });

  // UTF-8 BOM prefix (\uFEFF) ensures proper rendering in Microsoft Excel on Windows
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
