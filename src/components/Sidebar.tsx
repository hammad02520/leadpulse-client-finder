import React from 'react';
import { 
  Zap, 
  LayoutDashboard, 
  Kanban, 
  Table, 
  Sparkles, 
  Flame, 
  Globe, 
  Settings,
  Database,
  Layers,
  Clock
} from 'lucide-react';
import { Lead } from '../types';

interface SidebarProps {
  currentView: 'dashboard' | 'kanban' | 'table';
  setCurrentView: (view: 'dashboard' | 'kanban' | 'table') => void;
  leads: Lead[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  leads
}) => {
  const hotCount = leads.filter(l => l.scoreBreakdown.temperature === 'HOT' && !l.isExpired).length;
  const freshCount = leads.filter(l => !l.isExpired && (l.freshnessTier === 'JUST_NOW' || l.freshnessTier === 'TODAY')).length;

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
            Enterprise Client CRM
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        
        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 8px 6px 8px' }}>
          Workspace Nav
        </div>

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
            <Kanban size={18} /> Sales Pipeline
          </div>
          <span style={{ fontSize: '0.75rem', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '999px', fontWeight: '700' }}>
            {leads.length}
          </span>
        </button>

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
            <Table size={18} /> Leads Database
          </div>
        </button>

      </div>

      {/* Footer Metrics */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="badge badge-hot" style={{ justifyContent: 'center', padding: '6px 12px' }}>
          <Flame size={14} /> {hotCount} Hot Opportunities
        </div>

        <div className="badge badge-fresh" style={{ justifyContent: 'center', padding: '6px 12px' }}>
          <Clock size={14} /> {freshCount} Fresh (&lt;24h)
        </div>

        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>
          LeadPulse v2.4 • Enterprise Edition
        </div>
      </div>
    </aside>
  );
};
