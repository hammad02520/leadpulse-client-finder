import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LeadTable } from './components/LeadTable';
import { KanbanBoard } from './components/KanbanBoard';
import { LeadDetailDrawer } from './components/LeadDetailDrawer';
import { OutreachModal } from './components/OutreachModal';
import { ManualLeadModal } from './components/ManualLeadModal';
import { leadService } from './services/leadService';
import { Lead, LeadStatus } from './types';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'kanban' | 'table'>('dashboard');
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

  const handleAddCustomLead = (newLead: Lead) => {
    const currentLeads = leadService.getLeadsFromStorage();
    const updated = [newLead, ...currentLeads];
    leadService.saveLeadsToStorage(updated);
    setLeads(updated);
  };

  const handleExportCSV = () => {
    leadService.exportLeadsToCSV(leads);
  };

  return (
    <div className="app-container">
      
      {/* Left Collapsible Enterprise Sidebar */}
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
      />

      {/* Truthful AI Pitch & Outreach Modal */}
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
