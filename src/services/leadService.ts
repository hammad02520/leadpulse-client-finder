import { Lead, SourceFilter, LeadStatus } from '../types';
import { RedditAdapter } from '../adapters/RedditAdapter';
import { JobFeedAdapter } from '../adapters/JobFeedAdapter';
import { LocalBizAdapter } from '../adapters/LocalBizAdapter';
import { strictDeduplicate } from './deduplicationService';

const STORAGE_KEY = 'leadpulse_leads_data_v10_clean';

class LeadService {
  private adapters = [
    new RedditAdapter(),
    new JobFeedAdapter(),
    new LocalBizAdapter()
  ];

  public getLeadsFromStorage(): Lead[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed: Lead[] = JSON.parse(raw);
      // Always guarantee strict uniqueness
      return strictDeduplicate(parsed);
    } catch {
      return [];
    }
  }

  public saveLeadsToStorage(leads: Lead[]): void {
    const unique = strictDeduplicate(leads);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  }

  public async fetchAndDiscoverLeads(): Promise<Lead[]> {
    const fetchedResults = await Promise.all(this.adapters.map(a => a.fetchLeads()));
    const flatFetched = fetchedResults.flat();

    const existing = this.getLeadsFromStorage();
    const finalLeads = strictDeduplicate([...flatFetched, ...existing]);

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
  public exportLeadsToCSV(leads: Lead[], mode: 'LOCAL_SMB' | 'REMOTE_JOBS' | 'ALL' = 'ALL'): void {
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
          phone ? `"${phone}"` : 'Not Listed on OSM',
          whatsappLink,
          l.contact.email ? `"${l.contact.email}"` : 'Not Listed on OSM',
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
          phone ? `"${phone}"` : 'Not Listed',
          cleanPhone ? `https://wa.me/${cleanPhone}` : 'N/A',
          l.contact.email ? `"${l.contact.email}"` : 'Not Listed',
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
