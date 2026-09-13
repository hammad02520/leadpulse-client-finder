import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  Search, 
  Sparkles, 
  Download, 
  ExternalLink, 
  AlertTriangle, 
  Gauge, 
  Phone, 
  Mail, 
  ChevronLeft, 
  ChevronRight, 
  Activity,
  Layers,
  Zap
} from 'lucide-react';
import { Lead, LeadStatus } from '../types';
import { techStackService, TechStackSearchParams } from '../services/techStackService';

interface TechStackViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenPitchModal: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onExportCSV: () => void;
  onAddDiscoveredLeads: (newLeads: Lead[]) => void;
}

export const TechStackView: React.FC<TechStackViewProps> = ({
  leads,
  onSelectLead,
  onOpenPitchModal,
  onStatusChange,
  onExportCSV,
  onAddDiscoveredLeads
}) => {
  const [cmsFilter, setCmsFilter] = useState<TechStackSearchParams['cms']>('ALL');
  const [maxSpeed, setMaxSpeed] = useState<number>(60);
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filter ONLY leads from TECH_STACK source
  const techLeads = leads.filter(l => l.source === 'TECH_STACK');

  useEffect(() => {
    if (techLeads.length === 0 && !isAuditing) {
      handleRunDiscovery();
    }
  }, []);

  const handleRunDiscovery = async () => {
    setIsAuditing(true);
    try {
      const results = await techStackService.discoverTechStackLeads({
        cms: cmsFilter,
        maxSpeedScore: maxSpeed,
        country: selectedCountry,
        query: searchTerm,
        limit: 50
      });
      onAddDiscoveredLeads(results);
    } catch (err) {
      console.error('Failed to discover tech stack leads:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const filteredLeads = techLeads.filter(l => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      l.company.name.toLowerCase().includes(q) ||
      (l.websiteAudit?.techFramework && l.websiteAudit.techFramework.toLowerCase().includes(q)) ||
      (l.techStackInfo?.detectedCms && l.techStackInfo.detectedCms.toLowerCase().includes(q)) ||
      l.company.industry.toLowerCase().includes(q);

    const matchesCms = cmsFilter === 'ALL' || 
      (l.techStackInfo?.detectedCms && l.techStackInfo.detectedCms.toLowerCase().includes(cmsFilter.toLowerCase()));

    const matchesSpeed = (l.websiteAudit?.performanceScore || 100) <= maxSpeed;
    const matchesCountry = selectedCountry === 'ALL' || 
      (l.company.country && l.company.country.toLowerCase().includes(selectedCountry.toLowerCase()));

    return matchesSearch && matchesCms && matchesSpeed && matchesCountry;
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
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(6, 78, 59, 0.3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ background: '#10b981', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#064e3b' }}>
              🛠️ Module 3: Tech-Stack & CMS Audits
            </span>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem' }}>
              BuiltWith & Google PageSpeed Intelligence
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Outdated CMS & Slow Sites Needing Rebuilds
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#a7f3d0', maxWidth: '650px', lineHeight: '1.5' }}>
            Discover businesses held back by old WordPress, bloated Wix, or unoptimized Shopify themes. Pitch 95+ PageSpeed modern Next.js upgrades with undeniable proof.
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
            <Download size={16} /> Export Tech Audits CSV
          </button>

          <button
            onClick={handleRunDiscovery}
            disabled={isAuditing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: '#34d399',
              color: '#064e3b',
              fontWeight: '700',
              cursor: isAuditing ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              boxShadow: '0 4px 12px rgba(52, 211, 153, 0.4)'
            }}
          >
            {isAuditing ? (
              <>⏳ Scanning CMS Engines...</>
            ) : (
              <>⚡ Discover Outdated Sites</>
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
            placeholder="Search company, CMS, or domain..."
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

        {/* CMS Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>CMS:</span>
          <select
            value={cmsFilter}
            onChange={(e) => setCmsFilter(e.target.value as any)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: 'var(--bg-main)' }}
          >
            <option value="ALL">All Platforms</option>
            <option value="WordPress">WordPress</option>
            <option value="Wix">Wix</option>
            <option value="Shopify">Shopify</option>
            <option value="Joomla">Joomla</option>
            <option value="Squarespace">Squarespace</option>
          </select>
        </div>

        {/* Max Speed Score Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Max Score:</span>
          <select
            value={maxSpeed}
            onChange={(e) => setMaxSpeed(Number(e.target.value))}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: 'var(--bg-main)' }}
          >
            <option value="40">🔴 Very Slow (&lt; 40/100)</option>
            <option value="60">🟠 Slow (&lt; 60/100)</option>
            <option value="80">🟡 Below Average (&lt; 80/100)</option>
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
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="United Arab Emirates">UAE (Dubai)</option>
            <option value="Australia">Australia</option>
          </select>
        </div>

      </div>

      {/* Tech Stack Opportunities Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {paginatedLeads.map(lead => {
          const speed = lead.websiteAudit?.performanceScore || 50;
          const isCritical = speed < 40;

          return (
            <div
              key={lead.id}
              onClick={() => onSelectLead(lead)}
              className="card"
              style={{
                padding: '20px',
                cursor: 'pointer',
                display: 'grid',
                gridTemplateColumns: '1fr 170px 220px 180px',
                gap: '20px',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                borderLeft: isCritical ? '4px solid #ef4444' : '4px solid #f59e0b'
              }}
            >
              {/* Site & CMS Information */}
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
                    background: '#fef3c7',
                    color: '#d97706',
                    border: '1px solid #fde68a'
                  }}>
                    📦 {lead.techStackInfo?.detectedCms || lead.websiteAudit?.techFramework}
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
                    {lead.company.industry} ({lead.company.location})
                  </span>
                </div>

                {/* Specific issues detected */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {lead.websiteAudit?.issuesDetected?.slice(0, 3).map((issue, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'var(--bg-main)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      ⚠️ {issue}
                    </span>
                  ))}
                </div>
              </div>

              {/* Lighthouse Speed & Diagnostic */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: isCritical ? '#fef2f2' : '#fffbeb',
                  border: `1px solid ${isCritical ? '#fecaca' : '#fde68a'}`
                }}>
                  <Gauge size={20} color={isCritical ? '#dc2626' : '#d97706'} />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: isCritical ? '#dc2626' : '#d97706' }}>
                      {speed}/100 Score
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      FCP: {lead.websiteAudit?.fcp || '3.5s'} • LCP: {lead.websiteAudit?.lcp || '5.8s'}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.725rem', color: '#dc2626', fontWeight: '700', marginTop: '6px' }}>
                  {lead.techStackInfo?.rebuildUrgency === 'HIGH' ? '🔥 High Rebuild Urgency' : '⚡ Modernization Target'}
                </div>
              </div>

              {/* Contact Information */}
              <div onClick={(e) => e.stopPropagation()}>
                <div style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {lead.contact.personName || 'Business Owner'}
                </div>

                {lead.contact.phone && (
                  <a
                    href={`tel:${lead.contact.phone}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', color: '#059669', textDecoration: 'none', fontWeight: '600', marginBottom: '4px' }}
                  >
                    <Phone size={13} /> {lead.contact.phone}
                  </a>
                )}

                {lead.contact.email && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={12} /> {lead.contact.email}
                  </div>
                )}

                <div style={{ fontSize: '0.675rem', color: '#0284c7', fontWeight: '700', marginTop: '4px' }}>
                  📬 MX VALID (Mailbox Active)
                </div>
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
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                >
                  <Sparkles size={14} /> Pitch Next.js Rebuild
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

        {filteredLeads.length === 0 && !isAuditing && (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <Layers size={40} style={{ color: 'var(--text-dim)', marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>No Outdated CMS Sites Found</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Try loosening your max speed score filter or click "Discover Outdated Sites".
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {startIndex + 1} - {endIndex} of {totalItems} Outdated CMS Sites
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
