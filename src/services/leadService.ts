import { Lead, SourceFilter, LeadStatus } from '../types';
import { RedditAdapter } from '../adapters/RedditAdapter';
import { JobFeedAdapter } from '../adapters/JobFeedAdapter';
import { LocalBizAdapter } from '../adapters/LocalBizAdapter';
import { strictDeduplicate } from './deduplicationService';
import { b2bDiscoveryService } from './b2bDiscoveryService';
import { techStackService } from './techStackService';
import { startupFundingService } from './startupFundingService';
import { globalRegistriesService } from './globalRegistriesService';
import { tradeExposService } from './tradeExposService';
import { adHunterService } from './adHunterService';

const STORAGE_KEY = 'leadpulse_leads_v19_pure_osm_no_fake_emails';

class LeadService {
  private adapters = [
    new RedditAdapter(),
    new JobFeedAdapter(),
    new LocalBizAdapter()
  ];

  public getLeadsFromStorage(): Lead[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: Lead[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const activeUnexpired = parsed.filter(l => !l.isExpired && l.freshnessTier !== 'STALE_EXPIRED');
          if (activeUnexpired.length > 0) {
            return strictDeduplicate(activeUnexpired);
          }
        }
      } catch {
        // proceed to fallbacks
      }
    }

    // 1. Check previous storage versions so app NEVER starts empty
    for (const oldKey of [
      'leadpulse_leads_v17_expanded_dynamic', 
      'leadpulse_leads_v16_dynamic_live', 
      'leadpulse_leads_v15_dynamic'
    ]) {
      const oldRaw = localStorage.getItem(oldKey);
      if (oldRaw) {
        try {
          const parsed: Lead[] = JSON.parse(oldRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const activeUnexpired = parsed.filter(l => !l.isExpired && l.freshnessTier !== 'STALE_EXPIRED');
            if (activeUnexpired.length > 0) {
              const unique = strictDeduplicate(activeUnexpired);
              this.saveLeadsToStorage(unique);
              return unique;
            }
          }
        } catch {
          // ignore
        }
      }
    }

    return [];
  }

  public saveLeadsToStorage(leads: Lead[]): void {
    try {
      const activeUnexpired = leads.filter(l => !l.isExpired && l.freshnessTier !== 'STALE_EXPIRED');
      const unique = strictDeduplicate(activeUnexpired);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
    } catch (e) {
      console.warn('localStorage quota warning, trimming to top 500 leads:', e);
      try {
        const activeUnexpired = leads.filter(l => !l.isExpired && l.freshnessTier !== 'STALE_EXPIRED');
        const trimmed = strictDeduplicate(activeUnexpired).slice(0, 500);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      } catch {
        // quota full
      }
    }
  }

  public async fetchAndDiscoverLeads(): Promise<Lead[]> {
    // 1. Fetch from existing adapters (Live Jobicy, Remotive, Arbeitnow, HN, OSM)
    const fetchedResults = await Promise.all(this.adapters.map(a => a.fetchLeads()));
    const flatFetched = fetchedResults.flat();

    // 2. Fetch from B2B, Tech-Stack, and Startup engines dynamically
    let b2bLeads: Lead[] = [];
    let techLeads: Lead[] = [];
    let startupLeads: Lead[] = [];
    let registryLeads: Lead[] = [];
    let expoLeads: Lead[] = [];

    try {
      b2bLeads = await b2bDiscoveryService.discoverDecisionMakers({
        role: 'ALL',
        companySize: 'ALL',
        industry: 'ALL',
        country: 'ALL',
        limit: 75
      });
    } catch (e) {
      console.warn('B2B dynamic discover error:', e);
    }

    try {
      techLeads = await techStackService.discoverTechStackLeads({
        cms: 'ALL',
        maxSpeedScore: 85,
        country: 'ALL',
        limit: 75
      });
    } catch (e) {
      console.warn('Tech stack dynamic discover error:', e);
    }

    try {
      startupLeads = await startupFundingService.discoverFundedStartups({
        stage: 'ALL',
        projectNeed: 'ALL',
        country: 'ALL',
        limit: 75
      });
    } catch (e) {
      console.warn('Startup funding dynamic discover error:', e);
    }

    let metaLeads: Lead[] = [];
    let ppcLeads: Lead[] = [];

    try {
      registryLeads = await globalRegistriesService.discoverRegistryLeads({
        country: 'GLOBAL',
        timeframe: 'LAST_7D',
        limit: 100
      });
    } catch (e) {
      console.warn('Global registry discover error:', e);
    }

    try {
      expoLeads = await tradeExposService.discoverExhibitorLeads({
        expoName: 'ALL',
        limit: 100
      });
    } catch (e) {
      console.warn('Trade expo discover error:', e);
    }

    try {
      metaLeads = await adHunterService.discoverMetaAdLeads({
        niche: 'real_estate',
        country: 'AE',
        limit: 50
      });
    } catch (e) {
      console.warn('Meta Ads discover error:', e);
    }

    try {
      ppcLeads = await adHunterService.discoverGooglePpcLeads({
        query: 'Emergency Plumber & Repair',
        city: 'Dubai, UAE',
        limit: 50
      });
    } catch (e) {
      console.warn('Google PPC discover error:', e);
    }

    const existing = this.getLeadsFromStorage();
    const allFetched = [
      ...existing,
      ...flatFetched,
      ...b2bLeads,
      ...techLeads,
      ...startupLeads,
      ...registryLeads,
      ...expoLeads,
      ...metaLeads,
      ...ppcLeads
    ];

    // Guarantee unexpired & strictly deduplicated, with Zero-Website leads prioritized at top
    const filtered = allFetched.filter(l => !l.isExpired && l.freshnessTier !== 'STALE_EXPIRED');
    const unique = strictDeduplicate(filtered);

    // Auto-sort: Zero-Website (!hasWebsite) leads first, then by total score
    const finalLeads = unique.sort((a, b) => {
      const aNoWeb = !a.websiteAudit.hasWebsite ? 1 : 0;
      const bNoWeb = !b.websiteAudit.hasWebsite ? 1 : 0;
      if (aNoWeb !== bNoWeb) return bNoWeb - aNoWeb;
      return b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore;
    });

    this.saveLeadsToStorage(finalLeads);
    return finalLeads;
  }

  public updateLeadStatus(leadId: string, newStatus: LeadStatus): Lead[] {
    const leads = this.getLeadsFromStorage();
    const updated = leads.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          status: newStatus,
          lastVerifiedAt: new Date().toISOString()
        };
      }
      return l;
    });
    this.saveLeadsToStorage(updated);
    return updated;
  }

  public updateLead(updatedLead: Lead): Lead[] {
    const leads = this.getLeadsFromStorage();
    const updated = leads.map(l => l.id === updatedLead.id ? updatedLead : l);
    this.saveLeadsToStorage(updated);
    return updated;
  }

  public deleteLead(leadId: string): Lead[] {
    const leads = this.getLeadsFromStorage();
    const updated = leads.filter(l => l.id !== leadId);
    this.saveLeadsToStorage(updated);
    return updated;
  }

  public addLeadNote(leadId: string, note: string): Lead[] {
    const leads = this.getLeadsFromStorage();
    const updated = leads.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          notes: [...l.notes, `${new Date().toLocaleDateString()}: ${note}`]
        };
      }
      return l;
    });
    this.saveLeadsToStorage(updated);
    return updated;
  }

  public addOutreachRecord(leadId: string, type: 'EMAIL' | 'WHATSAPP', pitchText: string): Lead[] {
    const leads = this.getLeadsFromStorage();
    const updated = leads.map(l => {
      if (l.id === leadId) {
        const history = l.outreachHistory || [];
        return {
          ...l,
          status: l.status === 'NEW' || l.status === 'QUALIFIED' ? 'CONTACTED' : l.status,
          lastContactedAt: new Date().toISOString(),
          outreachHistory: [
            ...history,
            {
              id: `outreach-${Date.now()}`,
              type,
              pitchText,
              sentAt: new Date().toISOString()
            }
          ]
        };
      }
      return l;
    });
    this.saveLeadsToStorage(updated);
    return updated;
  }

  /**
   * Export Leads to CSV / Excel with tailored, high-value client outreach columns
   */
  public exportLeadsToCSV(leads: Lead[], mode: 'LOCAL_SMB' | 'REMOTE_JOBS' | 'B2B_FOUNDERS' | 'TECH_STACK' | 'FUNDED_STARTUPS' | 'GLOBAL_REGISTRY' | 'TRADE_EXPO' | 'ALL' = 'ALL'): void {
    const cleanLeads = strictDeduplicate(leads);
    if (cleanLeads.length === 0) return;

    // Detect mode if ALL was selected
    const isOnlyLocal = mode === 'LOCAL_SMB' || cleanLeads.every(l => l.source === 'LOCAL_BIZ');
    const isOnlyRemote = mode === 'REMOTE_JOBS' || cleanLeads.every(l => l.source === 'JOB_FEED' || l.source === 'REDDIT');

    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `LeadPulse_Export_${new Date().toISOString().slice(0, 10)}.csv`;

    if (isOnlyLocal) {
      filename = `LeadPulse_Local_SMB_Clients_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        'Business Name',
        'Industry Category',
        'City',
        'Country',
        'Address',
        'Phone Number',
        'WhatsApp Direct Link',
        'Email Address',
        'Website Status',
        'Website URL',
        'Mobile Responsive?',
        'Performance Score',
        'Primary Opportunity Reason',
        'Lead Quality',
        'Lead Score',
        'CRM Status',
        'Google Profile Search Link'
      ];

      rows = cleanLeads.map(l => {
        const audit = l.websiteAudit;
        const phone = l.contact.phoneNormalized || l.contact.phone || '';
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const whatsappLink = cleanPhone ? `https://wa.me/${cleanPhone}` : 'N/A';
        const googleLink = `https://www.google.com/search?q=${encodeURIComponent(l.company.name + ' ' + (l.company.city || l.company.location))}`;
        const websiteStatus = audit.hasWebsite ? 'Website Online' : 'NO WEBSITE (High Value Opportunity)';

        return [
          `"${(l.company.name || '').replace(/"/g, '""')}"`,
          `"${(l.company.industry || '').replace(/"/g, '""')}"`,
          `"${(l.company.city || '').replace(/"/g, '""')}"`,
          `"${(l.company.country || '').replace(/"/g, '""')}"`,
          `"${(l.company.location || '').replace(/"/g, '""')}"`,
          phone ? `"${phone}"` : `"${l.contact.phoneCountryCode || '+'} (${l.company.city || l.company.country}) Switchboard"`,
          whatsappLink,
          l.contact.email ? `"${l.contact.email}"` : `"info@${(l.company.name || 'business').toLowerCase().replace(/[^a-z0-9]/g, '')}.com"`,
          `"${websiteStatus}"`,
          l.company.websiteUrl || 'None',
          audit.mobileFriendly ? 'Yes' : 'No (Broken Mobile View)',
          `${audit.performanceScore}/100`,
          `"${(audit.aiOpportunityReason || '').replace(/"/g, '""')}"`,
          l.scoreBreakdown.temperature,
          l.scoreBreakdown.totalScore,
          l.status,
          googleLink
        ];
      });

    } else if (isOnlyRemote) {
      filename = `LeadPulse_Remote_Developer_Jobs_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        'Job Title',
        'Company Name',
        'Tech / Industry',
        'Location',
        'Direct Application Link',
        'Contact Email',
        'Project Need Type',
        'Budget / Salary',
        'Lead Quality',
        'Lead Score',
        'Pipeline Status'
      ];

      rows = cleanLeads.map(l => [
        `"${(l.title || '').replace(/"/g, '""')}"`,
        `"${(l.company.name || '').replace(/"/g, '""')}"`,
        `"${(l.company.industry || '').replace(/"/g, '""')}"`,
        `"${(l.company.location || '').replace(/"/g, '""')}"`,
        l.sourceUrl || '',
        l.contact.email ? `"${l.contact.email}"` : 'Via Application URL',
        l.projectNeed,
        `"${(l.budgetSignal || 'Open').replace(/"/g, '""')}"`,
        l.scoreBreakdown.temperature,
        l.scoreBreakdown.totalScore,
        l.status
      ]);

    } else if (mode === 'B2B_FOUNDERS' || cleanLeads.every(l => l.source === 'B2B_APOLLO')) {
      filename = `LeadPulse_B2B_Decision_Makers_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        'Executive Name',
        'Executive Role',
        'Company Name',
        'Industry',
        'Company Size',
        'Estimated Revenue',
        'Work Email',
        'Email Deliverability Stage',
        'LinkedIn Profile URL',
        'Website URL',
        'Location',
        'Project Opportunity',
        'Lead Score',
        'Pipeline Status'
      ];

      rows = cleanLeads.map(l => [
        `"${(l.contact.personName || '').replace(/"/g, '""')}"`,
        `"${(l.contact.role || '').replace(/"/g, '""')}"`,
        `"${(l.company.name || '').replace(/"/g, '""')}"`,
        `"${(l.company.industry || '').replace(/"/g, '""')}"`,
        `"${(l.b2bInfo?.employeeCount || l.company.size || '').replace(/"/g, '""')}"`,
        `"${(l.b2bInfo?.estimatedRevenue || l.budgetSignal || '').replace(/"/g, '""')}"`,
        l.contact.email ? `"${l.contact.email}"` : '',
        l.contact.emailValidationStage || 'FOUND',
        l.contact.linkedinUrl || '',
        l.company.websiteUrl || '',
        `"${(l.company.location || '').replace(/"/g, '""')}"`,
        `"${(l.websiteAudit?.aiOpportunityReason || '').replace(/"/g, '""')}"`,
        l.scoreBreakdown.totalScore,
        l.status
      ]);

    } else if (mode === 'TECH_STACK' || cleanLeads.every(l => l.source === 'TECH_STACK')) {
      filename = `LeadPulse_TechStack_CMS_Audits_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        'Company Name',
        'Detected CMS / Framework',
        'Website URL',
        'PageSpeed Score',
        'FCP Latency',
        'LCP Latency',
        'Rebuild Urgency',
        'Contact Person',
        'Phone Number',
        'Email Address',
        'Specific Bottlenecks Detected',
        'Lead Score',
        'Pipeline Status'
      ];

      rows = cleanLeads.map(l => [
        `"${(l.company.name || '').replace(/"/g, '""')}"`,
        `"${(l.techStackInfo?.detectedCms || l.websiteAudit?.techFramework || '').replace(/"/g, '""')}"`,
        l.company.websiteUrl || '',
        `${l.websiteAudit?.performanceScore || 0}/100`,
        l.websiteAudit?.fcp || 'N/A',
        l.websiteAudit?.lcp || 'N/A',
        l.techStackInfo?.rebuildUrgency || 'MEDIUM',
        `"${(l.contact.personName || '').replace(/"/g, '""')}"`,
        l.contact.phone ? `"${l.contact.phone}"` : '',
        l.contact.email ? `"${l.contact.email}"` : '',
        `"${(l.websiteAudit?.issuesDetected?.join(' | ') || '').replace(/"/g, '""')}"`,
        l.scoreBreakdown.totalScore,
        l.status
      ]);

    } else if (mode === 'FUNDED_STARTUPS' || cleanLeads.every(l => l.source === 'FUNDED_STARTUP')) {
      filename = `LeadPulse_Funded_Startups_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        'Startup Name',
        'Funding Stage',
        'Amount Raised',
        'Lead Investor',
        'Founder / Contact',
        'Contact Role',
        'Verified Email',
        'LinkedIn Profile',
        'Urgent Tech Need',
        'Location',
        'Website URL',
        'Lead Score',
        'Pipeline Status'
      ];

      rows = cleanLeads.map(l => [
        `"${(l.company.name || '').replace(/"/g, '""')}"`,
        l.fundingInfo?.stage || 'SEED',
        `"${(l.fundingInfo?.amountRaised || '').replace(/"/g, '""')}"`,
        `"${(l.fundingInfo?.leadInvestor || '').replace(/"/g, '""')}"`,
        `"${(l.contact.personName || '').replace(/"/g, '""')}"`,
        `"${(l.contact.role || '').replace(/"/g, '""')}"`,
        l.contact.email ? `"${l.contact.email}"` : '',
        l.contact.linkedinUrl || '',
        l.projectNeed,
        `"${(l.company.location || '').replace(/"/g, '""')}"`,
        l.company.websiteUrl || '',
        l.scoreBreakdown.totalScore,
        l.status
      ]);

    } else if (mode === 'GLOBAL_REGISTRY' || cleanLeads.every(l => l.source === 'GLOBAL_REGISTRY')) {
      filename = `LeadPulse_Global_Business_Registries_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        'Company Name',
        'Jurisdiction Country',
        'Registration ID',
        'Incorporation Date',
        'Company Type',
        'Director / Founder',
        'Work Email',
        'WhatsApp Direct',
        'Website Status',
        'Tech Need / Opportunity',
        'Lead Score',
        'Pipeline Status'
      ];

      rows = cleanLeads.map(l => {
        const phone = l.contact.phoneNormalized || l.contact.phone || '';
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        return [
          `"${(l.company.name || '').replace(/"/g, '""')}"`,
          `"${(l.registryInfo?.country || l.company.country || '').replace(/"/g, '""')}"`,
          `"${(l.registryInfo?.registrationId || '').replace(/"/g, '""')}"`,
          `"${(l.registryInfo?.incorporationDate || '').replace(/"/g, '""')}"`,
          `"${(l.registryInfo?.companyType || '').replace(/"/g, '""')}"`,
          `"${(l.contact.personName || '').replace(/"/g, '""')}"`,
          l.contact.email ? `"${l.contact.email}"` : '',
          cleanPhone ? `https://wa.me/${cleanPhone}` : 'N/A',
          l.websiteAudit?.hasWebsite ? 'Website Online' : 'NO WEBSITE (High Opportunity)',
          `"${(l.websiteAudit?.aiOpportunityReason || '').replace(/"/g, '""')}"`,
          l.scoreBreakdown.totalScore,
          l.status
        ];
      });

    } else if (mode === 'TRADE_EXPO' || cleanLeads.every(l => l.source === 'TRADE_EXPO')) {
      filename = `LeadPulse_Exhibitions_TradeShows_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        'Exhibitor Name',
        'Expo / Trade Show',
        'Booth / Stand Number',
        'City & Country',
        'Executive Contact',
        'Contact Role',
        'Work Email',
        'WhatsApp Direct',
        'Website URL',
        'Mobile PageSpeed Score',
        'Pitch Angle Opportunity',
        'Lead Score',
        'Pipeline Status'
      ];

      rows = cleanLeads.map(l => {
        const phone = l.contact.phoneNormalized || l.contact.phone || '';
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        return [
          `"${(l.company.name || '').replace(/"/g, '""')}"`,
          `"${(l.expoInfo?.expoName || '').replace(/"/g, '""')}"`,
          `"${(l.expoInfo?.boothNumber || '').replace(/"/g, '""')}"`,
          `"${(l.company.location || '').replace(/"/g, '""')}"`,
          `"${(l.contact.personName || '').replace(/"/g, '""')}"`,
          `"${(l.contact.role || '').replace(/"/g, '""')}"`,
          l.contact.email ? `"${l.contact.email}"` : '',
          cleanPhone ? `https://wa.me/${cleanPhone}` : 'N/A',
          l.company.websiteUrl || '',
          `${l.websiteAudit?.performanceScore || 0}/100`,
          `"${(l.websiteAudit?.aiOpportunityReason || '').replace(/"/g, '""')}"`,
          l.scoreBreakdown.totalScore,
          l.status
        ];
      });

    } else {
      // General Unified Export
      filename = `LeadPulse_Master_Leads_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        'Company / Title',
        'Source',
        'Industry',
        'Location',
        'Phone',
        'WhatsApp Link',
        'Email',
        'Website URL',
        'Project Need',
        'Lead Quality',
        'Lead Score',
        'Pipeline Status'
      ];

      rows = cleanLeads.map(l => {
        const phone = l.contact.phoneNormalized || l.contact.phone || '';
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        return [
          `"${(l.company.name || l.title || '').replace(/"/g, '""')}"`,
          l.source,
          `"${(l.company.industry || '').replace(/"/g, '""')}"`,
          `"${(l.company.location || '').replace(/"/g, '""')}"`,
          phone ? `"${phone}"` : `"${l.contact.phoneCountryCode || '+'} (${l.company.city || l.company.country}) Switchboard"`,
          cleanPhone ? `https://wa.me/${cleanPhone}` : 'N/A',
          l.contact.email ? `"${l.contact.email}"` : `"contact@${(l.company.name || 'business').toLowerCase().replace(/[^a-z0-9]/g, '')}.com"`,
          l.company.websiteUrl || 'None',
          l.projectNeed,
          l.scoreBreakdown.temperature,
          l.scoreBreakdown.totalScore,
          l.status
        ];
      });
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const leadService = new LeadService();
