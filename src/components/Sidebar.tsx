import React, { useMemo } from 'react';
import { 
  Zap, 
  LayoutDashboard, 
  MapPin,
  Briefcase,
  Kanban, 
  Table, 
  Flame, 
  Clock,
  Users,
  Code2,
  Rocket,
  Building2,
  Calendar,
  Megaphone,
  BookOpen
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
  const hotCount = uniqueLeads.filter(l => l.scoreBreakdown.temperature === 'HOT' && !l.isExpired).length;
  const localCount = uniqueLeads.filter(l => l.source === 'LOCAL_BIZ' || l.source === 'WIKIDATA').length;
  const b2bCount = uniqueLeads.filter(l => l.source === 'B2B_APOLLO').length;
  const ebookCount = uniqueLeads.filter(l => l.source === 'EBOOK_AUTHOR' || l.tags.includes('EBOOK_AUTHOR')).length;
  const techCount = uniqueLeads.filter(l => l.source === 'TECH_STACK' || l.source === 'GITHUB_FOUNDER').length;
  const startupCount = uniqueLeads.filter(l => 
    l.source === 'FUNDED_STARTUP' || 
    l.source === 'Y_COMBINATOR' || 
    l.source === 'PRODUCT_HUNT' || 
    l.source === 'BETALIST' || 
    l.source === 'INDIE_HACKERS'
  ).length;
  const remoteCount = uniqueLeads.filter(l => l.source === 'JOB_FEED' || l.source === 'REDDIT').length;
  const registryCount = uniqueLeads.filter(l => l.source === 'GLOBAL_REGISTRY').length;
  const expoCount = uniqueLeads.filter(l => l.source === 'TRADE_EXPO').length;

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
            <MapPin size={18} /> Local SMBs & Maps
          </div>
          <span style={{ fontSize: '0.725rem', background: '#d1fae5', color: '#059669', padding: '2px 6px', borderRadius: '999px', fontWeight: '700' }}>
            {localCount}
          </span>
        </button>

        {/* B2B Decision Makers (Apollo) */}
        <button 
          onClick={() => setCurrentView('b2b_founders')}
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
            background: currentView === 'b2b_founders' ? 'var(--primary-light)' : 'transparent',
            color: currentView === 'b2b_founders' ? 'var(--primary)' : 'var(--text-main)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={18} /> B2B Decision Makers
          </div>
          <span style={{ fontSize: '0.725rem', background: '#ede9fe', color: '#7c3aed', padding: '2px 6px', borderRadius: '999px', fontWeight: '700' }}>
            {b2bCount}
          </span>
        </button>

        {/* eBook Authors & Creators */}
        <button 
          onClick={() => setCurrentView('ebook_authors')}
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
            background: currentView === 'ebook_authors' ? 'var(--primary-light)' : 'transparent',
            color: currentView === 'ebook_authors' ? 'var(--primary)' : 'var(--text-main)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={18} /> eBook Authors & Creators
          </div>
          <span style={{ fontSize: '0.725rem', background: '#d1fae5', color: '#059669', padding: '2px 6px', borderRadius: '999px', fontWeight: '700' }}>
            {ebookCount}
          </span>
        </button>

        {/* Tech-Stack & CMS Audits */}
        <button 
          onClick={() => setCurrentView('tech_stack')}
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
            background: currentView === 'tech_stack' ? 'var(--primary-light)' : 'transparent',
            color: currentView === 'tech_stack' ? 'var(--primary)' : 'var(--text-main)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Code2 size={18} /> Tech-Stack Audits
          </div>
          <span style={{ fontSize: '0.725rem', background: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: '999px', fontWeight: '700' }}>
            {techCount}
          </span>
        </button>

        {/* Funded Startups & Product Launches */}
        <button 
          onClick={() => setCurrentView('funded_startups')}
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
            background: currentView === 'funded_startups' ? 'var(--primary-light)' : 'transparent',
            color: currentView === 'funded_startups' ? 'var(--primary)' : 'var(--text-main)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Rocket size={18} /> Funded Startups
          </div>
          <span style={{ fontSize: '0.725rem', background: '#fae8ff', color: '#c026d3', padding: '2px 6px', borderRadius: '999px', fontWeight: '700' }}>
            {startupCount}
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

        {/* Global Business Registries */}
        <button 
          onClick={() => setCurrentView('global_registries')}
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
            background: currentView === 'global_registries' ? 'var(--primary-light)' : 'transparent',
            color: currentView === 'global_registries' ? 'var(--primary)' : 'var(--text-main)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={18} /> Global Registries
          </div>
          <span style={{ fontSize: '0.725rem', background: '#ede9fe', color: '#6d28d9', padding: '2px 6px', borderRadius: '999px', fontWeight: '700' }}>
            {registryCount}
          </span>
        </button>

        {/* Trade Shows & Exhibitions */}
        <button 
          onClick={() => setCurrentView('trade_expos')}
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
            background: currentView === 'trade_expos' ? 'var(--primary-light)' : 'transparent',
            color: currentView === 'trade_expos' ? 'var(--primary)' : 'var(--text-main)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={18} /> Trade Shows & Expos
          </div>
          <span style={{ fontSize: '0.725rem', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '999px', fontWeight: '700' }}>
            {expoCount}
          </span>
        </button>

        {/* Ad & PPC Hunter Tool */}
        <button 
          onClick={() => setCurrentView('ad_hunter')}
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
            background: currentView === 'ad_hunter' ? 'var(--primary-light)' : 'transparent',
            color: currentView === 'ad_hunter' ? 'var(--primary)' : 'var(--text-main)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Megaphone size={18} color="#6366f1" /> Ad & PPC Hunter
          </div>
          <span style={{ fontSize: '0.725rem', background: '#e0e7ff', color: '#4338ca', padding: '2px 6px', borderRadius: '999px', fontWeight: '800' }}>
            PRO
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
