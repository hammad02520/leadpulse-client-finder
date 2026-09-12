import React from 'react';
import { 
  Zap, 
  LayoutDashboard, 
  MapPin,
  Briefcase,
  Kanban, 
  Table, 
  Flame, 
  Clock
} from 'lucide-react';
import { Lead, AppViewMode } from '../types';

interface SidebarProps {
  currentView: AppViewMode;
  setCurrentView: (view: AppViewMode) => void;
  leads: Lead[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  leads
}) => {
  const hotCount = leads.filter(l => l.scoreBreakdown.temperature === 'HOT' && !l.isExpired).length;
  const localCount = leads.filter(l => l.source === 'LOCAL_BIZ').length;
  const remoteCount = leads.filter(l => l.source === 'JOB_FEED' || l.source === 'REDDIT').length;

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
        }}>
          <Zap size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
            LeadPulse
          </h1>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: '600' }}>
            Client & Business Lead Discovery
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        
        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 8px 6px 8px' }}>
          Workspace Nav
        </div>

        {/* Dashboard */}
        <button 
          onClick={() => setCurrentView('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            background: currentView === 'dashboard' ? 'var(--primary-light)' : 'transparent',
            color: currentView === 'dashboard' ? 'var(--primary)' : 'var(--text-main)',
            textAlign: 'left'
          }}
        >
          <LayoutDashboard size={18} /> Overview Dashboard
        </button>

        {/* Local Business Finder (OpenStreetMap) */}
        <button 
          onClick={() => setCurrentView('local_biz')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            background: currentView === 'local_biz' ? 'var(--primary-light)' : 'transparent',
            color: currentView === 'local_biz' ? 'var(--primary)' : 'var(--text-main)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin size={18} /> Local SMB Finder
          </div>
          <span style={{ fontSize: '0.725rem', background: '#d1fae5', color: '#059669', padding: '2px 6px', borderRadius: '999px', fontWeight: '700' }}>
            {localCount}
          </span>
        </button>

        {/* Remote Jobs & Developer Client Feed */}
        <button 
          onClick={() => setCurrentView('remote_jobs')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            background: currentView === 'remote_jobs' ? 'var(--primary-light)' : 'transparent',
            color: currentView === 'remote_jobs' ? 'var(--primary)' : 'var(--text-main)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Briefcase size={18} /> Remote Dev Jobs
          </div>
          <span style={{ fontSize: '0.725rem', background: '#e0f2fe', color: '#0284c7', padding: '2px 6px', borderRadius: '999px', fontWeight: '700' }}>
            {remoteCount}
          </span>
        </button>

        {/* Pipeline Kanban */}
        <button 
          onClick={() => setCurrentView('kanban')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            background: currentView === 'kanban' ? 'var(--primary-light)' : 'transparent',
            color: currentView === 'kanban' ? 'var(--primary)' : 'var(--text-main)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Kanban size={18} /> Pipeline Kanban
          </div>
        </button>

        {/* Master Database Table */}
        <button 
          onClick={() => setCurrentView('table')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            background: currentView === 'table' ? 'var(--primary-light)' : 'transparent',
            color: currentView === 'table' ? 'var(--primary)' : 'var(--text-main)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Table size={18} /> Master Leads Grid
          </div>
        </button>

      </div>

      {/* Footer Metrics */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="badge badge-hot" style={{ justifyContent: 'center', padding: '6px 12px' }}>
          <Flame size={14} /> {hotCount} Hot Opportunities
        </div>

        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>
          LeadPulse v3.0 • OpenStreetMap Engine
        </div>
      </div>
    </aside>
  );
};
