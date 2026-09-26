import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SwedenBusinessRegistryView } from './components/SwedenBusinessRegistryView';
import { LocalSMBClientFinderView } from './components/LocalSMBClientFinderView';
import { ProspectFinderView } from './components/ProspectFinderView';
import { LeadTable } from './components/LeadTable';
import { KanbanBoard } from './components/KanbanBoard';
import { LeadDetailDrawer } from './components/LeadDetailDrawer';
import { OutreachModal } from './components/OutreachModal';
import { ManualLeadModal } from './components/ManualLeadModal';
import { leadService } from './services/leadService';
import { strictDeduplicate } from './services/deduplicationService';
import { Lead, LeadStatus, AppViewMode } from './types';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppViewMode>('prospect_finder');
  const [leads, setLeads] = useState<Lead[]>(() => leadService.getLeadsFromStorage());
  const [isSyncing, setIsSyncing] = useState(false);
  const [freshOnly, setFreshOnly] = useState(false);

  // Selected lead for detail drawer
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Selected lead for AI Pitch Modal
  const [pitchLead, setPitchLead] = useState<Lead | null>(null);

  // Manual Add Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    handleSyncSources();
  }, []);

  const handleSyncSources = async () => {
    setIsSyncing(true);
    try {
      const updated = await leadService.fetchAndDiscoverLeads();
      setLeads(updated);
    } catch (err) {
      console.error('Failed to sync lead sources:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddDiscoveredLeads = (newLeads: Lead[]) => {
    const currentLeads = leadService.getLeadsFromStorage();
    let baseLeads = currentLeads;
    if (newLeads.length > 0) {
      const city = newLeads[0].company.city?.toLowerCase().trim();
      const industry = newLeads[0].company.industry?.toLowerCase().trim();
      if (city) {
        // Cleanly replace that city's matching niche so user gets full fresh batch
        baseLeads = currentLeads.filter(l => 
          !(l.company.city?.toLowerCase().trim() === city && l.company.industry?.toLowerCase().trim() === industry)
        );
      }
    }
    const finalLeads = strictDeduplicate([...newLeads, ...baseLeads]);
    leadService.saveLeadsToStorage(finalLeads);
    setLeads(finalLeads);
  };

  const handleUpdateSingleLead = (updatedLead: Lead) => {
    setLeads(prevLeads => {
      const updatedList = prevLeads.map(l => l.id === updatedLead.id ? updatedLead : l);
      leadService.saveLeadsToStorage(updatedList);
      return updatedList;
    });
    if (selectedLead && selectedLead.id === updatedLead.id) {
      setSelectedLead(updatedLead);
    }
  };

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    const updated = leadService.updateLeadStatus(leadId, newStatus);
    setLeads(updated);
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, status: newStatus });
    }
  };

  const handleAddNote = (leadId: string, note: string) => {
    const updated = leadService.addLeadNote(leadId, note);
    setLeads(updated);
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({
        ...selectedLead,
        notes: [...selectedLead.notes, `${new Date().toLocaleDateString()}: ${note}`]
      });
    }
  };

  const handleRecordOutreach = (leadId: string, type: 'EMAIL' | 'WHATSAPP', pitchText: string) => {
    const updated = leadService.addOutreachRecord(leadId, type, pitchText);
    setLeads(updated);
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({
        ...selectedLead,
        status: selectedLead.status === 'NEW' ? 'CONTACTED' : selectedLead.status,
        lastContactedAt: new Date().toISOString()
      });
    }
  };

  const handleAddCustomLead = (newLeadData: Partial<Lead>) => {
    const fit = newLeadData.freelancerFitScore || 85;
    const fullLead: Lead = {
      id: `manual_smb_${Date.now()}`,
      title: `${newLeadData.company?.name || 'Local Business'} — ${newLeadData.company?.industry || 'Trade'}`,
      description: newLeadData.description || 'Manually entered local business lead.',
      source: 'MANUAL_IMPORT',
      sourceUrl: newLeadData.sourceUrl || '',
      projectNeed: newLeadData.projectNeed || 'NO_WEBSITE_NO_APP',
      budgetSignal: newLeadData.budgetSignal || '£500 - £2,500',
      
      company: {
        name: newLeadData.company?.name || 'Local Business',
        industry: newLeadData.company?.industry || 'Services',
        location: newLeadData.company?.location || 'Local Area',
        city: newLeadData.company?.city || 'Manchester',
        country: newLeadData.company?.country || 'United Kingdom',
        websiteUrl: newLeadData.company?.websiteUrl,
        socialPresence: false
      },

      contact: {
        personName: newLeadData.contact?.personName || 'Owner',
        role: 'Business Owner',
        phone: newLeadData.contact?.phone,
        email: newLeadData.contact?.email,
        hasWhatsapp: Boolean(newLeadData.contact?.phone)
      },

      freelancerFitScore: fit,
      freelancerFitTier: fit >= 80 ? 'PREMIUM_TARGET' : 'GOOD_FIT',
      websiteVerification: {
        status: newLeadData.company?.websiteUrl ? 'WEBSITE_FOUND' : 'VERIFIED_NO_WEBSITE',
        url: newLeadData.company?.websiteUrl,
        osmChecked: false,
        foursquareChecked: false,
        searchChecked: true,
        confidence: 90,
        reason: newLeadData.company?.websiteUrl ? 'Manual website provided' : 'Manually confirmed missing website'
      },

      scoreBreakdown: {
        needSignalScore: 35,
        businessQualityScore: 20,
        websiteProblemsScore: 30,
        contactabilityScore: 30,
        activitySignalScore: 10,
        freshnessScore: 20,
        penalties: 0,
        totalScore: fit,
        temperature: fit >= 80 ? 'HOT' : 'WARM'
      },

      websiteAudit: {
        domain: newLeadData.company?.websiteUrl || 'No Domain',
        hasWebsite: Boolean(newLeadData.company?.websiteUrl),
        hasMobileApp: false,
        mobileFriendly: false,
        performanceScore: 0,
        hasHttps: false,
        hasModernUi: false,
        hasCta: false,
        hasContactForm: false,
        hasOnlineBooking: false,
        hasOnlineOrdering: false,
        opportunityScore: 90,
        issuesDetected: newLeadData.company?.websiteUrl ? ['Outdated design'] : ['No official website'],
        aiOpportunityReason: 'Pitch high-converting 5-page mobile website with WhatsApp booking.'
      },

      status: 'NEW',
      tags: ['MANUAL_LEAD', 'LOCAL_SMB', ...(newLeadData.tags || [])],
      notes: [`${new Date().toLocaleDateString()}: Added manually by user.`],
      discoveredAt: new Date().toISOString(),
      postedAt: new Date().toISOString(),
      freshnessTier: 'JUST_NOW',
      isExpired: false,
      lastVerifiedAt: new Date().toISOString(),
      outreachHistory: []
    };

    const updated = strictDeduplicate([fullLead, ...leads]);
    leadService.saveLeadsToStorage(updated);
    setLeads(updated);
  };

  const handleExportCSV = () => {
    leadService.exportLeadsToCSV(leads);
  };

  const visibleLeads = strictDeduplicate(leads);

  return (
    <div className="app-container" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      
      {/* Streamlined Sidebar */}
      <Sidebar 
        currentView={currentView}
        setCurrentView={setCurrentView}
        leads={visibleLeads}
      />

      {/* Main Content View Container */}
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
        
        {/* Top Header Bar */}
        <Header 
          currentView={currentView}
          setCurrentView={setCurrentView}
          leads={visibleLeads}
          onSyncSources={handleSyncSources}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onExportCSV={handleExportCSV}
          isSyncing={isSyncing}
          freshOnly={freshOnly}
          setFreshOnly={setFreshOnly}
        />

        {/* View Component Switcher */}
        <main style={{ flex: 1 }}>
          {currentView === 'prospect_finder' && (
            <ProspectFinderView />
          )}

          {currentView === 'sweden_registry' && (
            <SwedenBusinessRegistryView 
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
              onStatusChange={handleStatusChange}
              onAddDiscoveredLeads={handleAddDiscoveredLeads}
            />
          )}

          {currentView === 'dashboard' && (
            <LocalSMBClientFinderView 
              leads={visibleLeads}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
              onStatusChange={handleStatusChange}
              onExportCSV={handleExportCSV}
              onAddDiscoveredLeads={handleAddDiscoveredLeads}
            />
          )}

          {currentView === 'kanban' && (
            <KanbanBoard 
              leads={visibleLeads}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
              onStatusChange={handleStatusChange}
            />
          )}

          {currentView === 'table' && (
            <LeadTable 
              leads={visibleLeads}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
              onStatusChange={handleStatusChange}
              freshOnly={freshOnly}
            />
          )}
        </main>
      </div>

      {/* Lead Detail Drawer */}
      <LeadDetailDrawer 
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onOpenPitchModal={(l) => setPitchLead(l)}
        onAddNote={handleAddNote}
        onStatusChange={handleStatusChange}
        onUpdateLead={handleUpdateSingleLead}
      />

      {/* AI Pitch & Outreach Modal */}
      <OutreachModal 
        lead={pitchLead}
        onClose={() => setPitchLead(null)}
        onRecordOutreach={handleRecordOutreach}
      />

      {/* Manual Lead Modal */}
      <ManualLeadModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddLead={handleAddCustomLead}
      />

    </div>
  );
};
export default App;
