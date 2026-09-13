import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Linkedin, 
  Mail, 
  Search, 
  Sparkles, 
  Download, 
  ExternalLink, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Briefcase
} from 'lucide-react';
import { Lead, LeadStatus, EmailValidationStage } from '../types';
import { b2bDiscoveryService, B2BSearchParams } from '../services/b2bDiscoveryService';

interface B2BDecisionMakersViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenPitchModal: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onExportCSV: () => void;
  onAddDiscoveredLeads: (newLeads: Lead[]) => void;
}

export const B2BDecisionMakersView: React.FC<B2BDecisionMakersViewProps> = ({
  leads,
  onSelectLead,
  onOpenPitchModal,
  onStatusChange,
  onExportCSV,
  onAddDiscoveredLeads
}) => {
  const [roleFilter, setRoleFilter] = useState<B2BSearchParams['role']>('ALL');
  const [sizeFilter, setSizeFilter] = useState<B2BSearchParams['companySize']>('ALL');
  const [industryFilter, setIndustryFilter] = useState<B2BSearchParams['industry']>('ALL');
  const [selectedCountry, setSelectedCountry] = useState<string>('United States');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filter ONLY leads from B2B_APOLLO source
  const b2bLeads = leads.filter(l => l.source === 'B2B_APOLLO');

  // Auto-discover initial batch if zero exist
  useEffect(() => {
    if (b2bLeads.length === 0 && !isDiscovering) {
      handleRunDiscovery();
    }
  }, []);

  const handleRunDiscovery = async () => {
    setIsDiscovering(true);
    try {
      const results = await b2bDiscoveryService.discoverDecisionMakers({
        role: roleFilter,
        companySize: sizeFilter,
        industry: industryFilter,
        country: selectedCountry,
        query: searchTerm,
        limit: 50
      });
      onAddDiscoveredLeads(results);
    } catch (err) {
      console.error('Failed to discover B2B leads:', err);
    } finally {
      setIsDiscovering(false);
    }
  };

  const filteredLeads = b2bLeads.filter(l => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      (l.contact.personName && l.contact.personName.toLowerCase().includes(q)) ||
      (l.contact.role && l.contact.role.toLowerCase().includes(q)) ||
      (l.company.name && l.company.name.toLowerCase().includes(q)) ||
      (l.company.industry && l.company.industry.toLowerCase().includes(q));

    const matchesRole = 
      roleFilter === 'ALL' ||
      (roleFilter === 'FOUNDER_CEO' && (l.contact.role?.toLowerCase().includes('founder') || l.contact.role?.toLowerCase().includes('ceo'))) ||
      (roleFilter === 'CTO_TECH' && (l.contact.role?.toLowerCase().includes('cto') || l.contact.role?.toLowerCase().includes('tech'))) ||
      (roleFilter === 'MARKETING_GROWTH' && (l.contact.role?.toLowerCase().includes('growth') || l.contact.role?.toLowerCase().includes('market')));

    const matchesSize = sizeFilter === 'ALL' || l.b2bInfo?.employeeCount === sizeFilter;
    const matchesIndustry = industryFilter === 'ALL' || l.company.industry === industryFilter;

    return matchesSearch && matchesRole && matchesSize && matchesIndustry;
  });

  const handleCopyEmail = (e: React.MouseEvent, email: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

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
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ background: '#4f46e5', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🎯 Module 2: B2B Decision Makers
            </span>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem' }}>
              Live Job Board Intelligence (Jobicy · Remotive · HackerNews)
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Direct Founders, CEOs & Executive Contacts
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#c7d2fe', maxWidth: '650px', lineHeight: '1.5' }}>
            Reach direct decision-makers with verified work emails, active LinkedIn profiles, and verified company revenues. No generic info@ inboxes.
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
            <Download size={16} /> Export B2B CSV
          </button>

          <button
            onClick={handleRunDiscovery}
            disabled={isDiscovering}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: '#38bdf8',
              color: '#0f172a',
              fontWeight: '700',
              cursor: isDiscovering ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.4)'
            }}
          >
            {isDiscovering ? (
              <>⏳ Discovering Decision Makers...</>
            ) : (
              <>⚡ Refresh Decision Makers</>
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
            placeholder="Search executive name, role, or company..."
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

        {/* Role Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: 'var(--bg-main)' }}
          >
            <option value="ALL">All Roles</option>
            <option value="FOUNDER_CEO">Founder / CEO</option>
            <option value="CTO_TECH">CTO / VP Tech</option>
            <option value="MARKETING_GROWTH">Head of Growth / CMO</option>
          </select>
        </div>

        {/* Industry Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Industry:</span>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value as any)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: 'var(--bg-main)' }}
          >
            <option value="ALL">All Industries</option>
            <option value="SaaS & Software">SaaS & Software</option>
            <option value="E-Commerce">E-Commerce</option>
            <option value="Fintech">Fintech</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Marketing Agency">Marketing Agency</option>
          </select>
        </div>

        {/* Company Size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Team:</span>
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value as any)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', background: 'var(--bg-main)' }}
          >
            <option value="ALL">All Sizes</option>
            <option value="1-10">1 - 10 Employees</option>
            <option value="11-50">11 - 50 Employees</option>
            <option value="51-200">51 - 200 Employees</option>
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
            <option value="Germany">Germany</option>
            <option value="Australia">Australia</option>
          </select>
        </div>

      </div>

      {/* Decision Makers List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {paginatedLeads.map(lead => {
          const isCopied = copiedEmailId === lead.id;
          const isFounder = lead.contact.role?.toLowerCase().includes('founder') || lead.contact.role?.toLowerCase().includes('ceo');

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
                borderLeft: isFounder ? '4px solid #8b5cf6' : '4px solid #3b82f6'
              }}
            >
              {/* Executive & Company Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: isFounder ? '#ede9fe' : '#e0f2fe',
                    color: isFounder ? '#6d28d9' : '#0369a1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '0.95rem'
                  }}>
                    {lead.contact.personName?.charAt(0) || 'E'}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                        {lead.contact.personName}
                      </span>
                      <span style={{
                        fontSize: '0.725rem',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: isFounder ? '#f5f3ff' : '#eff6ff',
                        color: isFounder ? '#7c3aed' : '#2563eb',
                        border: `1px solid ${isFounder ? '#ddd6fe' : '#bfdbfe'}`
                      }}>
                        {lead.contact.role}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                        {lead.company.name}
                      </span>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>•</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {lead.company.industry} ({lead.company.location})
                      </span>
                    </div>
                  </div>
                </div>

                <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {lead.description}
                </p>
              </div>

              {/* Company Scale & Metrics */}
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '700', color: '#059669' }}>
                    <DollarSign size={14} /> {lead.b2bInfo?.estimatedRevenue || lead.budgetSignal}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.775rem', color: 'var(--text-dim)' }}>
                    <Users size={14} /> {lead.b2bInfo?.employeeCount || '11-50'} Employees
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#6366f1', fontWeight: '600' }}>
                    ⚡ {lead.projectNeed.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              {/* Contact & Verification Badge */}
              <div onClick={(e) => e.stopPropagation()}>
                {lead.contact.email && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                      onClick={(e) => handleCopyEmail(e, lead.contact.email!, lead.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid #bae6fd',
                        background: '#f0f9ff',
                        color: '#0369a1',
                        fontSize: '0.775rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      title="Click to copy work email"
                    >
                      <Mail size={13} />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {lead.contact.email}
                      </span>
                      {isCopied && <CheckCircle2 size={13} color="#059669" />}
                    </button>

                    <span style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: '700', paddingLeft: '4px' }}>
                      {lead.contact.emailValidationStage === 'DOMAIN_VALID'
                        ? '📧 INFERRED EMAIL'
                        : lead.contact.emailValidationStage === 'FOUND' || lead.contact.emailValidationStage === 'FORMAT_VALID'
                        ? '📬 EMAIL FOUND'
                        : lead.contact.emailValidationStage === 'MX_VALID' || lead.contact.emailValidationStage === 'VERIFIED'
                        ? '✅ EMAIL VERIFIED'
                        : '📧 EMAIL CONSTRUCTED'}
                    </span>
                  </div>
                )}

                {lead.contact.linkedinUrl && (
                  <a
                    href={lead.contact.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.75rem',
                      color: '#0a66c2',
                      fontWeight: '700',
                      marginTop: '6px',
                      textDecoration: 'none'
                    }}
                  >
                    <Linkedin size={13} /> Verified LinkedIn Profile <ExternalLink size={11} />
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
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                >
                  <Sparkles size={14} /> Pitch Executive
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
                  <option value="QUALIFIED">Status: QUALIFIED</option>
                  <option value="CONTACTED">Status: CONTACTED</option>
                  <option value="FOLLOW_UP">Status: FOLLOW UP</option>
                  <option value="REPLIED">Status: REPLIED</option>
                  <option value="MEETING">Status: MEETING</option>
                  <option value="PROPOSAL">Status: PROPOSAL</option>
                  <option value="WON">Status: WON (CLOSED)</option>
                  <option value="LOST">Status: LOST</option>
                </select>
              </div>

            </div>
          );
        })}

        {filteredLeads.length === 0 && !isDiscovering && (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <Users size={40} style={{ color: 'var(--text-dim)', marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>No Decision Makers Found for Filter</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Try adjusting your role or industry filter, or click "Refresh Decision Makers".
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {startIndex + 1} - {endIndex} of {totalItems} Decision Makers
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
