import { Lead, LeadStatus } from '../types';
import { strictDeduplicate } from './deduplicationService';
import { localSmbDiscoveryService } from './localSmbDiscoveryService';
import { swedenRegistryService } from './swedenRegistryService';

const STORAGE_KEY = 'leadpulse_sweden_vat_leads_v1';

class LeadService {
  public clearAllStorage(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('leadpulse_smb_verified_leads_v5');
    localStorage.removeItem('leadpulse_smb_verified_leads_v4');
    localStorage.removeItem('leadpulse_smb_verified_leads_v3');
    localStorage.removeItem('leadpulse_smb_verified_leads_v2');
  }

  public getLeadsFromStorage(): Lead[] {
    // Purge old mock storage versions if present
    localStorage.removeItem('leadpulse_smb_verified_leads_v5');
    localStorage.removeItem('leadpulse_smb_verified_leads_v4');
    localStorage.removeItem('leadpulse_smb_verified_leads_v3');
    localStorage.removeItem('leadpulse_smb_verified_leads_v2');

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: Lead[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validRealLeads = parsed.filter(l => 
            !l.isExpired && 
            Boolean(l.contact?.phone && l.contact.phone.trim().length > 5)
          );
          if (validRealLeads.length > 0) {
            return strictDeduplicate(validRealLeads);
          }
        }
      } catch {
        // proceed
      }
    }
    return [];
  }

  public saveLeadsToStorage(leads: Lead[]): void {
    try {
      const activeUnexpired = leads.filter(l => !l.isExpired);
      const unique = strictDeduplicate(activeUnexpired);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
    } catch (e) {
      console.warn('localStorage quota limit, trimming:', e);
      try {
        const trimmed = strictDeduplicate(leads).slice(0, 300);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      } catch {
        // ignore
      }
    }
  }

  public async fetchAndDiscoverLeads(): Promise<Lead[]> {
    const existing = this.getLeadsFromStorage();
    if (existing.length > 0) {
      return existing;
    }

    // Default discovery: Sweden VAT & Business Registry (Bolagsverket & Skatteverket)
    try {
      const defaultLeads = await swedenRegistryService.discoverSwedenLeads({
        municipality: 'ALL',
        industrySector: 'ALL',
        vatStatusFilter: 'ALL',
        revenueTier: 'ALL'
      });

      this.saveLeadsToStorage(defaultLeads);
      return defaultLeads;
    } catch (e) {
      console.warn('Initial Sweden registry discovery warning:', e);
      return [];
    }
  }

  public updateLeadStatus(leadId: string, status: LeadStatus): Lead[] {
    const leads = this.getLeadsFromStorage();
    const updated = leads.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          status,
          lastVerifiedAt: new Date().toISOString()
        };
      }
      return l;
    });
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
          status: l.status === 'NEW' ? 'CONTACTED' : l.status,
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
   * Export SMB Leads to CSV with tailored client outreach fields
   */
  public exportLeadsToCSV(leads: Lead[]): void {
    const cleanLeads = strictDeduplicate(leads);
    if (cleanLeads.length === 0) return;

    const headers = [
      'Business Name',
      'Niche / Industry',
      'City',
      'Country',
      'Full Address',
      'Freelancer Fit Score',
      'Website Status',
      'Official Website URL',
      'Phone Number',
      'WhatsApp Outreach Link',
      'Email Address',
      'Social Presence',
      'CRM Status',
      'Pitch Opportunity Angle',
      'Discovery Source URL'
    ];

    const rows = cleanLeads.map(lead => {
      const phoneClean = lead.contact?.phoneNormalized || lead.contact?.phone?.replace(/\D/g, '') || '';
      const waLink = phoneClean ? `https://wa.me/${phoneClean}` : '';

      return [
        lead.company.name,
        lead.company.industry,
        lead.company.city || '',
        lead.company.country || '',
        lead.company.location || '',
        lead.freelancerFitScore || lead.scoreBreakdown.totalScore,
        lead.websiteVerification?.status || (lead.websiteAudit.hasWebsite ? 'WEBSITE_FOUND' : 'VERIFIED_NO_WEBSITE'),
        lead.company.websiteUrl || 'None',
        lead.contact.phone || lead.publicContacts?.phone || 'None',
        waLink,
        lead.contact.email || lead.publicContacts?.email || 'None',
        lead.company.socialPresence ? 'Yes (FB/IG)' : 'None',
        lead.status,
        lead.websiteAudit?.aiOpportunityReason || lead.websiteVerification?.reason || '',
        lead.sourceUrl || ''
      ];
    });

    const filename = `LeadPulse_SMB_Leads_${new Date().toISOString().slice(0, 10)}.csv`;

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => 
        row.map(cell => {
          const str = cell === undefined || cell === null ? '' : String(cell);
          return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const leadService = new LeadService();
