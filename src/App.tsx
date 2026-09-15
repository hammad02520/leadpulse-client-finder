import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LeadTable } from './components/LeadTable';
import { KanbanBoard } from './components/KanbanBoard';
import { LocalBizLeadsView } from './components/LocalBizLeadsView';
import { B2BDecisionMakersView } from './components/B2BDecisionMakersView';
import { TechStackView } from './components/TechStackView';
import { FundedStartupsView } from './components/FundedStartupsView';
import { RemoteJobsView } from './components/RemoteJobsView';
import { GlobalRegistriesView } from './components/GlobalRegistriesView';
import { TradeExposView } from './components/TradeExposView';
import { AdHunterView } from './components/AdHunterView';
import { EbookAuthorsView } from './components/EbookAuthorsView';
import { LeadDetailDrawer } from './components/LeadDetailDrawer';
import { OutreachModal } from './components/OutreachModal';
import { ManualLeadModal } from './components/ManualLeadModal';
import { leadService } from './services/leadService';
import { strictDeduplicate } from './services/deduplicationService';
import { Lead, LeadStatus, AppViewMode } from './types';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppViewMode>('dashboard');
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

  const handleAddDiscoveredLeads = (newLeads: Lead[], replaceCity?: string) => {
    const currentLeads = leadService.getLeadsFromStorage();
    let baseLeads = currentLeads;
    // Cleanly replace META_ADS and GOOGLE_PPC leads on a fresh scan so the user sees exact leads for selected country/city
    if (newLeads.length > 0) {
      const src = newLeads[0].source;
      if (src === 'META_ADS' || src === 'GOOGLE_PPC') {
        baseLeads = currentLeads.filter(l => l.source !== src);
      }
    }

    // When fetching a new volume batch for a local city or entire country, cleanly replace that scope's leads
    // so the user sees EXACTLY the volume they selected (100, 300, 500, 1,000)
    const targetCity = replaceCity || (newLeads.length > 0 && newLeads[0].source === 'LOCAL_BIZ' ? newLeads[0].company.city : undefined);
    if (targetCity) {
      if (targetCity.startsWith('NATIONWIDE_')) {
        const cleanCountry = targetCity.replace('NATIONWIDE_', '').toLowerCase().trim();
        baseLeads = currentLeads.filter(l => 
          l.source !== 'LOCAL_BIZ' || 
          (l.company.country?.toLowerCase().trim() !== cleanCountry && !l.company.location?.toLowerCase().includes(cleanCountry))
        );
      } else {
        const cleanCity = targetCity.toLowerCase().trim();
        baseLeads = currentLeads.filter(l => 
          l.source !== 'LOCAL_BIZ' || 
          (l.company.city?.toLowerCase().trim() !== cleanCity && !l.company.location?.toLowerCase().includes(cleanCity))
        );
      }
    }

    const finalLeads = strictDeduplicate([...newLeads, ...baseLeads]);
    leadService.saveLeadsToStorage(finalLeads);
    setLeads(finalLeads);
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
  };

  const handleUpdateLead = (updatedLead: Lead) => {
    const updated = leadService.updateLead(updatedLead);
    setLeads(updated);
    if (selectedLead && selectedLead.id === updatedLead.id) {
      setSelectedLead(updatedLead);
    }
  };

  const handleAddCustomLead = (newLead: Lead) => {
    const currentLeads = leadService.getLeadsFromStorage();
    const updated = strictDeduplicate([newLead, ...currentLeads]);
    leadService.saveLeadsToStorage(updated);
    setLeads(updated);
  };

  // STRICT GUARANTEE: Never surface expired leads in any module
  const unexpiredLeads = leads.filter(l => !l.isExpired && l.freshnessTier !== 'STALE_EXPIRED');
  const visibleLeads = freshOnly 
    ? unexpiredLeads.filter(l => l.freshnessTier === 'JUST_NOW' || l.freshnessTier === 'TODAY') 
    : unexpiredLeads;

  const handleExportCSV = (leadsToExport: Lead[] = visibleLeads) => {
    if (currentView === 'local_biz') {
      const localLeads = leads.filter(l => l.source === 'LOCAL_BIZ');
      leadService.exportLeadsToCSV(localLeads, 'LOCAL_SMB');
    } else if (currentView === 'b2b_founders') {
      const b2bLeads = leads.filter(l => l.source === 'B2B_APOLLO');
      leadService.exportLeadsToCSV(b2bLeads, 'B2B_FOUNDERS');
    } else if (currentView === 'tech_stack') {
      const techLeads = leads.filter(l => l.source === 'TECH_STACK');
      leadService.exportLeadsToCSV(techLeads, 'TECH_STACK');
    } else if (currentView === 'funded_startups') {
      const startupLeads = leads.filter(l => l.source === 'FUNDED_STARTUP');
      leadService.exportLeadsToCSV(startupLeads, 'FUNDED_STARTUPS');
    } else if (currentView === 'remote_jobs') {
      const remoteLeads = leadsToExport.filter(l => l.source === 'JOB_FEED' || l.source === 'REDDIT');
      leadService.exportLeadsToCSV(remoteLeads, 'REMOTE_JOBS');
    } else if (currentView === 'global_registries') {
      const regLeads = leads.filter(l => l.source === 'GLOBAL_REGISTRY');
      leadService.exportLeadsToCSV(regLeads, 'GLOBAL_REGISTRY');
    } else if (currentView === 'trade_expos') {
      const expoLeads = leads.filter(l => l.source === 'TRADE_EXPO');
      leadService.exportLeadsToCSV(expoLeads, 'TRADE_EXPO');
    } else {
      leadService.exportLeadsToCSV(leadsToExport, 'ALL');
    }
  };

  return (
    <div className="app-container">
      
      {/* Left Enterprise Sidebar */}
      <Sidebar 
        currentView={currentView}
        setCurrentView={setCurrentView}
        leads={visibleLeads}
      />

      {/* Main Content View Container */}
      <div className="main-content">
        
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
          {currentView === 'dashboard' && (
            <Dashboard 
              leads={visibleLeads}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
            />
          )}

          {currentView === 'local_biz' && (
            <LocalBizLeadsView 
              leads={visibleLeads}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
              onAddDiscoveredLeads={handleAddDiscoveredLeads}
            />
          )}

          {currentView === 'b2b_founders' && (
            <B2BDecisionMakersView 
              leads={visibleLeads}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
              onStatusChange={handleStatusChange}
              onExportCSV={handleExportCSV}
              onAddDiscoveredLeads={handleAddDiscoveredLeads}
            />
          )}

          {currentView === 'tech_stack' && (
            <TechStackView 
              leads={visibleLeads}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
              onStatusChange={handleStatusChange}
              onExportCSV={handleExportCSV}
              onAddDiscoveredLeads={handleAddDiscoveredLeads}
            />
          )}

          {currentView === 'funded_startups' && (
            <FundedStartupsView 
              leads={visibleLeads}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
              onStatusChange={handleStatusChange}
              onExportCSV={handleExportCSV}
              onAddDiscoveredLeads={handleAddDiscoveredLeads}
            />
          )}

          {currentView === 'remote_jobs' && (
            <RemoteJobsView 
              leads={visibleLeads}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
              onAddDiscoveredLeads={handleAddDiscoveredLeads}
            />
          )}

          {currentView === 'global_registries' && (
            <GlobalRegistriesView 
              leads={visibleLeads}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
              onStatusChange={handleStatusChange}
              onExportCSV={handleExportCSV}
              onAddDiscoveredLeads={handleAddDiscoveredLeads}
            />
          )}

          {currentView === 'trade_expos' && (
            <TradeExposView 
              leads={visibleLeads}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
              onStatusChange={handleStatusChange}
              onExportCSV={handleExportCSV}
              onAddDiscoveredLeads={handleAddDiscoveredLeads}
            />
          )}

          {currentView === 'ad_hunter' && (
            <AdHunterView 
              leads={visibleLeads}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
              onAddDiscoveredLeads={handleAddDiscoveredLeads}
              onNavigateToView={(v) => setCurrentView(v)}
            />
          )}

          {currentView === 'ebook_authors' && (
            <EbookAuthorsView 
              leads={visibleLeads}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
              onAddDiscoveredLeads={handleAddDiscoveredLeads}
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

          {currentView === 'kanban' && (
            <KanbanBoard 
              leads={visibleLeads}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
              onStatusChange={handleStatusChange}
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
        onUpdateLead={handleUpdateLead}
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
