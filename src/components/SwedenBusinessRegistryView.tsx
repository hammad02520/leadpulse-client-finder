import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Download, 
  Search, 
  Sparkles, 
  Filter, 
  DollarSign, 
  ExternalLink, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileText,
  Copy,
  Check,
  RefreshCw,
  X,
  Zap,
  Terminal
} from 'lucide-react';
import { Lead, LeadStatus } from '../types';
import { 
  swedenRegistryService, 
  SWEDISH_CITIES, 
  SWEDISH_INDUSTRIES, 
  SwedenFilterParams,
  ViesVerificationResult,
  BulkExportConfig
} from '../services/swedenRegistryService';

interface SwedenBusinessRegistryViewProps {
  onSelectLead: (lead: Lead) => void;
  onOpenPitchModal: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onAddDiscoveredLeads: (leads: Lead[]) => void;
}

export const SwedenBusinessRegistryView: React.FC<SwedenBusinessRegistryViewProps> = ({
  onSelectLead,
  onOpenPitchModal,
  onStatusChange,
  onAddDiscoveredLeads
}) => {
  const [displayLanguage, setDisplayLanguage] = useState<'EN' | 'SV'>('EN');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL');
  const [vatFilter, setVatFilter] = useState<SwedenFilterParams['vatStatusFilter']>('ALL');
  const [revenueFilter, setRevenueFilter] = useState<SwedenFilterParams['revenueTier']>('ALL');
  const [legalFormFilter, setLegalFormFilter] = useState<'ALL' | 'AB' | 'HB'>('ALL');
  const [excludeReklamsparr, setExcludeReklamsparr] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [totalMatchingCount, setTotalMatchingCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [isLiveDb, setIsLiveDb] = useState<boolean>(false);
  
  // Pitch Preview Modal state
  const [pitchLead, setPitchLead] = useState<Lead | null>(null);
  const [pitchLanguage, setPitchLanguage] = useState<'SVENSKA' | 'ENGLISH'>('SVENSKA');
  const [copiedPitch, setCopiedPitch] = useState<boolean>(false);

  // Live EU VIES Verification state
  const [viesResults, setViesResults] = useState<Record<string, ViesVerificationResult>>({});
  const [verifyingVat, setVerifyingVat] = useState<Record<string, boolean>>({});

  const handleVerifyVat = async (leadId: string, orgOrVat: string) => {
    if (verifyingVat[leadId]) return;
    setVerifyingVat(prev => ({ ...prev, [leadId]: true }));
    try {
      const res = await swedenRegistryService.verifyVatWithVies(orgOrVat);
      setViesResults(prev => ({ ...prev, [leadId]: res }));
    } catch (err) {
      console.error('VIES validation error:', err);
    } finally {
      setVerifyingVat(prev => ({ ...prev, [leadId]: false }));
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalMatchingCount / pageSize));

  // Load verified Swedish leads for a specific page
  const fetchSwedishLeads = async (page: number = currentPage, queryOverride?: string) => {
    setLoading(true);
    const query = queryOverride !== undefined ? queryOverride : searchQuery;
    const offset = (page - 1) * pageSize;
    try {
      const results = await swedenRegistryService.discoverSwedenLeads({
        municipality: selectedCity,
        industrySector: selectedIndustry,
        vatStatusFilter: vatFilter,
        revenueTier: revenueFilter,
        legalFormFilter,
        excludeReklamsparr,
        searchTerm: query,
        language: displayLanguage,
        limit: pageSize,
        offset
      });
      setLeads(results);
      setIsLiveDb(Boolean((results as any).isLiveDb));
      const count = (results as any).totalCount ?? results.length;
      setTotalMatchingCount(count);
      onAddDiscoveredLeads(results);
    } catch (err) {
      console.error('Failed to load Swedish leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage || loading) return;
    setCurrentPage(page);
    fetchSwedishLeads(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJumpPageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      handlePageChange(p);
      setJumpPageInput('');
    }
  };

  // Load more Swedish leads incrementally (append mode)
  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const nextBatch = await swedenRegistryService.discoverSwedenLeads({
        municipality: selectedCity,
        industrySector: selectedIndustry,
        vatStatusFilter: vatFilter,
        revenueTier: revenueFilter,
        legalFormFilter,
        excludeReklamsparr,
        searchTerm: searchQuery,
        language: displayLanguage,
        limit: pageSize,
        offset: leads.length
      });

      // Deduplicate by lead id or orgNumber
      const existingIds = new Set(leads.map(l => l.id));
      const existingOrgs = new Set(leads.map(l => l.swedenVatInfo?.orgNumber).filter(Boolean));
      const newItems = nextBatch.filter(
        l => !existingIds.has(l.id) && (!l.swedenVatInfo?.orgNumber || !existingOrgs.has(l.swedenVatInfo.orgNumber))
      );

      const combined = [...leads, ...newItems];
      setLeads(combined);
      onAddDiscoveredLeads(newItems);
    } catch (err) {
      console.error('Failed to load more Swedish leads:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchSwedishLeads(1);
  }, [selectedCity, selectedIndustry, vatFilter, revenueFilter, legalFormFilter, excludeReklamsparr, displayLanguage, pageSize]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSwedishLeads(1, searchQuery);
  };

  const handleExportCsv = () => {
    swedenRegistryService.exportSwedishCsv(leads);
  };

  const currentPitchText = useMemo(() => {
    if (!pitchLead) return '';
    return swedenRegistryService.generateSwedishPitch(pitchLead, pitchLanguage);
  }, [pitchLead, pitchLanguage]);

  const handleCopyPitch = () => {
    if (!currentPitchText) return;
    navigator.clipboard.writeText(currentPitchText);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2500);
  };

  // Metrics
  const totalVerifiedCount = leads.length;
  const noWebsiteCount = leads.filter(l => !l.websiteAudit?.hasWebsite).length;
  const totalRevenueCombined = leads.reduce((acc, l) => {
    const rev = parseFloat((l.swedenVatInfo?.revenueSek || '0').replace(/[^\d.]/g, '')) || 0;
    return acc + rev;
  }, 0);

  const isEn = displayLanguage === 'EN';

  const getVisiblePages = (): (number | string)[] => {
    const delta = 2;
    const pages: (number | string)[] = [];
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      pages.push(i);
    }
    if (currentPage - delta > 1) {
      pages.unshift('...');
      pages.unshift(1);
    }
    if (currentPage + delta < totalPages) {
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 🇸🇪 Swedish Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #005293 0%, #003a6b 100%)',
        borderRadius: '16px',
        padding: '28px 32px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(0, 82, 147, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        border: '1px solid rgba(254, 204, 0, 0.3)'
      }}>
        <div style={{ maxWidth: '750px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(254, 204, 0, 0.15)', border: '1px solid #fecc00', padding: '4px 12px', borderRadius: '999px', fontSize: '0.775rem', fontWeight: '800', color: '#fecc00' }}>
              <span>🇸🇪</span> {isEn ? 'BOLAGSVERKET & SCB HIGH-VALUE DATASET (EU 2023/138)' : 'BOLAGSVERKET & SCB OFFICIELLA DATASET (EU 2023/138)'}
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: isLiveDb ? 'rgba(74, 222, 128, 0.25)' : 'rgba(254, 204, 0, 0.2)',
              border: `1px solid ${isLiveDb ? '#4ade80' : '#fecc00'}`,
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '0.725rem',
              fontWeight: '800',
              color: isLiveDb ? '#4ade80' : '#fecc00'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isLiveDb ? '#4ade80' : '#fecc00', display: 'inline-block' }}></span>
              {isLiveDb 
                ? (isEn ? 'LIVE SQLITE DB (791,105 ACTIVE COMPANIES)' : 'LOKAL SQLITE DATABAS (791 105 AKTIVA BOLAG)')
                : (isEn ? 'OFFICIAL HVD REGISTRY PIPELINE' : 'OFFICIELLT BOLAGSREGISTER')}
            </span>

            {/* Language Switcher Toggle */}
            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
              <button
                onClick={() => { setDisplayLanguage('EN'); setPitchLanguage('ENGLISH'); }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  background: isEn ? '#ffffff' : 'transparent',
                  color: isEn ? '#005293' : '#e0f2fe'
                }}
              >
                🇬🇧 English Data
              </button>
              <button
                onClick={() => { setDisplayLanguage('SV'); setPitchLanguage('SVENSKA'); }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  background: !isEn ? '#fecc00' : 'transparent',
                  color: !isEn ? '#003a6b' : '#e0f2fe'
                }}
              >
                🇸🇪 Svenska Data
              </button>
            </div>
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: '900', letterSpacing: '-0.02em', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            Sweden VAT & Business Registry
          </h1>
          <p style={{ margin: 0, fontSize: '0.925rem', color: '#e0f2fe', lineHeight: '1.5' }}>
            {isEn 
              ? 'Real verified Swedish businesses from Bolagsverket & SCB HVD with 10-digit Modulo-10 Luhn Org.nr, native VAT status, F-skatt certification, Reklamspärr outreach filtering, and verified directory links.'
              : 'Officiellt registrerade svenska företag (Bolagsverket & SCB HVD) med 10-siffrigt Luhn-godkänt Org.nr, momsstatus, F-skattsedel, reklamspärrsfiltrering och säkra kataloglänkar.'}
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', padding: '12px 18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.15)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fecc00' }}>
              {totalMatchingCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.725rem', color: '#e0f2fe', fontWeight: '700', textTransform: 'uppercase' }}>
              {searchQuery.trim() ? (isEn ? 'Matching Results' : 'Matchade Företag') : (isEn ? 'Active Loaded Companies' : 'Aktiva Företag')}
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', padding: '12px 18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.15)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#4ade80' }}>
              {isEn ? `Page ${currentPage} / ${totalPages}` : `Sida ${currentPage} / ${totalPages}`}
            </div>
            <div style={{ fontSize: '0.725rem', color: '#e0f2fe', fontWeight: '700', textTransform: 'uppercase' }}>
              {isEn ? `Showing ${leads.length} on page` : `Visar ${leads.length} på sidan`}
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', padding: '12px 18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.15)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ffffff' }}>~{Math.round(totalRevenueCombined)}M SEK</div>
            <div style={{ fontSize: '0.725rem', color: '#e0f2fe', fontWeight: '700', textTransform: 'uppercase' }}>
              {isEn ? 'Page Revenue' : 'Sidoomsättning'}
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 Swedish Filter Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
      }}>
        
        {/* Top Search & Export row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={isEn ? "Search by company name, Org.nr (e.g. 556...), VAT nr, or keyword..." : "Sök på företagsnamn, Org.nr (t.ex. 556...), Momsnr, eller nyckelord..."}
                value={searchQuery}
                onChange={e => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val === '') {
                    setCurrentPage(1);
                    fetchSwedishLeads(1, '');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '9px 36px 9px 38px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.875rem'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                    fetchSwedishLeads(1, '');
                  }}
                  title={isEn ? "Clear search" : "Rensa sökning"}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '9px 18px', fontSize: '0.85rem' }}>
              <Search size={15} /> {isEn ? 'Search Companies' : 'Sök Företag'}
            </button>
          </form>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Page Size Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>
                {isEn ? 'Per Page:' : 'Per sida:'}
              </span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                style={{ padding: '3px 6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#ffffff', fontSize: '0.8rem', fontWeight: '800', color: '#005293', cursor: 'pointer' }}
                title={isEn ? "Number of Swedish companies per page" : "Antal bolag per sida"}
              >
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
                <option value={200}>200 / page</option>
              </select>
            </div>

            <button 
              onClick={() => fetchSwedishLeads(currentPage)}
              disabled={loading}
              className="btn btn-secondary"
              style={{ padding: '9px 14px', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
              title={isEn ? "Fetch fresh data from Bolagsverket & SCB HVD" : "Hämta färsk data från Bolagsverket & SCB"}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {isEn ? 'Refresh HVD Data' : 'Uppdatera Register'}
            </button>

            <button 
              onClick={handleExportCsv}
              className="btn btn-primary"
              style={{ padding: '9px 18px', fontSize: '0.85rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', background: '#005293', borderColor: '#005293', color: '#ffffff' }}
              title={isEn ? "Export genuine Swedish HVD leads currently loaded" : "Exportera äkta svenska registerleads"}
            >
              <Download size={16} /> {isEn ? `Export Verified HVD (${leads.length} CSV)` : `Exportera Verifierade (${leads.length} CSV)`}
            </button>
          </div>
        </div>

        {/* Dropdowns Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
          
          {/* City / Kommun */}
          <div>
            <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>
              📍 {isEn ? 'Municipality' : 'Kommun / Stad'}
            </label>
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: '#f8fafc', fontWeight: '600' }}
            >
              <option value="ALL">{isEn ? 'All Sweden (All 20 Cities)' : 'Hela Sverige (Alla 20 städer)'}</option>
              {SWEDISH_CITIES.map(c => (
                <option key={c.name} value={c.name}>{c.name} ({c.county})</option>
              ))}
            </select>
          </div>

          {/* Industry / Bransch */}
          <div>
            <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>
              🏢 {isEn ? 'Industry (SNI Code)' : 'Bransch (SNI)'}
            </label>
            <select
              value={selectedIndustry}
              onChange={e => setSelectedIndustry(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: '#f8fafc', fontWeight: '600' }}
            >
              <option value="ALL">{isEn ? 'All Industries' : 'Alla Branscher'}</option>
              {SWEDISH_INDUSTRIES.map(ind => (
                <option key={ind.id} value={ind.id}>
                  {isEn ? ind.nameEn : ind.nameSv} (SNI {ind.sniPrefix})
                </option>
              ))}
            </select>
          </div>

          {/* Legal Form (Bolagsform) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>
              ⚖️ {isEn ? 'Legal Form (Form)' : 'Bolagsform'}
            </label>
            <select
              value={legalFormFilter}
              onChange={e => setLegalFormFilter(e.target.value as any)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: '#f8fafc', fontWeight: '600' }}
            >
              <option value="ALL">{isEn ? 'All Forms (AB & HB)' : 'Alla former (AB & HB)'}</option>
              <option value="AB">{isEn ? 'Aktiebolag (AB) Only' : 'Endast Aktiebolag (AB)'}</option>
              <option value="HB">{isEn ? 'Handelsbolag (HB) Only' : 'Endast Handelsbolag (HB)'}</option>
            </select>
          </div>

          {/* VAT / Moms Status */}
          <div>
            <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>
              🛡️ {isEn ? 'VAT & Tax Compliance' : 'Moms & F-Skatt'}
            </label>
            <select
              value={vatFilter}
              onChange={e => setVatFilter(e.target.value as any)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: '#f8fafc', fontWeight: '600' }}
            >
              <option value="ALL">{isEn ? 'All Registry Records' : 'Alla Företag i Registret'}</option>
              <option value="VERIFIED_VAT_ONLY">{isEn ? '✅ Verified VAT (SE...01)' : '✅ Endast Momsregistrerade'}</option>
              <option value="F_SKATT_ONLY">{isEn ? '📜 Approved F-Tax (F-skatt)' : '📜 Endast Godkänd F-skatt'}</option>
              <option value="NO_WEBSITE_ONLY">{isEn ? '🔥 No Website (High Fit)' : '🔥 Saknar Hemsida (Högst potential)'}</option>
            </select>
          </div>

          {/* Revenue Tier */}
          <div>
            <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>
              💰 {isEn ? 'Turnover / Revenue (SEK)' : 'Omsättning (SEK)'}
            </label>
            <select
              value={revenueFilter}
              onChange={e => setRevenueFilter(e.target.value as any)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: '#f8fafc', fontWeight: '600' }}
            >
              <option value="ALL">{isEn ? 'All Turnover Tiers' : 'Alla Omsättningsnivåer'}</option>
              <option value="HIGH_REVENUE">{isEn ? '> 15M SEK (High Revenue)' : '> 15M SEK (Toppskikt)'}</option>
              <option value="MID_REVENUE">{isEn ? '5 - 15M SEK (Established)' : '5 - 15M SEK (Etablerade)'}</option>
              <option value="GROWTH">{isEn ? '< 5M SEK (Small Business)' : '< 5M SEK (Småföretag)'}</option>
            </select>
          </div>

          {/* Reklamspärr Outreach Safety Switch */}
          <div>
            <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>
              🛡️ {isEn ? 'Reklamspärr (Marketing)' : 'Reklamspärr (SCB)'}
            </label>
            <button
              type="button"
              onClick={() => setExcludeReklamsparr(!excludeReklamsparr)}
              style={{
                width: '100%',
                padding: '8px 8px',
                borderRadius: '8px',
                border: excludeReklamsparr ? '1px solid #16a34a' : '1px solid #d97706',
                background: excludeReklamsparr ? '#f0fdf4' : '#fffbeb',
                color: excludeReklamsparr ? '#15803d' : '#b45309',
                fontSize: '0.775rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
              title={isEn ? "Exclude entities with advertising block in Bolagsverket / SCB" : "Dölj företag med reklamspärr hos Bolagsverket / SCB"}
            >
              {excludeReklamsparr ? (
                <>
                  <ShieldCheck size={14} color="#16a34a" />
                  <span>{isEn ? 'Safe: Hide Blocked' : 'Säker: Dölj spärrade'}</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={14} color="#d97706" />
                  <span>{isEn ? 'Show All (Inc. Blocked)' : 'Visa även spärrade'}</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* 🏢 Business Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <RefreshCw size={36} className="animate-spin" style={{ color: '#005293', margin: '0 auto 16px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: '700' }}>
            {isEn ? 'Fetching verified data from Swedish Business Registry...' : 'Hämtar data från Svenska Bolagsregistret...'}
          </h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
            {isEn ? 'Synchronizing Organization numbers, VAT IDs (SE...01), and Skatteverket F-tax status.' : 'Synkroniserar Organisationsnummer, Momsstatus och Skatteverket F-skatt.'}
          </p>
        </div>
      ) : leads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <AlertTriangle size={36} style={{ color: '#d97706', margin: '0 auto 16px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: '700' }}>
            {isEn ? 'No companies matched your current filter' : 'Inga företag matchade din filtrering'}
          </h3>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 16px 0', fontSize: '0.85rem' }}>
            {isEn ? 'Try selecting "All Sweden" or clearing search keywords.' : 'Prova att välja "Hela Sverige" eller rensa sökordet.'}
          </p>
          <button 
            onClick={() => { setSelectedCity('ALL'); setSelectedIndustry('ALL'); setVatFilter('ALL'); setRevenueFilter('ALL'); setSearchQuery(''); }}
            className="btn btn-secondary"
          >
            {isEn ? 'Reset Filters' : 'Återställ filter'}
          </button>
        </div>
      ) : (
        <>
          {/* Top Pagination Navigation Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            padding: '10px 16px',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem'
          }}>
            <div style={{ fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#005293', fontWeight: '800' }}>
                🇸🇪 {isEn ? 'Directory Scope:' : 'Register:'}
              </span>
              <span>
                {isEn 
                  ? `Page ${currentPage.toLocaleString()} of ${totalPages.toLocaleString()} (${totalMatchingCount.toLocaleString()} Enterprises)`
                  : `Sida ${currentPage.toLocaleString()} av ${totalPages.toLocaleString()} (${totalMatchingCount.toLocaleString()} Företag)`}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.775rem', fontWeight: '700' }}
              >
                ‹ {isEn ? 'Previous Page' : 'Föregående'}
              </button>
              <span style={{ padding: '2px 10px', fontWeight: '800', color: '#005293', background: '#e0f2fe', borderRadius: '6px', fontSize: '0.8rem' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.775rem', fontWeight: '700' }}
              >
                {isEn ? 'Next Page' : 'Nästa'} ›
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(430px, 1fr))', gap: '18px' }}>
          {leads.map(lead => {
            const sw = lead.swedenVatInfo;
            const hasWebsite = lead.websiteAudit?.hasWebsite;

            return (
              <div 
                key={lead.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.15s ease'
                }}
              >
                
                {/* Header: Company Name & Type */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px' }}>
                        🇸🇪 Bolagsverket ({sw?.legalForm || 'AB'})
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={12} /> {isEn ? 'F-Tax: Approved' : 'F-Skatt: Godkänd'}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', background: sw?.marketingBlocked ? '#fef2f2' : '#f0fdf4', color: sw?.marketingBlocked ? '#b91c1c' : '#15803d', border: `1px solid ${sw?.marketingBlocked ? '#fecaca' : '#bbf7d0'}`, padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {sw?.marketingBlocked ? (
                          <><span>⚠️</span> {isEn ? 'Reklamspärr: Blocked' : 'Reklamspärr: Spärrad'}</>
                        ) : (
                          <><span>✉️</span> {isEn ? 'Reklamspärr: Allowed (Safe)' : 'Reklamspärr: Ej spärrad'}</>
                        )}
                      </span>
                    </div>

                    <h3 
                      onClick={() => onSelectLead(lead)}
                      style={{ 
                        margin: 0, 
                        fontSize: '1.05rem', 
                        fontWeight: '800', 
                        color: 'var(--text-main)', 
                        cursor: 'pointer',
                        lineHeight: '1.3'
                      }}
                    >
                      {lead.company.name}
                    </h3>

                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={13} color="#005293" />
                      <span>{sw?.municipality || lead.company.city}, {sw?.county}</span>
                    </div>
                  </div>
                </div>

                {/* Corporate Registry Identifiers Box */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontSize: '0.775rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.675rem', fontWeight: '700' }}>{isEn ? 'ORGANIZATION NUMBER' : 'ORGANISATIONSNUMMER'}</span>
                    <span style={{ fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>{sw?.orgNumber}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.675rem', fontWeight: '700' }}>{isEn ? 'VAT ID (MOMSNR)' : 'MOMSNUMMER (VAT)'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '800', color: '#16a34a', fontFamily: 'monospace' }}>{sw?.vatNumber}</span>
                      {viesResults[lead.id] ? (
                        <span 
                          title={viesResults[lead.id].statusMessage}
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: '800',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: viesResults[lead.id].isValid ? '#dcfce7' : '#fee2e2',
                            color: viesResults[lead.id].isValid ? '#15803d' : '#b91c1c',
                            cursor: 'help'
                          }}
                        >
                          {viesResults[lead.id].isValid ? (viesResults[lead.id].source === 'EU_VIES_OFFICIAL' ? '✓ EU VIES' : '✓ Luhn OK') : '✕ Invalid'}
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (sw?.vatNumber || sw?.orgNumber) {
                              handleVerifyVat(lead.id, sw.vatNumber || sw.orgNumber);
                            }
                          }}
                          disabled={verifyingVat[lead.id]}
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: '700',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#0369a1',
                            cursor: verifyingVat[lead.id] ? 'wait' : 'pointer'
                          }}
                        >
                          {verifyingVat[lead.id] ? '...' : (isEn ? 'Verify VIES' : 'Verifiera VIES')}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.675rem', fontWeight: '700' }}>{isEn ? 'ANNUAL TURNOVER (1 YR)' : 'OMSÄTTNING (1 ÅR)'}</span>
                    <span style={{ fontWeight: '800', color: '#0284c7' }}>{sw?.revenueSek}</span>
                    <a 
                      href={sw?.ratsitUrl || `https://www.ratsit.se/${lead.swedenVatInfo?.orgNumber?.replace(/\D/g, '') || ''}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ display: 'block', fontSize: '0.625rem', color: '#0369a1', textDecoration: 'underline', fontWeight: '700' }}
                      title="Se officiell årsredovisning på Ratsit (Global tillgång utan CloudFront blockering)"
                    >
                      {isEn ? 'Audited report (Ratsit) ↗' : 'Årsredovisning (Ratsit) ↗'}
                    </a>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.675rem', fontWeight: '700' }}>{isEn ? 'PROFIT AFTER TAX (1 YR)' : 'ÅRETS RESULTAT (1 ÅR)'}</span>
                    <span style={{ fontWeight: '700', color: '#059669' }}>{sw?.profitSek}</span>
                    <span style={{ display: 'block', fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                      {isEn ? '12 mo. fiscal' : '12 månader'}
                    </span>
                  </div>
                </div>

                {/* Industry & SNI */}
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text-main)' }}>{isEn ? 'Industry:' : 'Bransch:'} </strong> 
                  SNI {sw?.sniCode} — {sw?.sniDescription}
                </div>

                {/* Website & Opportunity Angle */}
                <div style={{
                  background: !lead.company.websiteUrl ? '#fffbeb' : '#f0fdf4',
                  border: `1px solid ${!lead.company.websiteUrl ? '#fef3c7' : '#bbf7d0'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: 0 }}>
                    {lead.company.websiteUrl ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#15803d', flexWrap: 'wrap' }}>
                        <Globe size={15} />
                        <a 
                          href={lead.company.websiteUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ color: '#0369a1', textDecoration: 'underline' }}
                        >
                          {lead.company.websiteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                        </a>
                        <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '4px' }}>
                          Webbplats ↗
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#64748b', flexWrap: 'wrap' }}>
                        <Globe size={15} color="#94a3b8" />
                        <span>{isEn ? 'No official website registered' : 'Saknar registrerad webbplats'}</span>
                      </div>
                    )}

                    {/* 🔍 1-Click Outbound Verification & Directory Helpers */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <a
                        href={sw?.googleUrl || `https://www.google.com/search?q=${encodeURIComponent(lead.company.name + ' ' + (lead.company.city || '') + ' hemsida')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '0.725rem', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', background: '#ffffff', color: '#005293', borderColor: '#cbd5e1' }}
                        title="Google Search"
                      >
                        <Search size={11} /> Google ↗
                      </a>
                      <a
                        href={sw?.hittaUrl || `https://www.hitta.se/s%C3%B6k?vad=${encodeURIComponent(lead.company.name + ' ' + (lead.company.city || ''))}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '0.725rem', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', background: '#ffffff', color: '#b45309', borderColor: '#cbd5e1' }}
                        title="Hitta.se (Sweden Phone & Address Directory — Global Access)"
                      >
                        <Phone size={11} /> Hitta.se ↗
                      </a>
                      <a
                        href={sw?.ratsitUrl || `https://www.ratsit.se/${lead.swedenVatInfo?.orgNumber?.replace(/\D/g, '') || ''}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '0.725rem', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', background: '#ffffff', color: '#15803d', borderColor: '#cbd5e1' }}
                        title="Ratsit.se (Official Swedish Corporate Finances — Global Access, No CloudFront Block)"
                      >
                        <Building2 size={11} /> Ratsit ↗
                      </a>
                      <a
                        href={sw?.allabolagUrl || `https://www.allabolag.se/${lead.swedenVatInfo?.orgNumber?.replace(/\D/g, '') || ''}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '0.725rem', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', background: '#f8fafc', color: '#64748b', borderColor: '#cbd5e1' }}
                        title="Allabolag.se (Requires European IP / VPN)"
                      >
                        <ExternalLink size={11} /> Allabolag (VPN) ↗
                      </a>
                    </div>
                  </div>
                </div>

                {/* Decision Maker & Contact */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', paddingTop: '6px', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{sw?.ceoOrContact}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      {lead.contact.phone || (isEn ? 'Direct phone via Hitta.se' : 'Telefon via Hitta.se')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {lead.contact.phone ? (
                      <a 
                        href={`tel:${lead.contact.phone}`} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                        title={isEn ? "Call directly" : "Ring direkt"}
                      >
                        <Phone size={13} color="#16a34a" /> {isEn ? 'Call' : 'Ring'}
                      </a>
                    ) : (
                      <a 
                        href={sw?.hittaUrl || `https://www.hitta.se/s%C3%B6k?vad=${encodeURIComponent(lead.company.name + ' ' + (lead.company.city || ''))}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary" 
                        style={{ padding: '5px 9px', fontSize: '0.725rem', color: '#005293', borderColor: '#cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                        title="Find verified phone number on Hitta.se"
                      >
                        <Phone size={11} color="#005293" /> {isEn ? 'Phone (Hitta) ↗' : 'Telefon (Hitta) ↗'}
                      </a>
                    )}
                    {lead.contact.email ? (
                      <a 
                        href={`mailto:${lead.contact.email}`} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                        title={isEn ? "Send email" : "Skicka e-post"}
                      >
                        <Mail size={13} color="#0284c7" /> {isEn ? 'Email' : 'Mail'}
                      </a>
                    ) : (
                      <a 
                        href={sw?.googleUrl || `https://www.google.com/search?q=${encodeURIComponent(lead.company.name + ' ' + (lead.company.city || '') + ' kontakt e-post')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary" 
                        style={{ padding: '5px 9px', fontSize: '0.725rem', color: '#0284c7', borderColor: '#cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                        title="Search verified contact & email on Google"
                      >
                        <Mail size={11} color="#0284c7" /> {isEn ? 'Find Email ↗' : 'Sök E-post ↗'}
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions row: Pitch Generator + CRM Status */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button 
                    onClick={() => setPitchLead(lead)}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem', background: '#005293', borderColor: '#005293', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Sparkles size={14} color="#fecc00" /> {isEn ? '✨ Generate Pitch' : 'Skapa Svensk Pitch'}
                  </button>

                  <select
                    value={lead.status}
                    onChange={e => onStatusChange(lead.id, e.target.value as LeadStatus)}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.775rem',
                      fontWeight: '700',
                      background: lead.status === 'NEW' ? '#ffffff' : '#f0fdf4',
                      color: lead.status === 'NEW' ? 'var(--text-main)' : '#15803d'
                    }}
                  >
                    <option value="NEW">{isEn ? 'Status: New' : 'Status: Ny'}</option>
                    <option value="CONTACTED">{isEn ? '📨 Contacted' : '📨 Kontaktad'}</option>
                    <option value="REPLIED">{isEn ? '💬 Replied' : '💬 Svarat'}</option>
                    <option value="MEETING">{isEn ? '📅 Meeting Booked' : '📅 Möte Bokat'}</option>
                    <option value="WON">{isEn ? '🎉 Won Deal' : '🎉 Vunnen Affär'}</option>
                  </select>
                </div>

              </div>
            );
          })}
        </div>
        </>
      )}

      {/* 🚀 Comprehensive Swedish Enterprise Pagination Bar */}
      {!loading && leads.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '24px',
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          {/* Main Pagination Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            {/* Scope info */}
            <div>
              <div style={{ fontSize: '0.925rem', color: 'var(--text-main)', fontWeight: '800' }}>
                {isEn 
                  ? `Page ${currentPage.toLocaleString()} of ${totalPages.toLocaleString()} (${totalMatchingCount.toLocaleString()} Matching Active Swedish Companies)`
                  : `Sida ${currentPage.toLocaleString()} av ${totalPages.toLocaleString()} (${totalMatchingCount.toLocaleString()} Matchande Aktiva Svenska Företag)`}
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                {isEn 
                  ? `Showing businesses ${Math.min((currentPage - 1) * pageSize + 1, totalMatchingCount).toLocaleString()} - ${Math.min(currentPage * pageSize, totalMatchingCount).toLocaleString()} of Swedish Registry`
                  : `Visar företag ${Math.min((currentPage - 1) * pageSize + 1, totalMatchingCount).toLocaleString()} - ${Math.min(currentPage * pageSize, totalMatchingCount).toLocaleString()} från Bolagsverket`}
              </div>
            </div>

            {/* Page number buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || loading}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: '800' }}
              >
                « {isEn ? 'First' : 'Första'}
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: '800' }}
              >
                ‹ {isEn ? 'Prev' : 'Föregående'}
              </button>

              {/* Number buttons around current page */}
              {getVisiblePages().map((p, idx) => {
                if (p === '...') {
                  return <span key={`dot_${idx}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontWeight: '700' }}>...</span>;
                }
                const pageNum = Number(p);
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={`page_btn_${pageNum}`}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: isActive ? '1px solid #005293' : '1px solid var(--border-color)',
                      background: isActive ? '#005293' : '#ffffff',
                      color: isActive ? '#ffffff' : 'var(--text-main)',
                      fontSize: '0.825rem',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: '800' }}
              >
                {isEn ? 'Next' : 'Nästa'} ›
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || loading}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: '800' }}
              >
                {isEn ? 'Last' : 'Sista'} »
              </button>
            </div>

            {/* Jump To Page Form */}
            <form onSubmit={handleJumpPageSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>
                {isEn ? 'Jump to Page:' : 'Gå till sida:'}
              </span>
              <input
                type="number"
                min={1}
                max={totalPages}
                placeholder={currentPage.toString()}
                value={jumpPageInput}
                onChange={e => setJumpPageInput(e.target.value)}
                style={{
                  width: '65px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                  textAlign: 'center',
                  fontWeight: '700'
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.775rem' }}>
                {isEn ? 'Go' : 'Gå'}
              </button>
            </form>
          </div>

          {/* Quick Page Jump Presets & Append Mode row */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.725rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  ⚡ {isEn ? 'Quick Jumps:' : 'Snabblänkar:'}
                </span>
                {[1, 5, 10, 20, 50, 100].filter(preset => preset <= totalPages).map(preset => (
                  <button
                    key={`preset_${preset}`}
                    onClick={() => handlePageChange(preset)}
                    disabled={loading || currentPage === preset}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '5px',
                      border: '1px solid var(--border-color)',
                      background: currentPage === preset ? '#e0f2fe' : '#f8fafc',
                      color: currentPage === preset ? '#005293' : 'var(--text-muted)',
                      fontSize: '0.725rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Page {preset}
                  </button>
                ))}
              </div>

              {/* Append Next Batch Button */}
              {leads.length < totalMatchingCount && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="btn btn-secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#005293',
                    borderColor: '#005293'
                  }}
                >
                  <RefreshCw size={14} className={loadingMore ? 'animate-spin' : ''} />
                  {loadingMore 
                    ? (isEn ? 'Appending next batch...' : 'Hämtar fler...') 
                    : (isEn ? `➕ Append Next (+${pageSize} to bottom)` : `➕ Lägg till fler (+${pageSize})`)}
                </button>
              )}
            </div>
          )}

        </div>
      )}

      {/* 🇸🇪 Swedish Pitch Generator Modal */}
      {pitchLead && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #005293'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#005293', textTransform: 'uppercase' }}>
                  🇸🇪 Tailored Swedish Outreach Pitch
                </div>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {pitchLead.company.name} ({pitchLead.swedenVatInfo?.orgNumber})
                </h3>
              </div>

              {/* Language Switcher */}
              <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '3px' }}>
                <button
                  onClick={() => setPitchLanguage('SVENSKA')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: pitchLanguage === 'SVENSKA' ? '#ffffff' : 'transparent',
                    color: pitchLanguage === 'SVENSKA' ? '#005293' : 'var(--text-muted)'
                  }}
                >
                  🇸🇪 Svenska
                </button>
                <button
                  onClick={() => setPitchLanguage('ENGLISH')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: pitchLanguage === 'ENGLISH' ? '#ffffff' : 'transparent',
                    color: pitchLanguage === 'ENGLISH' ? '#005293' : 'var(--text-muted)'
                  }}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem', color: '#166534' }}>
                💡 Denna pitch refererar automatiskt till deras <strong>Organisationsnummer</strong>, <strong>Omsättning ({pitchLead.swedenVatInfo?.revenueSek})</strong>, och specifika problematik.
              </div>

              <textarea
                readOnly
                value={currentPitchText}
                rows={14}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  lineHeight: '1.6',
                  color: '#1e293b',
                  background: '#f8fafc',
                  resize: 'none'
                }}
              />
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
              <button 
                onClick={() => setPitchLead(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Stäng
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                {pitchLead.contact.email && (
                  <a
                    href={`mailto:${pitchLead.contact.email}?subject=${encodeURIComponent(`Angående ${pitchLead.company.name} i ${pitchLead.company.city}`)}&body=${encodeURIComponent(currentPitchText)}`}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    <Mail size={15} color="#0284c7" /> Öppna i Mailklient
                  </a>
                )}

                <button 
                  onClick={handleCopyPitch}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.85rem', background: copiedPitch ? '#15803d' : '#005293', borderColor: copiedPitch ? '#15803d' : '#005293', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copiedPitch ? <Check size={16} /> : <Copy size={16} />}
                  {copiedPitch ? 'Kopierad!' : 'Kopiera Pitch'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
