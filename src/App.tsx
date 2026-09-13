import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LeadTable } from './components/LeadTable';
import { KanbanBoard } from './components/KanbanBoard';
import { LocalBizLeadsView } from './components/LocalBizLeadsView';
import { RemoteJobsView } from './components/RemoteJobsView';
import { LeadDetailDrawer } from './components/LeadDetailDrawer';
import { OutreachModal } from './components/OutreachModal';
import { ManualLeadModal } from './components/ManualLeadModal';
import { leadService } from './services/leadService';
import { strictDeduplicate } from './services/deduplicationService';
import { Lead, LeadStatus, AppViewMode } from './types';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppViewMode>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
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
    const finalLeads = strictDeduplicate([...newLeads, ...currentLeads]);
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

  const handleExportCSV = () => {
    if (currentView === 'local_biz') {
      const localLeads = leads.filter(l => l.source === 'LOCAL_BIZ');
      leadService.exportLeadsToCSV(localLeads, 'LOCAL_SMB');
    } else if (currentView === 'remote_jobs') {
      const remoteLeads = leads.filter(l => l.source === 'JOB_FEED' || l.source === 'REDDIT');
      leadService.exportLeadsToCSV(remoteLeads, 'REMOTE_JOBS');
    } else {
      leadService.exportLeadsToCSV(leads, 'ALL');
    }
  };

  return (
    <div className="app-container">
      
      {/* Left Enterprise Sidebar */}
      <Sidebar 
        currentView={currentView}
        setCurrentView={setCurrentView}
        leads={leads}
      />

      {/* Main Content View Container */}
      <div className="main-content">
        
        {/* Top Header Bar */}
        <Header 
          currentView={currentView}
          setCurrentView={setCurrentView}
          leads={leads}
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
              leads={freshOnly ? leads.filter(l => !l.isExpired && (l.freshnessTier === 'JUST_NOW' || l.freshnessTier === 'TODAY')) : leads}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
            />
          )}

          {currentView === 'local_biz' && (
            <LocalBizLeadsView 
              leads={leads}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
              onAddDiscoveredLeads={handleAddDiscoveredLeads}
            />
          )}

          {currentView === 'remote_jobs' && (
            <RemoteJobsView 
              leads={leads}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
              onAddDiscoveredLeads={handleAddDiscoveredLeads}
            />
          )}

          {currentView === 'table' && (
            <LeadTable 
              leads={leads}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenPitchModal={(l) => setPitchLead(l)}
              onStatusChange={handleStatusChange}
              freshOnly={freshOnly}
            />
          )}

          {currentView === 'kanban' && (
            <KanbanBoard 
              leads={freshOnly ? leads.filter(l => !l.isExpired) : leads}
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
