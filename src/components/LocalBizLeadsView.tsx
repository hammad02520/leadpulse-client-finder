import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Search, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Phone, 
  Mail, 
  ShieldCheck,
  Smartphone,
  Calendar,
  ShoppingBag,
  Building2,
  Globe2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Zap,
  Activity,
  Download
} from 'lucide-react';
import { Lead, OsmSearchParams, EmailValidationStage } from '../types';
import { overpassService } from '../services/overpassService';
import { leadService } from '../services/leadService';

interface LocalBizLeadsViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenPitchModal: (lead: Lead) => void;
  onAddDiscoveredLeads: (newLeads: Lead[]) => void;
}

const COUNTRY_CITY_MAP: Record<string, string[]> = {
  'Pakistan': ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Peshawar', 'Multan'],
  'United States': ['New York', 'Chicago', 'Austin', 'Los Angeles', 'Miami', 'San Francisco', 'Dallas', 'Houston', 'Seattle'],
  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Leeds', 'Glasgow'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina'],
  'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
  'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth'],
  'Sweden': ['Stockholm', 'Gothenburg', 'Malmö'],
  'France': ['Paris', 'Lyon', 'Marseille'],
  'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad'],
  'Turkey': ['Istanbul', 'Ankara', 'Izmir'],
  'Italy': ['Rome', 'Milan', 'Florence'],
  'Spain': ['Madrid', 'Barcelona', 'Valencia'],
  'Netherlands': ['Amsterdam', 'Rotterdam'],
  'Brazil': ['São Paulo', 'Rio de Janeiro']
};

export const LocalBizLeadsView: React.FC<LocalBizLeadsViewProps> = ({
  leads,
  onSelectLead,
  onOpenPitchModal,
  onAddDiscoveredLeads
}) => {
  // Initialize with user saved location preference or global default
  const getInitialPref = () => {
    try {
      const saved = localStorage.getItem('leadpulse_osm_pref');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.country && parsed.city) return parsed;
      }
    } catch {
      // ignore
    }
    return { country: 'United States', city: 'New York' };
  };

  const initialPref = getInitialPref();

  const [selectedCountry, setSelectedCountry] = useState<string>(initialPref.country);
  const [customCountry, setCustomCountry] = useState('');
  
  const [selectedCity, setSelectedCity] = useState<string>(initialPref.city);
  const [customCity, setCustomCity] = useState('');

  const [category, setCategory] = useState<OsmSearchParams['category']>('all');
  const [filterType, setFilterType] = useState<'ALL' | 'NO_WEBSITE' | 'HAS_WEBSITE_NO_APP'>('ALL');
  const [fetchLimit, setFetchLimit] = useState<number>(500);
  const [isSearchingOsm, setIsSearchingOsm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Active Country & City resolving
  const activeCountry = selectedCountry === 'CUSTOM' ? customCountry : selectedCountry;
  const activeCity = selectedCity === 'CUSTOM' ? customCity : selectedCity;

  // Update cities dropdown whenever country changes
  useEffect(() => {
    if (selectedCountry !== 'CUSTOM' && COUNTRY_CITY_MAP[selectedCountry]) {
      setSelectedCity(COUNTRY_CITY_MAP[selectedCountry][0]);
    }
  }, [selectedCountry]);

  // Save preference on change
  useEffect(() => {
    if (activeCountry && activeCity) {
      localStorage.setItem('leadpulse_osm_pref', JSON.stringify({
        country: activeCountry,
        city: activeCity
      }));
    }
  }, [activeCountry, activeCity]);

  // Filter real OpenStreetMap local business nodes ONLY
  const localLeads = leads.filter(l => l.source === 'LOCAL_BIZ' && (l.tags.includes('OPENSTREETMAP') || l.sourceUrl.includes('openstreetmap')));

  // Auto-run initial search if zero OSM leads exist
  useEffect(() => {
    if (localLeads.length === 0 && !isSearchingOsm) {
      handleRunOsmSearch();
    }
  }, []);

  const filteredLeads = localLeads.filter(l => {
    const matchesSearch = 
      l.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.company.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilterType = 
      filterType === 'ALL' ||
      (filterType === 'NO_WEBSITE' && l.projectNeed === 'NO_WEBSITE_NO_APP') ||
      (filterType === 'HAS_WEBSITE_NO_APP' && l.projectNeed === 'HAS_WEBSITE_NO_APP');

    return matchesSearch && matchesFilterType;
  });

  // Reset to page 1 whenever filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, category, localLeads.length]);

  const handleRunOsmSearch = async () => {
    const finalCountry = activeCountry.trim();
    const finalCity = activeCity.trim();
    if (!finalCity || !finalCountry) return;

    setIsSearchingOsm(true);
    try {
      const results = await overpassService.discoverOsmBusinesses({
        country: finalCountry,
        city: finalCity,
        category,
        filterType,
        limit: fetchLimit
      });
      onAddDiscoveredLeads(results);
    } catch (e) {
      console.error('OSM Global Search Error:', e);
    } finally {
      setIsSearchingOsm(false);
    }
  };

  const getEmailBadgeColor = (stage?: EmailValidationStage) => {
    switch (stage) {
      case 'VERIFIED': return { bg: '#d1fae5', text: '#059669', border: '#a7f3d0', label: '✅ VERIFIED MAILBOX' };
      case 'MX_VALID': return { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd', label: '📬 MX VALID' };
      case 'DOMAIN_VALID': return { bg: '#fef3c7', text: '#d97706', border: '#fde68a', label: '🌐 DOMAIN VALID' };
      default: return { bg: '#f4f4f5', text: '#71717a', border: '#e4e4e7', label: '✉️ EMAIL FOUND' };
    }
  };

  // Pagination calculation
  const totalItems = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f4f4f5 100%)', borderLeft: '5px solid var(--primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-hot" style={{ fontSize: '0.75rem' }}>
                📍 OpenStreetMap Dynamic Global Engine
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Worldwide Geocoding + Overpass QL API (Total OSM Leads in CRM: {localLeads.length})
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Worldwide Local Business Lead Finder
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Search real physical businesses across Pakistan, United States, UK, UAE, Saudi Arabia, Canada, Germany & 50+ countries.
            </p>
          </div>

          <button 
            className="btn btn-primary"
            style={{ padding: '10px 22px', fontSize: '0.875rem', fontWeight: '700' }}
            onClick={handleRunOsmSearch}
            disabled={isSearchingOsm}
          >
            {isSearchingOsm ? `⏳ Fetching ${fetchLimit} Leads...` : `🚀 Fetch ${fetchLimit} Leads in ${activeCity}, ${activeCountry}`}
          </button>
        </div>
      </div>

      {/* Dynamic Global Geocoding Search Controls */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
            <Globe2 size={18} color="var(--primary)" /> Global Country, City & Category Filters
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Configured Fetch Batch: <strong>{fetchLimit} Nodes</strong>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          
          {/* Country Dropdown */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Country
            </label>
            <select 
              className="input-field"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="Pakistan">🇵🇰 Pakistan</option>
              <option value="United States">🇺🇸 United States</option>
              <option value="United Kingdom">🇬🇧 United Kingdom</option>
              <option value="United Arab Emirates">🇦🇪 United Arab Emirates</option>
              <option value="Saudi Arabia">🇸🇦 Saudi Arabia</option>
              <option value="Canada">🇨🇦 Canada</option>
              <option value="Germany">🇩🇪 Germany</option>
              <option value="Australia">🇦🇺 Australia</option>
              <option value="Sweden">🇸🇪 Sweden</option>
              <option value="France">🇫🇷 France</option>
              <option value="India">🇮🇳 India</option>
              <option value="Turkey">🇹🇷 Turkey</option>
              <option value="Italy">🇮🇹 Italy</option>
              <option value="Spain">🇪🇸 Spain</option>
              <option value="Netherlands">🇳🇱 Netherlands</option>
              <option value="Brazil">🇧🇷 Brazil</option>
              <option value="CUSTOM">✍️ Enter Custom Country...</option>
            </select>
            {selectedCountry === 'CUSTOM' && (
              <input 
                type="text"
                className="input-field"
                style={{ marginTop: '6px' }}
                placeholder="Type custom country..."
                value={customCountry}
                onChange={(e) => setCustomCountry(e.target.value)}
              />
            )}
          </div>

          {/* City Dropdown */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              City
            </label>
            <select 
              className="input-field"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              {selectedCountry !== 'CUSTOM' && COUNTRY_CITY_MAP[selectedCountry] ? (
                COUNTRY_CITY_MAP[selectedCountry].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))
              ) : null}
              <option value="CUSTOM">✍️ Enter Custom City...</option>
            </select>
            {selectedCity === 'CUSTOM' && (
              <input 
                type="text"
                className="input-field"
                style={{ marginTop: '6px' }}
                placeholder="Type custom city..."
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
              />
            )}
          </div>

          {/* Category Selector */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Industry Category
            </label>
            <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value as any)}>
              <option value="all">🌟 All Commercial Businesses</option>
              <option value="restaurant">🍽️ Restaurants & Food</option>
              <option value="cafe">☕ Cafes & Coffee Shops</option>
              <option value="bakery">🥖 Bakeries</option>
              <option value="gym">🏋️ Gyms & Fitness Centers</option>
              <option value="clinic">🩺 Clinics & Healthcare</option>
              <option value="salon">💇 Salons & Spas</option>
              <option value="hotel">🏨 Hotels & Hospitality</option>
              <option value="car_repair">🚗 Auto Repair & Garages</option>
              <option value="boutique">🛍️ Boutiques & Retail</option>
            </select>
          </div>

          {/* Target Filter Type */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Digital Presence Need
            </label>
            <select className="input-field" value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
              <option value="ALL">🌐 All Business Listings</option>
              <option value="NO_WEBSITE">🚫 Zero Website & Zero App Only</option>
              <option value="HAS_WEBSITE_NO_APP">📲 Has Website, Missing App Only</option>
            </select>
          </div>

          {/* Batch Limit Selector (Up to 1,000+) */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Query Lead Volume
            </label>
            <select 
              className="input-field" 
              value={fetchLimit} 
              onChange={(e) => setFetchLimit(Number(e.target.value))}
            >
              <option value={100}>⚡ 100 Leads (Fastest)</option>
              <option value={300}>🎯 300 Leads (Balanced)</option>
              <option value={500}>🚀 500 Leads (High Volume)</option>
              <option value={1000}>🔥 1,000+ Leads (Deep Scan)</option>
            </select>
          </div>

        </div>

        {/* Dynamic Action Trigger Bar inside Filter Panel */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '600' }}>
            Selected: <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{activeCity}, {activeCountry}</span> • Category: <span style={{ color: '#0284c7', fontWeight: '700' }}>{category.toUpperCase()}</span> • Volume: <span style={{ color: '#d97706', fontWeight: '700' }}>{fetchLimit} Leads</span>
          </div>

          <button 
            className="btn btn-primary"
            style={{ padding: '8px 20px', fontSize: '0.85rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={handleRunOsmSearch}
            disabled={isSearchingOsm}
          >
            {isSearchingOsm ? `⏳ Fetching ${fetchLimit} Leads...` : `🚀 Fetch ${fetchLimit} Leads in ${activeCity}`}
          </button>
        </div>

        {/* Filter Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text"
            className="input-field"
            placeholder="Search discovered local leads by business name, city, address, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

      </div>

      {/* Pagination Controls Bar - Top */}
      {totalItems > 0 && (
        <div className="glass-panel" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{startIndex + 1}–{endIndex}</strong> of <strong>{totalItems.toLocaleString()}</strong> leads in <strong>{activeCity}, {activeCountry}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Page size selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Show:</span>
              <select 
                className="input-field" 
                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={20}>20 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            {/* Page navigation buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button 
                className="btn btn-secondary"
                style={{ padding: '4px 8px' }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                title="First Page"
              >
                <ChevronsLeft size={16} />
              </button>

              <button 
                className="btn btn-secondary"
                style={{ padding: '4px 8px' }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              <span style={{ fontSize: '0.85rem', fontWeight: '700', padding: '0 8px', color: 'var(--text-main)' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button 
                className="btn btn-secondary"
                style={{ padding: '4px 8px' }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>

              <button 
                className="btn btn-secondary"
                style={{ padding: '4px 8px' }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Last Page"
              >
                <ChevronsRight size={16} />
              </button>
            </div>

            {/* Direct Export Button for Local SMBs */}
            <button 
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px', fontWeight: '700', border: '1px solid var(--primary)', color: 'var(--primary)' }}
              onClick={() => leadService.exportLeadsToCSV(filteredLeads, 'LOCAL_SMB')}
              title="Export all currently filtered Local SMBs to Excel / CSV"
            >
              <Download size={14} /> Export {filteredLeads.length} SMBs (Excel/CSV)
            </button>
          </div>
        </div>
      )}

      {/* Discovered Leads Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {totalItems === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            <Building2 size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {isSearchingOsm ? `⏳ Querying up to ${fetchLimit} OpenStreetMap nodes for ${activeCity}, ${activeCountry}...` : 'No OpenStreetMap Local Businesses Found'}
            </h3>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              Select city & country from the dropdowns above and click <strong>"🚀 Fetch {fetchLimit} Leads in {activeCity}"</strong>!
            </p>
          </div>
        ) : (
          paginatedLeads.map(lead => {
            const audit = lead.websiteAudit;
            const emailBadge = getEmailBadgeColor(lead.contact.emailValidationStage);
            const score = lead.scoreBreakdown.totalScore;

            return (
              <div 
                key={lead.id}
                className="glass-panel"
                style={{ 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  gap: '14px',
                  borderTop: `4px solid ${score >= 80 ? '#e11d48' : '#0284c7'}` 
                }}
              >
                {/* Top Title & Score */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className={`badge ${score >= 80 ? 'badge-hot' : 'badge-warm'}`}>
                      <Flame size={12} /> Score {score}/100
                    </span>
                    <span style={{ fontSize: '0.725rem', color: '#059669', background: '#d1fae5', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                      📍 OSM Node
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1.3' }}>
                    {lead.company.name}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700', marginTop: '2px' }}>
                    {lead.company.industry} • {lead.company.location}
                  </div>
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
                    {lead.description}
                  </p>
                </div>

                {/* Technical Website Checklist & Verification */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  
                  <div style={{ fontWeight: '700', color: '#3f3f46', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Technical Audit Checklist</span>
                    <span style={{ color: '#0284c7' }}>
                      {audit.isLiveAudit ? '⚡ Live PageSpeed' : (audit.techFramework || 'Audit complete')}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {audit.hasWebsite ? <CheckCircle2 size={13} color="#059669" /> : <XCircle size={13} color="#dc2626" />}
                      <span>Website: {audit.hasWebsite ? 'Online' : '❌ Missing'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {audit.hasHttps ? <CheckCircle2 size={13} color="#059669" /> : <XCircle size={13} color="#dc2626" />}
                      <span>HTTPS SSL: {audit.hasHttps ? 'Secure' : '❌ Unsecure'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {audit.mobileFriendly ? <CheckCircle2 size={13} color="#059669" /> : <XCircle size={13} color="#dc2626" />}
                      <span>Mobile Responsive: {audit.mobileFriendly ? 'Yes' : '❌ No'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {audit.hasMobileApp ? <CheckCircle2 size={13} color="#059669" /> : <Smartphone size={13} color="#d97706" />}
                      <span>Mobile App: {audit.hasMobileApp ? 'Yes' : '❌ Missing'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {audit.hasOnlineBooking ? <CheckCircle2 size={13} color="#059669" /> : <Calendar size={13} color="#dc2626" />}
                      <span>Booking Widget: {audit.hasOnlineBooking ? 'Active' : '❌ None'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {audit.hasOnlineOrdering ? <CheckCircle2 size={13} color="#059669" /> : <ShoppingBag size={13} color="#dc2626" />}
                      <span>Online Store: {audit.hasOnlineOrdering ? 'Active' : '❌ None'}</span>
                    </div>
                  </div>

                </div>

                {/* Verified Contact Details Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.775rem' }}>
                  
                  {/* Email with Multi-Stage Validation Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    {lead.contact.email ? (
                      <>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Mail size={13} color="var(--primary)" /> {lead.contact.email}
                        </span>
                        <span style={{ fontSize: '0.675rem', padding: '2px 6px', borderRadius: '4px', background: emailBadge.bg, color: emailBadge.text, border: `1px solid ${emailBadge.border}`, fontWeight: '700', whiteSpace: 'nowrap' }}>
                          {emailBadge.label}
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                          <Mail size={13} color="var(--text-muted)" /> No email listed on OSM
                        </span>
                        <a 
                          href={`https://www.google.com/search?q=${encodeURIComponent('contact email ' + lead.company.name + ' ' + lead.company.location)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.675rem', padding: '2px 6px', borderRadius: '4px', background: '#f4f4f5', color: 'var(--primary)', border: '1px solid var(--border-color)', fontWeight: '700', textDecoration: 'none', whiteSpace: 'nowrap' }}
                        >
                          🔍 Find Email ↗
                        </a>
                      </>
                    )}
                  </div>

                  {/* Phone with E.164 Normalization Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    {lead.contact.phone ? (
                      <>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: '700' }}>
                          <Phone size={13} /> {lead.contact.phoneNormalized || lead.contact.phone}
                        </span>
                        <span style={{ fontSize: '0.675rem', padding: '2px 6px', borderRadius: '4px', background: '#d1fae5', color: '#059669', fontWeight: '700', whiteSpace: 'nowrap' }}>
                          <ShieldCheck size={11} style={{ display: 'inline', marginRight: '2px' }} /> VERIFIED PHONE
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                          <Phone size={13} color="var(--text-muted)" /> Phone not mapped on OSM
                        </span>
                        <a 
                          href={`https://www.google.com/search?q=${encodeURIComponent(lead.company.name + ' ' + lead.company.location + ' phone number')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.675rem', padding: '2px 6px', borderRadius: '4px', background: '#f4f4f5', color: '#059669', border: '1px solid var(--border-color)', fontWeight: '700', textDecoration: 'none', whiteSpace: 'nowrap' }}
                        >
                          🔍 Google Phone ↗
                        </a>
                      </>
                    )}
                  </div>

                </div>

                {/* Footer Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  {lead.company.websiteUrl ? (
                    <a 
                      href={lead.company.websiteUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ fontSize: '0.775rem', color: '#0284c7', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                    >
                      <Globe size={13} /> Open Site ↗
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.725rem', color: '#dc2626', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                      🚫 Zero Website
                    </span>
                  )}

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      onClick={() => onSelectLead(lead)}
                    >
                      Inspect Audit
                    </button>
                    <button 
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      onClick={() => onOpenPitchModal(lead)}
                    >
                      <Sparkles size={13} /> Pitch
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls Bar - Bottom */}
      {totalPages > 1 && (
        <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{startIndex + 1}–{endIndex}</strong> of <strong>{totalItems.toLocaleString()}</strong> businesses
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button 
              className="btn btn-secondary"
              style={{ padding: '6px 10px' }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              <ChevronsLeft size={16} />
            </button>

            <button 
              className="btn btn-secondary"
              style={{ padding: '6px 10px' }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={16} />
            </button>

            {getPageNumbers().map((p, idx) => (
              typeof p === 'number' ? (
                <button
                  key={idx}
                  className={`btn ${p === currentPage ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ minWidth: '34px', padding: '6px 10px', fontSize: '0.85rem', fontWeight: p === currentPage ? '800' : '500' }}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ) : (
                <span key={idx} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>
              )
            ))}

            <button 
              className="btn btn-secondary"
              style={{ padding: '6px 10px' }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              <ChevronRight size={16} />
            </button>

            <button 
              className="btn btn-secondary"
              style={{ padding: '6px 10px' }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
