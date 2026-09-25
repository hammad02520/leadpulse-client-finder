import React from 'react';
import { 
  RefreshCw, 
  Plus, 
  Download,
  Clock,
  MapPin,
  Kanban,
  Table
} from 'lucide-react';
import { Lead, AppViewMode } from '../types';

interface HeaderProps {
  currentView: AppViewMode;
  setCurrentView: (view: AppViewMode) => void;
  leads: Lead[];
  onSyncSources: () => void;
  onOpenAddModal: () => void;
  onExportCSV: () => void;
  isSyncing: boolean;
  freshOnly: boolean;
  setFreshOnly: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  leads,
  onSyncSources,
  onOpenAddModal,
  onExportCSV,
  isSyncing,
  freshOnly,
  setFreshOnly
}) => {
  return (
    <header style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-color)', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
      
      {/* Category Quick Switcher Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          onClick={() => setCurrentView('sweden_registry')}
          className={`btn ${currentView === 'sweden_registry' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '7px 14px', fontSize: '0.825rem', fontWeight: '800', background: currentView === 'sweden_registry' ? '#005293' : undefined, borderColor: currentView === 'sweden_registry' ? '#005293' : undefined }}
        >
          <span>🇸🇪</span> Sweden VAT Registry
        </button>

        <button 
          onClick={() => setCurrentView('dashboard')}
          className={`btn ${currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '7px 14px', fontSize: '0.825rem', fontWeight: '700' }}
        >
          <MapPin size={15} /> 📍 Global SMB
        </button>

        <button 
          onClick={() => setCurrentView('kanban')}
          className={`btn ${currentView === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '7px 14px', fontSize: '0.825rem', fontWeight: '700' }}
        >
          <Kanban size={15} /> 📋 Outreach CRM
        </button>

        <button 
          onClick={() => setCurrentView('table')}
          className={`btn ${currentView === 'table' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '7px 14px', fontSize: '0.825rem', fontWeight: '700' }}
        >
          <Table size={15} /> 📊 Master Grid
        </button>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        
        <button 
          className="btn btn-secondary"
          onClick={onSyncSources}
          disabled={isSyncing}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem' }}
        >
          <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing Overpass...' : 'Refresh Local Leads'}
        </button>

        <button 
          className="btn btn-secondary"
          onClick={onExportCSV}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem' }}
          title="Export qualified SMB leads to CSV/Excel"
        >
          <Download size={14} /> Export SMBs (CSV)
        </button>

        <button 
          className="btn btn-primary"
          onClick={onOpenAddModal}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', fontWeight: '700' }}
        >
          <Plus size={14} /> Add Local Lead
        </button>

      </div>

    </header>
  );
};
