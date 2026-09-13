import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Search, 
  Sparkles, 
  Download, 
  ExternalLink, 
  TrendingUp, 
  Linkedin, 
  Mail, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign,
  Award,
  Layers
} from 'lucide-react';
import { Lead, LeadStatus } from '../types';
import { startupFundingService, StartupSearchParams } from '../services/startupFundingService';

interface FundedStartupsViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenPitchModal: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onExportCSV: () => void;
  onAddDiscoveredLeads: (newLeads: Lead[]) => void;
}

export const FundedStartupsView: React.FC<FundedStartupsViewProps> = ({
  leads,
  onSelectLead,
  onOpenPitchModal,
  onStatusChange,
  onExportCSV,
  onAddDiscoveredLeads
}) => {
  const [stageFilter, setStageFilter] = useState<StartupSearchParams['stage']>('ALL');
  const [needFilter, setNeedFilter] = useState<StartupSearchParams['projectNeed']>('ALL');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filter ONLY leads from FUNDED_STARTUP source
  const startupLeads = leads.filter(l => l.source === 'FUNDED_STARTUP');

  useEffect(() => {
    if (startupLeads.length === 0 && !isScanning) {
      handleRunDiscovery();
    }
  }, []);

  const handleRunDiscovery = async () => {
    setIsScanning(true);
    try {
      const results = await startupFundingService.discoverFundedStartups({
        stage: stageFilter,
        projectNeed: needFilter,
        country: selectedCountry,
        query: searchTerm,
        limit: 50
      });
      onAddDiscoveredLeads(results);
    } catch (err) {
      console.error('Failed to discover funded startups:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const filteredLeads = startupLeads.filter(l => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      l.company.name.toLowerCase().includes(q) ||
      (l.contact.personName && l.contact.personName.toLowerCase().includes(q)) ||
      l.description.toLowerCase().includes(q);

    const matchesStage = stageFilter === 'ALL' || l.fundingInfo?.stage === stageFilter;
    const matchesNeed = needFilter === 'ALL' || l.projectNeed === needFilter;
    const matchesCountry = selectedCountry === 'ALL' || 
      (l.company.country && l.company.country.toLowerCase().includes(selectedCountry.toLowerCase()));

    return matchesSearch && matchesStage && matchesNeed && matchesCountry;
  });

  // Pagination calculations
  const totalItems = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      
      {/* Module Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #701a75 0%, #86198f 50%, #a21caf 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(134, 25, 143, 0.3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ background: '#f0abfc', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#701a75' }}>
              🚀 Module 4: Funded Startups & Launches
            </span>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem' }}>
              HackerNews Launch Intelligence (Show HN · Funding Signals)
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Venture-Backed Startups Actively Hiring Builders
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#f5d0fe', maxWidth: '650px', lineHeight: '1.5' }}>
            Startups with fresh capital ($250k - $4M+) under pressure to ship their MVP, mobile app, or backend architecture before their next runway check.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            <Download size={16} /> Export Startups CSV
          </button>

          <button
            onClick={handleRunDiscovery}
            disabled={isScanning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: '#e879f9',
              color: '#4a044e',
              fontWeight: '700',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              boxShadow: '0 4px 12px rgba(232, 121, 249, 0.4)'
            }}
          >
            {isScanning ? (
              <>⏳ Scanning Venture Databases...</>
            ) : (
              <>⚡ Refresh Funded Startups</>
            )}
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
        
        {/* Search */}
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search startup name, tech, or founder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              background: 'var(--bg-main)'
            }}
          />
        </div>

        {/* Funding Stage Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Round:</span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as any)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: 'var(--bg-main)' }}
          >
            <option value="ALL">All Funding Stages</option>
            <option value="SEED">Seed Stage ($1M - $3M)</option>
            <option value="PRE_SEED">Pre-Seed ($250k - $750k)</option>
            <option value="SERIES_A">Series A ($3M - $10M)</option>
            <option value="PRODUCT_HUNT">Product Hunt Top Launches</option>
          </select>
        </div>

        {/* Project Need */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Tech Need:</span>
          <select
            value={needFilter}
            onChange={(e) => setNeedFilter(e.target.value as any)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: 'var(--bg-main)' }}
          >
            <option value="ALL">All Tech Needs</option>
            <option value="SAAS_MVP">SaaS Fullstack MVP</option>
            <option value="MOBILE_APP">Mobile App (React Native / Flutter)</option>
            <option value="SPEED_PERFORMANCE">API Architecture & Speed</option>
          </select>
        </div>

        {/* Country */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Country:</span>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: 'var(--bg-main)' }}
          >
            <option value="ALL">Global / Any</option>
            <option value="United States">United States (SF / NYC)</option>
            <option value="United Kingdom">United Kingdom (London)</option>
            <option value="Canada">Canada (Toronto)</option>
            <option value="United Arab Emirates">UAE (Dubai)</option>
            <option value="Germany">Germany (Berlin)</option>
          </select>
        </div>

      </div>

      {/* Funded Startups Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {paginatedLeads.map(lead => {
          const isSeed = lead.fundingInfo?.stage === 'SEED' || lead.fundingInfo?.stage === 'SERIES_A';

          return (
            <div
              key={lead.id}
              onClick={() => onSelectLead(lead)}
              className="card"
              style={{
                padding: '20px',
                cursor: 'pointer',
                display: 'grid',
                gridTemplateColumns: '1fr 180px 220px 180px',
                gap: '20px',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                borderLeft: isSeed ? '4px solid #c026d3' : '4px solid #0284c7'
              }}
            >
              {/* Startup Information */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lead.company.name}
                  </span>

                  <span style={{
                    fontSize: '0.725rem',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: '#fae8ff',
                    color: '#a21caf',
                    border: '1px solid #f5d0fe'
                  }}>
                    💰 Raised {lead.fundingInfo?.amountRaised} • {lead.fundingInfo?.stage}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <a
                    href={lead.company.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: '0.8rem', color: '#0284c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
                  >
                    {lead.websiteAudit?.domain} <ExternalLink size={12} />
                  </a>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>•</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {lead.company.location}
                  </span>
                </div>

                <p style={{ margin: '6px 0 0 0', fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {lead.description}
                </p>
              </div>

              {/* Funding & Backers */}
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: '600' }}>
                    Lead Backer:
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    {lead.fundingInfo?.leadInvestor || 'Venture Capital'}
                  </div>
                  <div style={{
                    fontSize: '0.725rem',
                    color: '#7c3aed',
                    fontWeight: '700',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Award size={13} /> {lead.projectNeed.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              {/* Founder Contact & Verification */}
              <div onClick={(e) => e.stopPropagation()}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {lead.contact.personName} ({lead.contact.role})
                </div>

                {lead.contact.email && (
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                    <Mail size={12} /> {lead.contact.email}
                  </div>
                )}

                <div style={{ fontSize: '0.675rem', color: '#0284c7', fontWeight: '700', marginBottom: '6px' }}>
                  {lead.contact.emailValidationStage === 'DOMAIN_VALID'
                    ? '📧 INFERRED EMAIL'
                    : lead.contact.emailValidationStage === 'FOUND' || lead.contact.emailValidationStage === 'FORMAT_VALID'
                    ? '📬 EMAIL FOUND'
                    : lead.contact.emailValidationStage === 'MX_VALID' || lead.contact.emailValidationStage === 'VERIFIED'
                    ? '✅ EMAIL VERIFIED'
                    : '📧 EMAIL CONSTRUCTED'}
                </div>

                {lead.contact.linkedinUrl && (
                  <a
                    href={lead.contact.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.725rem',
                      color: '#0a66c2',
                      fontWeight: '700',
                      textDecoration: 'none'
                    }}
                  >
                    <Linkedin size={12} /> Founder Profile <ExternalLink size={10} />
                  </a>
                )}
              </div>

              {/* Actions & Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onOpenPitchModal(lead)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #a21caf 0%, #c026d3 100%)',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(192, 38, 211, 0.35)',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                >
                  <Sparkles size={14} /> Pitch Founder
                </button>

                <select
                  value={lead.status}
                  onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  <option value="NEW">Status: NEW</option>
                  <option value="CONTACTED">Status: CONTACTED</option>
                  <option value="REPLIED">Status: REPLIED</option>
                  <option value="WON">Status: WON (CLOSED)</option>
                </select>
              </div>

            </div>
          );
        })}

        {filteredLeads.length === 0 && !isScanning && (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <Rocket size={40} style={{ color: 'var(--text-dim)', marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>No Startups Found for Filter</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Try adjusting your funding round filter or click "Refresh Funded Startups".
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {startIndex + 1} - {endIndex} of {totalItems} Funded Startups
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
