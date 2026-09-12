import { Lead, SourceFilter, LeadStatus } from '../types';
import { RedditAdapter } from '../adapters/RedditAdapter';
import { JobFeedAdapter } from '../adapters/JobFeedAdapter';
import { LocalBizAdapter } from '../adapters/LocalBizAdapter';
import { deduplicateLeads } from './deduplicationService';

const STORAGE_KEY = 'leadpulse_leads_data_v3'; // Bumping storage key to clear outdated dead links

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
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveLeadsToStorage(leads: Lead[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }

  public async fetchAndDiscoverLeads(): Promise<Lead[]> {
    const fetchedResults = await Promise.all(this.adapters.map(a => a.fetchLeads()));
    const flatFetched = fetchedResults.flat();

    const existing = this.getLeadsFromStorage();
    const deduped = deduplicateLeads(existing, flatFetched);
    
    const existingIds = new Set(existing.map(l => l.id));
    const uniqueNewLeads = deduped.filter(l => !existingIds.has(l.id));

    const combined = [...flatFetched, ...uniqueNewLeads];
    const uniqueMap = new Map<string, Lead>();
    combined.forEach(l => uniqueMap.set(l.id, l));

    const finalLeads = Array.from(uniqueMap.values());
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

  public exportLeadsToCSV(leads: Lead[]): void {
    const headers = [
      'Lead ID',
      'Title',
      'Company Name',
      'Industry',
      'Website',
      'Direct Job Post Link',
      'Contact Person',
      'Email',
      'Phone',
      'WhatsApp',
      'Source',
      'Project Need',
      'Lead Score',
      'Temperature',
      'Status',
      'Budget'
    ];

    const rows = leads.map(l => [
      l.id,
      `"${(l.title || '').replace(/"/g, '""')}"`,
      `"${(l.company.name || '').replace(/"/g, '""')}"`,
      `"${(l.company.industry || '').replace(/"/g, '""')}"`,
      l.company.websiteUrl || '',
      l.sourceUrl || '',
      `"${(l.contact.personName || '').replace(/"/g, '""')}"`,
      l.contact.email || '',
      l.contact.phone || '',
      l.contact.hasWhatsapp ? 'Yes' : 'No',
      l.source,
      l.projectNeed,
      l.scoreBreakdown.totalScore,
      l.scoreBreakdown.temperature,
      l.status,
      `"${(l.budgetSignal || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LeadPulse_Live_Real_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const leadService = new LeadService();
