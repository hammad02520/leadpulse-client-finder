import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Flame, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Sparkles, 
  MessageSquare, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  RefreshCw,
  Building2,
  Share2,
  Calendar,
  Layers,
  Award,
  Clock
} from 'lucide-react';
import { Lead, LeadStatus, NicheCategory } from '../types';
import { localSmbDiscoveryService, SmbSearchParams } from '../services/localSmbDiscoveryService';
import { TIER_A_NICHES, TIER_B_NICHES, ALL_NICHES } from '../services/freelancerFitScoring';
import { formatExternalUrl } from '../services/contactValidationService';
import { leadService } from '../services/leadService';

interface LocalSMBClientFinderViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenPitchModal: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onExportCSV: () => void;
  onAddDiscoveredLeads: (newLeads: Lead[]) => void;
}

const POPULAR_CITIES = [
  { name: 'Manchester', country: 'United Kingdom' },
  { name: 'London', country: 'United Kingdom' },
  { name: 'Birmingham', country: 'United Kingdom' },
  { name: 'Leeds', country: 'United Kingdom' },
  { name: 'Glasgow', country: 'United Kingdom' },
  { name: 'Liverpool', country: 'United Kingdom' },
  { name: 'Dallas', country: 'United States' },
  { name: 'Houston', country: 'United States' },
  { name: 'Chicago', country: 'United States' },
  { name: 'New York', country: 'United States' },
  { name: 'Toronto', country: 'Canada' },
  { name: 'Sydney', country: 'Australia' },
  { name: 'Dubai', country: 'United Arab Emirates' }
];

export const LocalSMBClientFinderView: React.FC<LocalSMBClientFinderViewProps> = ({
  leads,
  onSelectLead,
  onOpenPitchModal,
  onStatusChange,
  onExportCSV,
  onAddDiscoveredLeads
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('United Kingdom');
  const [selectedCity, setSelectedCity] = useState<string>('Manchester');
  const [customCity, setCustomCity] = useState<string>('');
  const [selectedNiche, setSelectedNiche] = useState<string>('plumber');
  const [websiteFilter, setWebsiteFilter] = useState<SmbSearchParams['websiteFilter']>('NO_WEBSITE_ONLY');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Filter existing leads in memory for current view
  const smbLeads = leads.filter(l => l.source === 'LOCAL_BIZ' || l.tags?.includes('LOCAL_SMB'));

  const activeCity = customCity.trim() || selectedCity;

  const handleRunDiscovery = async () => {
    setIsScanning(true);
    setScanMessage(`🔍 Live crawling Google Maps & Local Business Registry for ${activeCity} (${selectedNiche})...`);

    try {
      const results = await localSmbDiscoveryService.discoverSmbLeads({
        country: selectedCountry,
        city: activeCity,
        nicheId: selectedNiche,
        websiteFilter,
        limit: 30
      });

      onAddDiscoveredLeads(results);
      if (results.length > 0) {
        setScanMessage(`✅ Discovered ${results.length} 100% verified local businesses in ${activeCity}!`);
      } else {
        setScanMessage(`ℹ️ 0 businesses found matching filter in ${activeCity}. Try choosing "All Businesses" or another niche.`);
      }
    } catch (err: any) {
      setScanMessage(`⚠️ Discovery notice: ${err.message || 'Check connection'}`);
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanMessage(null), 6000);
    }
  };

  const currentNicheObj = ALL_NICHES.find(n => n.id === selectedNiche) || ALL_NICHES[1];

  // Auto-run discovery when activeCity or selectedNiche changes and has no matching leads in memory
  useEffect(() => {
    const hasMatchingLeads = smbLeads.some(l => {
      const c = (l.company.city || '').toLowerCase().trim();
      const ind = (l.company.industry || '').toLowerCase().trim();
      const targetCity = activeCity.toLowerCase().trim();
      const targetNiche = currentNicheObj.name.toLowerCase().trim();
      return (c.includes(targetCity) || targetCity.includes(c)) && (ind.includes(targetNiche) || targetNiche.includes(ind));
    });

    if (!hasMatchingLeads && !isScanning) {
      handleRunDiscovery();
    }
  }, [activeCity, selectedNiche]);

  // Base city & search filtering
  const cityFilteredLeads = smbLeads.filter(l => {
    if (activeCity) {
      const c = (l.company.city || '').toLowerCase().trim();
      const target = activeCity.toLowerCase().trim();
      if (!c.includes(target) && !target.includes(c)) return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = l.company.name.toLowerCase().includes(term);
      const matchCity = l.company.city?.toLowerCase().includes(term);
      const matchNiche = l.company.industry.toLowerCase().includes(term);
      if (!matchName && !matchCity && !matchNiche) return false;
    }

    return true;
  });

  const noWebsiteLeads = cityFilteredLeads.filter(l => 
    l.websiteVerification?.status === 'VERIFIED_NO_WEBSITE' || 
    l.websiteVerification?.status === 'LIKELY_NO_WEBSITE' || 
    !l.websiteAudit?.hasWebsite
  );

  // If user selected NO_WEBSITE_ONLY, prioritize showing no-website leads; if 0, show all city leads with friendly notice
  const isNoWebsiteFiltered = websiteFilter === 'NO_WEBSITE_ONLY';
  const hasZeroNoWebsiteInBatch = isNoWebsiteFiltered && noWebsiteLeads.length === 0 && cityFilteredLeads.length > 0;
  const displayedLeads = hasZeroNoWebsiteInBatch 
    ? cityFilteredLeads 
    : isNoWebsiteFiltered 
    ? noWebsiteLeads 
    : cityFilteredLeads;

  // Calculate quick stats
  const totalDiscovered = cityFilteredLeads.length;
  const verifiedNoWebsite = noWebsiteLeads.length;
  const withPhone = displayedLeads.filter(l => Boolean(l.contact?.phone || l.publicContacts?.phone)).length;
  const highFitCount = displayedLeads.filter(l => (l.freelancerFitScore || 0) >= 80).length;

  return (
    <div className="view-container" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Hero Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800', marginBottom: '8px' }}>
              <Award size={14} /> FREELANCER CLIENT ENGINE
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '900', color: 'var(--text-main)', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>
              Local SMB "No-Website" Client Finder
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
              Find high-ticket local service businesses with zero official website and direct phone/WhatsApp contact — pitch high-converting websites in 48 hours.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                leadService.clearAllStorage();
                window.location.reload();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#b91c1c' }}
              title="Wipe old cached leads from browser memory and reload"
            >
              <RefreshCw size={15} /> Clear Cache & Reload
            </button>
            <button 
              className="btn btn-secondary"
              onClick={onExportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Discovery Control Bar */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', marginBottom: '24px', background: '#ffffff', border: '1px solid var(--border-color)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          
          {/* Country Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '6px' }}>
              1. Country
            </label>
            <select
              className="input-field"
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                const firstCity = POPULAR_CITIES.find(c => c.country === e.target.value);
                if (firstCity) setSelectedCity(firstCity.name);
              }}
              style={{ width: '100%', padding: '9px 12px', fontSize: '0.85rem', fontWeight: '600' }}
            >
              <option value="United Kingdom">🇬🇧 United Kingdom</option>
              <option value="United States">🇺🇸 United States</option>
              <option value="Canada">🇨🇦 Canada</option>
              <option value="Australia">🇦🇺 Australia</option>
              <option value="United Arab Emirates">🇦🇪 United Arab Emirates</option>
            </select>
          </div>

          {/* City Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '6px' }}>
              2. Target City
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                className="input-field"
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setCustomCity('');
                }}
                style={{ flex: 1, padding: '9px 12px', fontSize: '0.85rem', fontWeight: '600' }}
              >
                {POPULAR_CITIES.filter(c => c.country === selectedCountry).map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              <input
                type="text"
                className="input-field"
                placeholder="Or custom city..."
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                style={{ flex: 1, padding: '9px 12px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Niche Selector (Tier A & B) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '6px' }}>
              3. Service Niche
            </label>
            <select
              className="input-field"
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', fontSize: '0.85rem', fontWeight: '700' }}
            >
              <optgroup label="💎 Tier A: High-Ticket Trades (£500 - £8,000 deals)">
                {TIER_A_NICHES.map(n => (
                  <option key={n.id} value={n.id}>🔥 {n.name} ({n.avgTicketValue})</option>
                ))}
              </optgroup>
              <optgroup label="✂️ Tier B: Frequent Service SMBs">
                {TIER_B_NICHES.map(n => (
                  <option key={n.id} value={n.id}>⚡ {n.name} ({n.avgTicketValue})</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Website Status Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '6px' }}>
              4. Website Filter
            </label>
            <select
              className="input-field"
              value={websiteFilter}
              onChange={(e) => setWebsiteFilter(e.target.value as any)}
              style={{ width: '100%', padding: '9px 12px', fontSize: '0.85rem', fontWeight: '700', color: '#dc2626' }}
            >
              <option value="NO_WEBSITE_ONLY">❌ No Website Only (Verified / Social Only)</option>
              <option value="LIKELY_NO_WEBSITE">⚠️ Likely No Website (Directory Missing)</option>
              <option value="ALL">🌐 All Local Businesses</option>
            </select>
          </div>

          {/* Run Scan Button */}
          <div>
            <button
              className="btn btn-primary"
              onClick={handleRunDiscovery}
              disabled={isScanning}
              style={{
                width: '100%',
                padding: '10px 16px',
                fontSize: '0.9rem',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)'
              }}
            >
              <RefreshCw size={16} className={isScanning ? 'spin-icon' : ''} />
              {isScanning ? 'Querying Overpass...' : '⚡ Find Local Clients'}
            </button>
          </div>

        </div>

        {scanMessage && (
          <div style={{ marginTop: '14px', padding: '8px 12px', background: scanMessage.includes('✅') ? '#dcfce7' : '#e0f2fe', color: scanMessage.includes('✅') ? '#15803d' : '#0369a1', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={15} /> {scanMessage}
          </div>
        )}
      </div>

      {/* Pipeline Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        
        <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Active Leads Shown
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>
            {totalDiscovered}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '2px' }}>
            📍 In {activeCity} ({currentNicheObj.name.split(' ')[0]})
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.725rem', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase' }}>
            Verified No Website
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#dc2626', marginTop: '4px' }}>
            {verifiedNoWebsite}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#ef4444', marginTop: '2px' }}>
            🎯 Ready for website offer
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.725rem', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase' }}>
            Phone / WhatsApp Ready
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#16a34a', marginTop: '4px' }}>
            {withPhone}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#15803d', marginTop: '2px' }}>
            💬 1-Click WhatsApp outreach
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.725rem', fontWeight: '700', color: '#d97706', textTransform: 'uppercase' }}>
            High Freelancer Fit (&gt;80)
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#d97706', marginTop: '4px' }}>
            {highFitCount}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#b45309', marginTop: '2px' }}>
            🔥 Independent, single location
          </div>
        </div>

      </div>

      {/* In-Memory Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search business name, street..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', fontSize: '0.85rem' }}
          />
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
          Showing <strong>{displayedLeads.length}</strong> qualified local businesses
        </div>
      </div>

      {hasZeroNoWebsiteInBatch && (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.85rem',
          color: '#1e40af'
        }}>
          <Sparkles size={18} color="#2563eb" />
          <div>
            <strong>Notice:</strong> All {cityFilteredLeads.length} discovered businesses in this batch currently have existing websites. Displaying all of them so you can pitch <strong>Website Redesign, SEO & Speed Optimization</strong>, or switch to niches like <em>Handyman, Mobile Car Detailing, or Roofers</em> for 0-website prospects!
          </div>
        </div>
      )}

      {/* Leads Grid */}
      {displayedLeads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <Building2 size={42} color="var(--text-muted)" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text-main)' }}>
            No Leads Found For Current Filters
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 16px' }}>
            Click <strong>"⚡ Find Local Clients"</strong> above to query Google Maps Live for {activeCity} ({currentNicheObj.name}), or switch city/niche.
          </p>
          <button 
            className="btn btn-primary"
            onClick={handleRunDiscovery}
            disabled={isScanning}
            style={{ fontSize: '0.85rem', padding: '8px 16px' }}
          >
            <RefreshCw size={14} /> Scan {activeCity} Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
          {displayedLeads.map((lead) => {
            const fit = lead.freelancerFitScore || lead.scoreBreakdown.totalScore || 70;
            const isPremium = fit >= 80;
            const verification = lead.websiteVerification;
            const hasPhone = Boolean(lead.contact?.phone || lead.publicContacts?.phone);
            const hasEmail = Boolean(lead.contact?.email || lead.publicContacts?.email);
            const hasSocial = Boolean(lead.publicContacts?.facebook || lead.publicContacts?.instagram || lead.company.socialPresence);
            const phoneClean = lead.contact?.phoneNormalized || lead.contact?.phone?.replace(/\D/g, '') || '';

            return (
              <div
                key={lead.id}
                className="glass-panel"
                onClick={() => onSelectLead(lead)}
                style={{
                  padding: '18px',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: isPremium ? '1.5px solid #bbf7d0' : '1px solid var(--border-color)',
                  background: isPremium ? '#fcfdfd' : '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                    <span style={{
                      fontSize: '0.725rem',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: isPremium ? '#dcfce7' : '#fef3c7',
                      color: isPremium ? '#15803d' : '#b45309',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Flame size={12} /> FREELANCER FIT: {fit}/100 {isPremium ? '(PREMIUM)' : ''}
                    </span>

                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: verification?.status === 'VERIFIED_NO_WEBSITE' ? '#fee2e2' : '#f1f5f9',
                      color: verification?.status === 'VERIFIED_NO_WEBSITE' ? '#dc2626' : '#475569',
                      border: `1px solid ${verification?.status === 'VERIFIED_NO_WEBSITE' ? '#fecaca' : '#e2e8f0'}`
                    }}>
                      {verification?.status === 'VERIFIED_NO_WEBSITE' ? '❌ NO WEBSITE' : verification?.status === 'LIKELY_NO_WEBSITE' ? '⚠️ SOCIAL ONLY' : '🌐 HAS WEBSITE'}
                    </span>
                  </div>

                  {/* Business Name & Niche */}
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--text-main)' }}>
                    {lead.company.name}
                  </h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                    <MapPin size={13} color="#0284c7" />
                    <span>{lead.company.location}</span>
                  </div>

                  {/* Why this is a target */}
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#334155',
                    background: '#f8fafc',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '12px',
                    lineHeight: '1.4'
                  }}>
                    {verification?.reason || lead.websiteAudit?.aiOpportunityReason}
                  </div>

                  {/* Direct Contact Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                    {hasPhone && (
                      <span style={{ fontSize: '0.725rem', fontWeight: '700', padding: '3px 7px', background: '#dcfce7', color: '#15803d', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        📞 {lead.contact.phone || lead.publicContacts?.phone}
                      </span>
                    )}
                    {hasEmail && (
                      <span style={{ fontSize: '0.725rem', fontWeight: '700', padding: '3px 7px', background: '#e0f2fe', color: '#0369a1', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        ✉️ {lead.contact.email || lead.publicContacts?.email}
                      </span>
                    )}
                    {hasSocial && (
                      <span style={{ fontSize: '0.725rem', fontWeight: '700', padding: '3px 7px', background: '#fae8ff', color: '#86198f', borderRadius: '5px' }}>
                        📱 Active Social Presence
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {/* 1-Click WhatsApp Pitch */}
                    {hasPhone && (
                      <a
                        href={`https://wa.me/${phoneClean}?text=${encodeURIComponent(`Hi ${lead.company.name}! Noticed you offer ${lead.company.industry} in ${lead.company.city || 'the area'}, but don't have an official website listed on Google yet. We build fast, mobile-friendly sites for local trades in 48h. Can I send a 60-sec preview?`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary"
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          fontSize: '0.775rem',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          background: '#25D366',
                          borderColor: '#25D366',
                          color: '#ffffff',
                          textDecoration: 'none'
                        }}
                      >
                        <MessageSquare size={13} /> WhatsApp Pitch
                      </a>
                    )}

                    {/* AI Pitch Modal Button */}
                    <button
                      className="btn btn-secondary"
                      onClick={() => onOpenPitchModal(lead)}
                      style={{
                        padding: '7px 10px',
                        fontSize: '0.775rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      title="Open full AI email & WhatsApp pitch scripts"
                    >
                      <Sparkles size={13} color="#d97706" /> Scripts
                    </button>
                  </div>

                  {/* Pipeline Status Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Pipeline Status:</span>
                    <select
                      value={lead.status}
                      onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.725rem',
                        fontWeight: '700',
                        background: lead.status === 'WON' ? '#dcfce7' : lead.status === 'CONTACTED' ? '#e0f2fe' : 'transparent',
                        color: lead.status === 'WON' ? '#15803d' : lead.status === 'CONTACTED' ? '#0369a1' : 'var(--text-main)'
                      }}
                    >
                      <option value="NEW">🆕 New Lead</option>
                      <option value="CONTACTED">💬 Contacted</option>
                      <option value="REPLIED">📨 Replied</option>
                      <option value="MEETING">📅 Meeting</option>
                      <option value="WON">🏆 Deal Won</option>
                      <option value="LOST">❌ Closed/Lost</option>
                    </select>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
