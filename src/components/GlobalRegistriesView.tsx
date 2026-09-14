import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Globe2, 
  RefreshCw, 
  Download, 
  Flame, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink,
  MessageSquare,
  Mail,
  ShieldCheck,
  Zap,
  MapPin,
  Briefcase
} from 'lucide-react';
import { Lead, LeadStatus } from '../types';
import { globalRegistriesService, GLOBAL_REGISTRY_COUNTRIES } from '../services/globalRegistriesService';

interface GlobalRegistriesViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenPitchModal: (lead: Lead) => void;
  onStatusChange?: (leadId: string, status: LeadStatus) => void;
  onExportCSV: () => void;
  onAddDiscoveredLeads: (newLeads: Lead[]) => void;
}

export const GlobalRegistriesView: React.FC<GlobalRegistriesViewProps> = ({
  leads,
  onSelectLead,
  onOpenPitchModal,
  onExportCSV,
  onAddDiscoveredLeads
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('GLOBAL');
  const [timeframe, setTimeframe] = useState<'LAST_24H' | 'LAST_7D' | 'LAST_30D'>('LAST_7D');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Filter registry leads from central state
  const registryLeads = useMemo(() => {
    return leads.filter(l => l.source === 'GLOBAL_REGISTRY');
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const targetCountryObj = GLOBAL_REGISTRY_COUNTRIES.find(c => c.code === selectedCountry);
    const targetLabel = targetCountryObj && targetCountryObj.code !== 'GLOBAL' ? targetCountryObj.label.toLowerCase() : '';

    return registryLeads.filter(lead => {
      const matchesCountry = selectedCountry === 'GLOBAL' || !targetLabel
        || (lead.registryInfo && lead.registryInfo.country.toLowerCase().includes(targetLabel))
        || (lead.company.country && lead.company.country.toLowerCase().includes(targetLabel))
        || (lead.company.location && lead.company.location.toLowerCase().includes(targetLabel));

      const matchesSearch = !searchQuery 
        || lead.company.name.toLowerCase().includes(searchQuery.toLowerCase())
        || lead.title.toLowerCase().includes(searchQuery.toLowerCase())
        || (lead.contact.personName && lead.contact.personName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCountry && matchesSearch;
    });
  }, [registryLeads, selectedCountry, searchQuery]);

  const hotCount = filteredLeads.filter(l => l.scoreBreakdown.temperature === 'HOT').length;
  const noWebCount = filteredLeads.filter(l => !l.websiteAudit.hasWebsite).length;

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      const discovered = await globalRegistriesService.discoverRegistryLeads({
        country: selectedCountry,
        timeframe: timeframe,
        limit: 100
      });
      onAddDiscoveredLeads(discovered);
    } catch (err) {
      console.error('Registry scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        color: '#ffffff',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(30, 27, 75, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ background: '#4f46e5', color: '#ffffff', fontSize: '0.75rem', fontWeight: '800', padding: '4px 10px', borderRadius: '999px', letterSpacing: '0.05em' }}>
              GLOBAL DATA MODULE
            </span>
            <span style={{ color: '#a5b4fc', fontSize: '0.825rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Globe2 size={14} /> Official Business Registries Worldwide
            </span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '6px', color: '#ffffff' }}>
            Worldwide Corporate Registries & LLCs
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#c7d2fe', lineHeight: '1.5' }}>
            Discover newly incorporated companies across USA (Delaware/CA), UK (Companies House), UAE (Dubai DED), Canada, Singapore, and 10+ global jurisdictions with active web/app launch budgets.
          </p>
        </div>

        <button 
          onClick={handleRunScan}
          disabled={isScanning}
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '0.9rem',
            cursor: isScanning ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
          }}
        >
          <RefreshCw size={18} className={isScanning ? 'spin-icon' : ''} />
          {isScanning ? 'Scanning Registries...' : 'Scan Global Registries 🔄'}
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={16} color="var(--primary)" /> Registered Companies
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
            {filteredLeads.length}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={16} color="#ef4444" /> Hot Opportunities (80+)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
            {hotCount}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={16} color="#059669" /> Zero Website (Needs MVP)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
            {noWebCount}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button 
            onClick={onExportCSV}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: '#f8fafc',
              fontWeight: '700',
              fontSize: '0.85rem',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Download size={16} /> Export Registries CSV
          </button>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Country Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)' }}>
            Target Country Jurisdiction
          </label>
          <select 
            value={selectedCountry} 
            onChange={(e) => setSelectedCountry(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontWeight: '600',
              fontSize: '0.875rem',
              background: '#ffffff',
              minWidth: '220px'
            }}
          >
            {GLOBAL_REGISTRY_COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Timeframe Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)' }}>
            Incorporation Date
          </label>
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value as any)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontWeight: '600',
              fontSize: '0.875rem',
              background: '#ffffff'
            }}
          >
            <option value="LAST_24H">⚡ Last 24 Hours</option>
            <option value="LAST_7D">📅 Last 7 Days</option>
            <option value="LAST_30D">🗓️ Last 30 Days</option>
          </select>
        </div>

        {/* Search */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '220px' }}>
          <label style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)' }}>
            Search Company / Director
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search company name, director, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

      </div>

      {/* Grid of Leads */}
      {filteredLeads.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Building2 size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
            No Registry Leads Found for Selected Filter
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '6px' }}>
            Click "Scan Global Registries 🔄" above to pull live incorporated companies for {selectedCountry}.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filteredLeads.map((lead) => (
            <div 
              key={lead.id} 
              className="card" 
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: lead.scoreBreakdown.temperature === 'HOT' ? '4px solid #ef4444' : '4px solid #4f46e5'
              }}
            >
              <div>
                {/* Top Badges */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    background: '#ede9fe',
                    color: '#6d28d9',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Building2 size={12} /> {lead.registryInfo?.companyType || 'Corporate Registry'}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`badge badge-${lead.scoreBreakdown.temperature.toLowerCase()}`}>
                      <Flame size={12} /> {lead.scoreBreakdown.totalScore}/100
                    </span>
                  </div>
                </div>

                {/* Company Name & Title */}
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {lead.company.name}
                </h3>
                
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <MapPin size={13} /> {lead.company.location}
                </div>

                {/* Registry Details Box */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', marginBottom: '12px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Reg ID:</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontWeight: '700', color: 'var(--text-main)' }}>
                      {lead.registryInfo?.registrationId}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Incorporated:</span>
                    <span style={{ fontWeight: '700', color: '#059669' }}>
                      {lead.registryInfo?.incorporationDate}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Director:</span>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                      {lead.contact.personName}
                    </span>
                  </div>
                </div>

                {/* Opportunity Reason */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px', fontSize: '0.8rem', color: '#166534', marginBottom: '14px' }}>
                  <Sparkles size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  {lead.websiteAudit.aiOpportunityReason}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => onOpenPitchModal(lead)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Mail size={14} /> AI Cold Pitch
                </button>

                {lead.contact.hasWhatsapp && (
                  <a 
                    href={`https://wa.me/${lead.contact.phoneNormalized?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${lead.contact.personName}, congratulations on registering ${lead.company.name}! Do you have a developer set up for your web and mobile app launch?`)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #bbf7d0',
                      background: '#dcfce7',
                      color: '#15803d',
                      fontWeight: '700',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'none'
                    }}
                  >
                    <MessageSquare size={14} /> WhatsApp
                  </a>
                )}

                <button 
                  onClick={() => onSelectLead(lead)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: '#ffffff',
                    color: 'var(--text-main)',
                    fontWeight: '600',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Details
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
