import React from 'react';
import { 
  RefreshCw, 
  Plus, 
  Download,
  Clock,
  Search,
  MapPin,
  Briefcase
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
    <header style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
      
      {/* Category Quick Switcher Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          onClick={() => setCurrentView('local_biz')}
          className={`btn ${currentView === 'local_biz' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '7px 14px', fontSize: '0.8rem' }}
        >
          <MapPin size={15} /> 📍 Local SMB Finder
        </button>

        <button 
          onClick={() => setCurrentView('remote_jobs')}
          className={`btn ${currentView === 'remote_jobs' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '7px 14px', fontSize: '0.8rem' }}
        >
          <Briefcase size={15} /> 💼 Remote Dev Jobs
        </button>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        
        <button 
          className={`btn ${freshOnly ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFreshOnly(!freshOnly)}
          style={{ padding: '7px 14px', fontSize: '0.8rem' }}
        >
          <Clock size={14} /> {freshOnly ? '⚡ Fresh Leads Only (<48h)' : '🌐 All Active Leads'}
        </button>

        <button 
          className="btn btn-secondary"
          onClick={onSyncSources}
          disabled={isSyncing}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : 'Fetch Live Leads'}
        </button>

        <button 
          className="btn btn-secondary"
          onClick={onExportCSV}
          title="Export qualified leads to CSV"
        >
          <Download size={15} /> Export CSV
        </button>

        <button 
          className="btn btn-primary"
          onClick={onOpenAddModal}
        >
          <Plus size={15} /> Add Custom Lead
        </button>

      </div>

    </header>
  );
};
