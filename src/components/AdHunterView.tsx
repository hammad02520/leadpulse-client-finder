import React, { useState } from 'react';
import { 
  Target, 
  Search, 
  Globe2, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  Flame, 
  Zap, 
  RefreshCw,
  MessageSquare,
  Mail,
  ArrowRight,
  ShieldCheck,
  Megaphone,
  Building2
} from 'lucide-react';
import { Lead, AppViewMode } from '../types';
import { adHunterService } from '../services/adHunterService';

interface AdHunterViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenPitchModal: (lead: Lead) => void;
  onAddDiscoveredLeads: (newLeads: Lead[]) => void;
  onNavigateToView: (view: AppViewMode) => void;
}

const META_AD_NICHES = [
  { id: 'real_estate', label: '🏡 Real Estate & Property', query: 'Real Estate property buy sale' },
  { id: 'dental', label: '🦷 Dental Clinics & Implants', query: 'Dental clinic teeth whitening implants' },
  { id: 'hvac', label: '❄️ HVAC, Plumbing & Roofing', query: 'HVAC repair plumber emergency roofing' },
  { id: 'solar', label: '☀️ Solar & Clean Energy', query: 'Solar installation panels green energy' },
  { id: 'interior', label: '🛋️ Interior Design & Fitout', query: 'Interior design fitout luxury home' },
  { id: 'gym', label: '🏋️ Gyms & Fitness Centers', query: 'Gym membership personal trainer fitness' },
  { id: 'ecommerce', label: '🛍️ E-Commerce & Retail Brands', query: 'Store discount shop online' },
  { id: 'legal', label: '⚖️ Legal & Corporate Services', query: 'Lawyer attorney legal corporate services' }
];

const TARGET_COUNTRIES = [
  { code: 'ALL', name: '🌍 Global (All Countries)' },
  { code: 'US', name: '🇺🇸 United States' },
  { code: 'GB', name: '🇬🇧 United Kingdom' },
  { code: 'AE', name: '🇦🇪 United Arab Emirates (Dubai)' },
  { code: 'CA', name: '🇨🇦 Canada' },
  { code: 'SA', name: '🇸🇦 Saudi Arabia (Riyadh)' },
  { code: 'AU', name: '🇦🇺 Australia' },
  { code: 'SG', name: '🇸🇬 Singapore' },
  { code: 'PK', name: '🇵🇰 Pakistan' },
  { code: 'IN', name: '🇮🇳 India' }
];

const GOOGLE_PPC_NICHES = [
  { label: '🚨 Emergency Plumbing & HVAC', query: 'Emergency plumber repair' },
  { label: '🦷 Dental Implants & Cosmetics', query: 'Best dental clinic implants' },
  { label: '🏙️ Commercial Real Estate & Fitout', query: 'Luxury apartment real estate buy' },
  { label: '🧹 Commercial Cleaning Services', query: 'Commercial office cleaning service' },
  { label: '⚖️ Corporate & Immigration Lawyers', query: 'Corporate lawyer legal consultation' },
  { label: '☀️ Solar Panel Installation', query: 'Solar panel installer quote' }
];

const TARGET_CITIES = [
  'Dubai, UAE',
  'London, UK',
  'New York, USA',
  'Toronto, Canada',
  'Riyadh, Saudi Arabia',
  'Miami, USA',
  'Sydney, Australia',
  'Singapore',
  'Karachi, Pakistan',
  'Mumbai, India'
];

export const AdHunterView: React.FC<AdHunterViewProps> = ({ 
  leads,
  onSelectLead,
  onOpenPitchModal,
  onAddDiscoveredLeads,
  onNavigateToView 
}) => {
  // Meta Ads Hunter State
  const [metaNiche, setMetaNiche] = useState(META_AD_NICHES[0].id);
  const [metaCountry, setMetaCountry] = useState('AE');
  const [metaCopied, setMetaCopied] = useState(false);
  const [isScanningMeta, setIsScanningMeta] = useState(false);

  // Google PPC Hunter State
  const [ppcNiche, setPpcNiche] = useState(GOOGLE_PPC_NICHES[0].query);
  const [ppcCity, setPpcCity] = useState(TARGET_CITIES[0]);
  const [ppcCopied, setPpcCopied] = useState(false);
  const [isScanningPpc, setIsScanningPpc] = useState(false);

  // Active Tab: 'meta' | 'google' | 'domain'
  const [activeSubTab, setActiveSubTab] = useState<'meta' | 'google' | 'domain'>('meta');

  const selectedMetaObj = META_AD_NICHES.find(n => n.id === metaNiche) || META_AD_NICHES[0];
  const metaSearchUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${metaCountry}&q=${encodeURIComponent(selectedMetaObj.query)}&search_type=keyword_unordered`;
  const ppcSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(ppcNiche + ' ' + ppcCity)}`;

  const metaPitchText = `Hi! I saw your active Facebook/Instagram ad for ${selectedMetaObj.label.split(' ')[1] || 'your business'}. Notice your ad traffic sends users directly to WhatsApp/DM without a custom landing page. You are losing 50%+ ad conversion. We build high-converting Next.js landing pages in 48 hours to 3x your ROI.`;
  const ppcPitchText = `Hi! Noticed your sponsored Google PPC ad for ${ppcNiche} in ${ppcCity}. A custom high-speed Next.js landing page will boost your Google Ad Quality Score and cut your Cost-Per-Click (CPA) by 40%. Let's set up a conversion page!`;

  const copyToClipboard = (text: string, type: 'meta' | 'ppc') => {
    navigator.clipboard.writeText(text);
    if (type === 'meta') {
      setMetaCopied(true);
      setTimeout(() => setMetaCopied(false), 2500);
    } else {
      setPpcCopied(true);
      setTimeout(() => setPpcCopied(false), 2500);
    }
  };

  const handleScanMetaLeads = async () => {
    setIsScanningMeta(true);
    try {
      const discovered = await adHunterService.discoverMetaAdLeads({
        niche: metaNiche,
        country: metaCountry,
        limit: 50
      });
      onAddDiscoveredLeads(discovered);
    } catch (err) {
      console.error('Meta scan error:', err);
    } finally {
      setIsScanningMeta(false);
    }
  };

  const handleScanPpcLeads = async () => {
    setIsScanningPpc(true);
    try {
      const discovered = await adHunterService.discoverGooglePpcLeads({
        query: ppcNiche,
        city: ppcCity,
        limit: 50
      });
      onAddDiscoveredLeads(discovered);
    } catch (err) {
      console.error('PPC scan error:', err);
    } finally {
      setIsScanningPpc(false);
    }
  };

  // Filter leads from central app state
  const metaLeadsInState = leads.filter(l => l.source === 'META_ADS');
  const ppcLeadsInState = leads.filter(l => l.source === 'GOOGLE_PPC');

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner Header */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        color: '#ffffff',
        padding: '28px',
        borderRadius: '16px',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ background: '#6366f1', color: '#ffffff', fontSize: '0.75rem', fontWeight: '800', padding: '4px 12px', borderRadius: '999px', letterSpacing: '0.05em' }}>
              DIRECT LEAD ENGINE
            </span>
            <span style={{ color: '#a5b4fc', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Megaphone size={16} /> Meta Ads, Google PPC & Domain Launch Hunter
            </span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px', color: '#ffffff' }}>
            Direct Client Acquisition: Auto-Print Verified Ad Leads
          </h2>
          <p style={{ fontSize: '0.925rem', color: '#c7d2fe', lineHeight: '1.6' }}>
            Auto-scan active Meta Ad advertisers sending traffic to WhatsApp/DMs without landing pages, plus Google PPC search advertisers. All discovered leads print directly inside your LeadPulse list without external redirects!
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '12px' }}>
          <button
            onClick={() => setActiveSubTab('meta')}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'meta' ? '#6366f1' : 'transparent',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Megaphone size={16} /> Meta Ads ({metaLeadsInState.length})
          </button>

          <button
            onClick={() => setActiveSubTab('google')}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'google' ? '#6366f1' : 'transparent',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Search size={16} /> Google PPC ({ppcLeadsInState.length})
          </button>

          <button
            onClick={() => setActiveSubTab('domain')}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'domain' ? '#6366f1' : 'transparent',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Globe2 size={16} /> Domain Feeds
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: META ADS LIBRARY HUNTER */}
      {activeSubTab === 'meta' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                  <Megaphone size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    Meta Ads Hunter (Auto-Print Verified Ad Leads)
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Auto-scans businesses running Facebook & Instagram ads with missing landing pages and populates them directly into LeadPulse!
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleScanMetaLeads}
                  disabled={isScanningMeta}
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    cursor: isScanningMeta ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  <RefreshCw size={16} className={isScanningMeta ? 'spin-icon' : ''} />
                  {isScanningMeta ? 'Scanning & Auto-Printing...' : '⚡ Scan & Auto-Print Meta Ad Leads'}
                </button>

                <a
                  href={metaSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '10px 14px', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  Inspect Meta Library ↗
                </a>
              </div>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  Target Commercial Niche
                </label>
                <select
                  value={metaNiche}
                  onChange={(e) => setMetaNiche(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}
                >
                  {META_AD_NICHES.map(n => (
                    <option key={n.id} value={n.id}>{n.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  Target Country Location
                </label>
                <select
                  value={metaCountry}
                  onChange={(e) => setMetaCountry(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}
                >
                  {TARGET_COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI Pitch Copy Box */}
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '800', color: '#065f46', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="#059669" /> 1-Click Meta Advertiser Pitch Copy:
                </span>
                <button
                  onClick={() => copyToClipboard(metaPitchText, 'meta')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#059669',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.775rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {metaCopied ? <Check size={14} /> : <Copy size={14} />}
                  {metaCopied ? 'Copied Pitch!' : 'Copy Pitch Text'}
                </button>
              </div>

              <p style={{ margin: 0, fontSize: '0.85rem', color: '#064e3b', lineHeight: '1.5', fontFamily: 'monospace', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #6ee7b7' }}>
                "{metaPitchText}"
              </p>
            </div>

            {/* DIRECT PRINTED LEADS LIST */}
            <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone size={18} color="#4f46e5" /> Auto-Printed Meta Ad Leads ({metaLeadsInState.length})
            </h4>

            {metaLeadsInState.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <Megaphone size={32} color="#818cf8" style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>No Meta Ad Leads Scanned Yet</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Click <strong>"⚡ Scan & Auto-Print Meta Ad Leads"</strong> above to discover advertisers without landing pages!
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {metaLeadsInState.map(lead => (
                  <div 
                    key={lead.id} 
                    className="card" 
                    onClick={() => onSelectLead(lead)}
                    style={{ padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)', gap: '12px' }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span className="badge badge-hot">Score {lead.scoreBreakdown.totalScore}/100</span>
                        {!lead.websiteAudit?.hasWebsite ? (
                          <span style={{ fontSize: '0.725rem', color: '#059669', fontWeight: '800', background: '#ecfdf5', padding: '2px 8px', borderRadius: '999px' }}>
                            ⚡ ZERO WEBSITE ADVERTISER
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.725rem', color: '#4f46e5', fontWeight: '800', background: '#e0e7ff', padding: '2px 8px', borderRadius: '999px' }}>
                            ⚡ LIVE META ADVERTISER
                          </span>
                        )}
                      </div>
                      <h5 style={{ fontSize: '1rem', fontWeight: '800', marginTop: '8px', color: 'var(--text-main)' }}>
                        {lead.company.name}
                      </h5>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        📍 {lead.company.location} | 💰 {lead.budgetSignal}
                      </div>
                      <p style={{ fontSize: '0.825rem', color: '#475569', marginTop: '8px', lineHeight: '1.4' }}>
                        {lead.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                      <button 
                        className="btn btn-primary"
                        onClick={(e) => { e.stopPropagation(); onOpenPitchModal(lead); }}
                        style={{ flex: 1, padding: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Sparkles size={14} /> Pitch & Contact
                      </button>
                      {lead.contact.phone && (
                        <a
                          href={`https://wa.me/${lead.contact.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi ' + lead.company.name + ', noticed your active Meta ad sends users to WhatsApp without a landing page. We build Next.js landing pages in 48h.')}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: '#25D366',
                            color: '#ffffff',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <MessageSquare size={14} /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

      {/* SUB-TAB 2: GOOGLE PPC SEARCH ADS HUNTER */}
      {activeSubTab === 'google' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                  <Search size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    Google PPC Hunter (Auto-Print Verified Ad Leads)
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Auto-scans companies paying high CPC for Google Ads but sending traffic to weak landing pages and populates them directly into LeadPulse!
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleScanPpcLeads}
                  disabled={isScanningPpc}
                  style={{
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    cursor: isScanningPpc ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
                  }}
                >
                  <RefreshCw size={16} className={isScanningPpc ? 'spin-icon' : ''} />
                  {isScanningPpc ? 'Scanning & Auto-Printing...' : '⚡ Scan & Auto-Print Google PPC Leads'}
                </button>

                <a
                  href={ppcSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '10px 14px', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  Inspect Google Ads ↗
                </a>
              </div>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  High-Intent PPC Keyword
                </label>
                <select
                  value={ppcNiche}
                  onChange={(e) => setPpcNiche(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}
                >
                  {GOOGLE_PPC_NICHES.map((n, idx) => (
                    <option key={idx} value={n.query}>{n.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  Target Metropolitan City
                </label>
                <select
                  value={ppcCity}
                  onChange={(e) => setPpcCity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}
                >
                  {TARGET_CITIES.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI Pitch Copy Box */}
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '800', color: '#92400e', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="#d97706" /> 1-Click Google PPC Pitch Copy:
                </span>
                <button
                  onClick={() => copyToClipboard(ppcPitchText, 'ppc')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#d97706',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.775rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {ppcCopied ? <Check size={14} /> : <Copy size={14} />}
                  {ppcCopied ? 'Copied Pitch!' : 'Copy Pitch Text'}
                </button>
              </div>

              <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350f', lineHeight: '1.5', fontFamily: 'monospace', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                "{ppcPitchText}"
              </p>
            </div>

            {/* DIRECT PRINTED PPC LEADS LIST */}
            <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={18} color="#d97706" /> Auto-Printed Google PPC Leads ({ppcLeadsInState.length})
            </h4>

            {ppcLeadsInState.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', background: '#fffbeb', borderRadius: '12px', border: '1px dashed #fcd34d' }}>
                <Search size={32} color="#f59e0b" style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: '700', color: '#92400e', fontSize: '0.95rem' }}>No Google PPC Leads Scanned Yet</div>
                <div style={{ fontSize: '0.85rem', color: '#b45309', marginTop: '4px' }}>
                  Click <strong>"⚡ Scan & Auto-Print Google PPC Leads"</strong> above to discover advertisers paying high CPC for Google Ads!
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {ppcLeadsInState.map(lead => (
                  <div 
                    key={lead.id} 
                    className="card" 
                    onClick={() => onSelectLead(lead)}
                    style={{ padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)', gap: '12px' }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span className="badge badge-hot">Score {lead.scoreBreakdown.totalScore}/100</span>
                        <span style={{ fontSize: '0.725rem', color: '#b45309', fontWeight: '800', background: '#fef3c7', padding: '2px 8px', borderRadius: '999px' }}>
                          ⚡ GOOGLE PPC ADVERTISER
                        </span>
                      </div>
                      <h5 style={{ fontSize: '1rem', fontWeight: '800', marginTop: '8px', color: 'var(--text-main)' }}>
                        {lead.company.name}
                      </h5>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        📍 {lead.company.location} | 💰 {lead.budgetSignal}
                      </div>
                      <p style={{ fontSize: '0.825rem', color: '#475569', marginTop: '8px', lineHeight: '1.4' }}>
                        {lead.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                      <button 
                        className="btn btn-primary"
                        onClick={(e) => { e.stopPropagation(); onOpenPitchModal(lead); }}
                        style={{ flex: 1, padding: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Sparkles size={14} /> Pitch & Contact
                      </button>
                      {lead.contact.phone && (
                        <a
                          href={`https://wa.me/${lead.contact.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi ' + lead.company.name + ', noticed your sponsored Google PPC ad. A high-speed Next.js landing page will boost your Quality Score & cut CPA by 40%.')}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: '#25D366',
                            color: '#ffffff',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <MessageSquare size={14} /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

      {/* SUB-TAB 3: DOMAIN LAUNCH & INCORPORATION FEEDS */}
      {activeSubTab === 'domain' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                <Globe2 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  3. New Incorporation & Domain Launch Feeds (0-30 Days)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Access LeadPulse's Global Registries module pre-filtered for zero-website newly incorporated businesses (US Delaware/CA, UK, UAE Dubai, Canada, Saudi Arabia).
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
              
              <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: '800', fontSize: '0.95rem' }}>
                  <Zap size={18} /> Global Registries (Zero Web Filter)
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                  Instantly open the Global Registries tab with 100% verified newly registered entities across 10 global jurisdictions.
                </p>
                <button
                  onClick={() => onNavigateToView('global_registries')}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  Open Global Registries Module <ArrowRight size={16} />
                </button>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontWeight: '800', fontSize: '0.95rem' }}>
                  <ShieldCheck size={18} /> WHOIS Domain Lookup Helper
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                  Inspect official domain registrar creation dates, registrant names, and DNS status via public WHOIS search.
                </p>
                <a
                  href="https://who.is"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  Open WHOIS Domain Search ↗
                </a>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
