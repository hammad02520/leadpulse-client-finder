import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
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
  Globe2
} from 'lucide-react';
import { Lead, OsmSearchParams, EmailValidationStage } from '../types';
import { overpassService } from '../services/overpassService';

interface LocalBizLeadsViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenPitchModal: (lead: Lead) => void;
  onAddDiscoveredLeads: (newLeads: Lead[]) => void;
}

const POPULAR_PRESETS = [
  { country: 'Sweden', city: 'Stockholm', label: '🇸🇪 Stockholm, Sweden' },
  { country: 'United Kingdom', city: 'London', label: '🇬🇧 London, UK' },
  { country: 'United States', city: 'New York', label: '🇺🇸 New York, USA' },
  { country: 'United States', city: 'Chicago', label: '🇺🇸 Chicago, USA' },
  { country: 'United States', city: 'Austin', label: '🇺🇸 Austin, USA' },
  { country: 'Germany', city: 'Berlin', label: '🇩🇪 Berlin, Germany' },
  { country: 'United Arab Emirates', city: 'Dubai', label: '🇦🇪 Dubai, UAE' },
  { country: 'Japan', city: 'Tokyo', label: '🇯🇵 Tokyo, Japan' },
  { country: 'Pakistan', city: 'Karachi', label: '🇵🇰 Karachi, Pakistan' },
  { country: 'Canada', city: 'Toronto', label: '🇨🇦 Toronto, Canada' }
];

export const LocalBizLeadsView: React.FC<LocalBizLeadsViewProps> = ({
  leads,
  onSelectLead,
  onOpenPitchModal,
  onAddDiscoveredLeads
}) => {
  const [country, setCountry] = useState('Sweden');
  const [city, setCity] = useState('Stockholm');
  const [category, setCategory] = useState<OsmSearchParams['category']>('restaurant');
  const [filterType, setFilterType] = useState<'ALL' | 'NO_WEBSITE' | 'HAS_WEBSITE_NO_APP'>('ALL');
  const [isSearchingOsm, setIsSearchingOsm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Strictly filter real OpenStreetMap local business nodes ONLY
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

  const handleRunOsmSearch = async () => {
    if (!city.trim() || !country.trim()) return;
    setIsSearchingOsm(true);
    try {
      const results = await overpassService.discoverOsmBusinesses({
        country: country.trim(),
        city: city.trim(),
        category,
        filterType
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
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Free Worldwide Geocoding (Nominatim API + Overpass QL)</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Worldwide Local Business Lead Finder
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Discover real local restaurants, bakeries, gyms, clinics, salons & shops via OpenStreetMap. Deep audit mobile responsiveness, booking widgets, and email/phone verification.
            </p>
          </div>

          <button 
            className="btn btn-primary"
            style={{ padding: '10px 22px', fontSize: '0.875rem', fontWeight: '700' }}
            onClick={handleRunOsmSearch}
            disabled={isSearchingOsm}
          >
            {isSearchingOsm ? '⏳ Geocoding & Scrape Overpass...' : `🚀 Search ${city}, ${country}`}
          </button>
        </div>
      </div>

      {/* Dynamic Global Geocoding Search Controls */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
            <Globe2 size={18} color="var(--primary)" /> Target Any City & Country in the World
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {POPULAR_PRESETS.slice(0, 5).map(p => (
              <button 
                key={p.city}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.725rem' }}
                onClick={() => {
                  setCountry(p.country);
                  setCity(p.city);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          
          {/* Custom Country Field */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Country (Type Any Country Worldwide)
            </label>
            <input 
              type="text"
              className="input-field"
              placeholder="e.g. Sweden, United Kingdom, Pakistan, Japan, UAE..."
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>

          {/* Custom City Field */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              City (Type Any City Worldwide)
            </label>
            <input 
              type="text"
              className="input-field"
              placeholder="e.g. Stockholm, London, Karachi, Tokyo, Dubai..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          {/* Category Selector */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Business Category
            </label>
            <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value as any)}>
              <option value="restaurant">🍽️ Restaurants & Dining</option>
              <option value="bakery">🥖 Bakeries & Cafes</option>
              <option value="gym">🏋️ Gyms & Fitness Studios</option>
              <option value="clinic">🩺 Clinics & Dentists</option>
              <option value="salon">💇 Salons & Spas</option>
              <option value="hotel">🏨 Hotels & Hospitality</option>
              <option value="car_repair">🚗 Auto Services & Detailing</option>
              <option value="boutique">🛍️ Retail Boutiques</option>
            </select>
          </div>

          {/* Filter Type */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Target Web & App Needs
            </label>
            <select className="input-field" value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
              <option value="ALL">🌐 All Business Listings</option>
              <option value="NO_WEBSITE">🚫 Zero Website & Zero App Only</option>
              <option value="HAS_WEBSITE_NO_APP">📲 Has Website, Missing App Only</option>
            </select>
          </div>

        </div>

        {/* Filter Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text"
            className="input-field"
            placeholder="Search discovered local leads by business name, city, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

      </div>

      {/* Discovered Leads Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {filteredLeads.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            <Building2 size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {isSearchingOsm ? '⏳ Querying OpenStreetMap Overpass API...' : 'No OpenStreetMap Local Businesses Loaded'}
            </h3>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              Type any city & country above and click <strong>"🚀 Search {city}, {country}"</strong> to discover real physical businesses via OpenStreetMap!
            </p>
          </div>
        ) : (
          filteredLeads.map(lead => {
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
                      📍 OpenStreetMap Business
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
                    <span style={{ color: '#0284c7' }}>{audit.techFramework || 'Audit complete'}</span>
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
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)', fontWeight: '600' }}>
                      <Mail size={13} color="var(--primary)" /> {lead.contact.email}
                    </span>
                    <span style={{ fontSize: '0.675rem', padding: '2px 6px', borderRadius: '4px', background: emailBadge.bg, color: emailBadge.text, border: `1px solid ${emailBadge.border}`, fontWeight: '700' }}>
                      {emailBadge.label}
                    </span>
                  </div>

                  {/* Phone with E.164 Normalization Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: '700' }}>
                      <Phone size={13} /> {lead.contact.phoneNormalized || lead.contact.phone}
                    </span>
                    <span style={{ fontSize: '0.675rem', padding: '2px 6px', borderRadius: '4px', background: '#d1fae5', color: '#059669', fontWeight: '700' }}>
                      <ShieldCheck size={11} style={{ display: 'inline', marginRight: '2px' }} /> E.164 VERIFIED
                    </span>
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

    </div>
  );
};
