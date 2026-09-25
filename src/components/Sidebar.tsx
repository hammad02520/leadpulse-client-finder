import React, { useMemo } from 'react';
import { 
  Zap, 
  MapPin, 
  Kanban, 
  Table, 
  Flame, 
  Search,
  CheckCircle2,
  PhoneCall,
  Globe,
  Award,
  Layers
} from 'lucide-react';
import { Lead, AppViewMode } from '../types';
import { strictDeduplicate } from '../services/deduplicationService';

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
  const uniqueLeads = useMemo(() => strictDeduplicate(leads), [leads]);

  const totalSmbCount = uniqueLeads.length;
  const swedenCount = uniqueLeads.filter(l => l.source === 'SWEDEN_VAT_REGISTRY' || l.swedenVatInfo).length;
  const noWebsiteCount = uniqueLeads.filter(l => l.websiteVerification?.status === 'VERIFIED_NO_WEBSITE' || !l.websiteAudit?.hasWebsite).length;
  const highFitCount = uniqueLeads.filter(l => (l.freelancerFitScore || 0) >= 80).length;
  const contactedCount = uniqueLeads.filter(l => l.status === 'CONTACTED' || l.status === 'REPLIED' || l.status === 'MEETING' || l.status === 'WON').length;

  return (
    <aside className="sidebar" style={{ width: '270px', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', background: 'var(--card-bg)', borderRight: '1px solid var(--border-color)', padding: '20px 16px' }}>
      
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #005293 0%, #003a6b 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fecc00',
          boxShadow: '0 4px 12px rgba(0, 82, 147, 0.3)',
          flexShrink: 0
        }}>
          <Zap size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: '1.2', margin: 0 }}>
            LeadPulse
          </h1>
          <span style={{ fontSize: '0.7rem', color: '#005293', fontWeight: '800' }}>
            🇸🇪 Sweden B2B Engine
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        
        <div style={{ fontSize: '0.675rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 8px' }}>
          Verified Sources
        </div>

        {/* 1. Dedicated Sweden VAT Registry */}
        <button 
          onClick={() => setCurrentView('sweden_registry')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: '800',
            cursor: 'pointer',
            background: currentView === 'sweden_registry' ? '#eff6ff' : 'transparent',
            color: currentView === 'sweden_registry' ? '#005293' : 'var(--text-main)',
            textAlign: 'left',
            boxShadow: currentView === 'sweden_registry' ? '0 1px 3px rgba(0, 82, 147, 0.15)' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.1rem' }}>🇸🇪</span> Sweden VAT Registry
          </div>
          <span style={{ fontSize: '0.7rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 7px', borderRadius: '999px', fontWeight: '800' }}>
            {swedenCount > 0 ? swedenCount : 'OFFICIAL'}
          </span>
        </button>

        {/* 2. Main Local SMB Client Finder */}
        <button 
          onClick={() => setCurrentView('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            background: currentView === 'dashboard' ? 'var(--primary-light)' : 'transparent',
            color: currentView === 'dashboard' ? 'var(--primary)' : 'var(--text-main)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin size={17} color="#16a34a" /> Global Local SMB
          </div>
          <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: '999px', fontWeight: '800' }}>
            {totalSmbCount}
          </span>
        </button>

        {/* 2. Outreach CRM Kanban */}
        <button 
          onClick={() => setCurrentView('kanban')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            background: currentView === 'kanban' ? 'var(--primary-light)' : 'transparent',
            color: currentView === 'kanban' ? 'var(--primary)' : 'var(--text-main)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Kanban size={17} color="#4f46e5" /> Outreach CRM
          </div>
          {contactedCount > 0 && (
            <span style={{ fontSize: '0.7rem', background: '#e0e7ff', color: '#4338ca', padding: '2px 7px', borderRadius: '999px', fontWeight: '800' }}>
              {contactedCount}
            </span>
          )}
        </button>

        {/* 3. Master Leads Grid */}
        <button 
          onClick={() => setCurrentView('table')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            background: currentView === 'table' ? 'var(--primary-light)' : 'transparent',
            color: currentView === 'table' ? 'var(--primary)' : 'var(--text-main)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Table size={17} color="#0284c7" /> Master Leads Table
          </div>
        </button>



        {/* Quick Health Summary Panel */}
        <div style={{ marginTop: 'auto', background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.725rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Opportunity Metrics
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem' }}>
            <span style={{ color: '#dc2626', fontWeight: '700' }}>❌ No Official Website:</span>
            <span style={{ fontWeight: '800', color: '#dc2626' }}>{noWebsiteCount}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem' }}>
            <span style={{ color: '#15803d', fontWeight: '700' }}>🔥 High Fit (&gt;80):</span>
            <span style={{ fontWeight: '800', color: '#15803d' }}>{highFitCount}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>💬 Contacted:</span>
            <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{contactedCount}</span>
          </div>
        </div>

      </div>

    </aside>
  );
};
