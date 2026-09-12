import React, { useState } from 'react';
import { 
  Search, 
  Flame, 
  Globe, 
  ExternalLink, 
  ChevronRight,
  Sparkles,
  Clock
} from 'lucide-react';
import { Lead, LeadStatus, LeadTemperature, SourceType } from '../types';

interface LeadTableProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenPitchModal: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  freshOnly: boolean;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  onSelectLead,
  onOpenPitchModal,
  onStatusChange,
  freshOnly
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tempFilter, setTempFilter] = useState<LeadTemperature | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<SourceType | 'ALL'>('ALL');
  const [hideExpired, setHideExpired] = useState(true);

  const filteredLeads = leads.filter(l => {
    if (freshOnly && (l.isExpired || l.freshnessTier === 'STALE_EXPIRED')) return false;
    if (hideExpired && l.isExpired) return false;

    const matchesSearch = 
      l.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.contact.email && l.contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.company.industry && l.company.industry.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTemp = tempFilter === 'ALL' || l.scoreBreakdown.temperature === tempFilter;
    const matchesSource = sourceFilter === 'ALL' || l.source === sourceFilter;

    return matchesSearch && matchesTemp && matchesSource;
  });

  const getTimeAgoText = (postedAtStr: string) => {
    const diffMs = new Date().getTime() - new Date(postedAtStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return '⚡ Just Now';
    if (diffHours < 24) return `🔥 ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 10) return `📅 ${diffDays}d ago`;
    return `⏳ ${diffDays}d ago (Stale)`;
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '260px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search by company, tech need, email, or keywords..."
            className="input-field"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <input 
              type="checkbox" 
              checked={hideExpired}
              onChange={(e) => setHideExpired(e.target.checked)}
            />
            Hide Expired / Stale Posts
          </label>

          {/* Temperature */}
          <select 
            className="input-field" 
            style={{ width: 'auto' }}
            value={tempFilter}
            onChange={(e) => setTempFilter(e.target.value as any)}
          >
            <option value="ALL">🔥 All Quality Tiers</option>
            <option value="HOT">🔥 Hot (Score 80-100)</option>
            <option value="WARM">☀️ Warm (Score 60-79)</option>
            <option value="COLD">❄️ Cold (Score 40-59)</option>
          </select>

          {/* Source */}
          <select 
            className="input-field" 
            style={{ width: 'auto' }}
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
          >
            <option value="ALL">🌐 All Sources</option>
            <option value="REDDIT">Reddit Subreddits</option>
            <option value="JOB_FEED">Remote Tech Job Feeds</option>
            <option value="LOCAL_BIZ">Local Business Directory</option>
          </select>

        </div>

      </div>

      {/* Table Container */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-muted)' }}>
              <th style={{ padding: '14px 16px' }}>Company & Need</th>
              <th style={{ padding: '14px 16px' }}>Freshness / Posted</th>
              <th style={{ padding: '14px 16px' }}>Lead Score</th>
              <th style={{ padding: '14px 16px' }}>Website Audit</th>
              <th style={{ padding: '14px 16px' }}>Contact Options</th>
              <th style={{ padding: '14px 16px' }}>Source</th>
              <th style={{ padding: '14px 16px' }}>Pipeline Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No active fresh leads matching your filter. Uncheck "Hide Expired" or click "Fetch Live Leads".
                </td>
              </tr>
            ) : (
              filteredLeads.map(lead => {
                const tempClass = 
                  lead.scoreBreakdown.temperature === 'HOT' ? 'badge-hot' :
                  lead.scoreBreakdown.temperature === 'WARM' ? 'badge-warm' : 'badge-cold';

                return (
                  <tr 
                    key={lead.id}
                    style={{ 
                      borderBottom: '1px solid var(--border-color)', 
                      transition: 'background 0.15s',
                      opacity: lead.isExpired ? 0.5 : 1
                    }}
                    className="table-row-hover"
                  >
                    
                    {/* Company & Project Need */}
                    <td style={{ padding: '14px 16px', maxWidth: '280px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                        {lead.company.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0' }}>
                        {lead.title}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '4px', fontWeight: '700' }}>
                          {lead.projectNeed}
                        </span>
                        {lead.budgetSignal && (
                          <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#d1fae5', color: '#059669', borderRadius: '4px', fontWeight: '700' }}>
                            💰 {lead.budgetSignal}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Freshness / Posted Date */}
                    <td style={{ padding: '14px 16px' }}>
                      {lead.isExpired ? (
                        <span className="badge badge-expired">
                          ⚠️ Expired / Closed
                        </span>
                      ) : (
                        <span className="badge badge-fresh">
                          <Clock size={12} /> {getTimeAgoText(lead.postedAt || lead.discoveredAt)}
                        </span>
                      )}
                    </td>

                    {/* Lead Score */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className={`badge ${tempClass}`}>
                          {lead.scoreBreakdown.temperature === 'HOT' && <Flame size={12} />}
                          Score {lead.scoreBreakdown.totalScore}/100
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Need: +{lead.scoreBreakdown.needSignalScore} | Audit: +{lead.scoreBreakdown.websiteProblemsScore}
                        </span>
                      </div>
                    </td>

                    {/* Website Audit */}
                    <td style={{ padding: '14px 16px', minWidth: '180px' }}>
                      {lead.websiteAudit.hasWebsite ? (
                        <div style={{ fontSize: '0.8rem' }}>
                          <div style={{ color: '#0284c7', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Globe size={13} /> {lead.websiteAudit.domain}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Mobile: {lead.websiteAudit.mobileFriendly ? '✅ OK' : '❌ Poor'} | Speed: {lead.websiteAudit.performanceScore}/100
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#dc2626', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                          ⚠️ No Website
                        </span>
                      )}
                    </td>

                    {/* Contact Info */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.8rem' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                          {lead.contact.personName || 'Manager'}
                        </div>
                        {lead.contact.email && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            ✉️ {lead.contact.email}
                          </div>
                        )}
                        {lead.contact.phone && (
                          <div style={{ color: '#059669', fontSize: '0.75rem', fontWeight: '600' }}>
                            💬 {lead.contact.phone}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Source */}
                    <td style={{ padding: '14px 16px' }}>
                      <a 
                        href={lead.sourceUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.8rem', textDecoration: 'none', fontWeight: '600' }}
                      >
                        {lead.source} <ExternalLink size={12} />
                      </a>
                    </td>

                    {/* Pipeline Status Dropdown */}
                    <td style={{ padding: '14px 16px' }}>
                      <select 
                        className="input-field" 
                        style={{ fontSize: '0.75rem', padding: '4px 8px', width: 'auto' }}
                        value={lead.status}
                        onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
                      >
                        <option value="NEW">🆕 NEW</option>
                        <option value="QUALIFIED">⭐ QUALIFIED</option>
                        <option value="CONTACTED">📨 CONTACTED</option>
                        <option value="FOLLOW_UP">⏳ FOLLOW-UP</option>
                        <option value="REPLIED">💬 REPLIED</option>
                        <option value="MEETING">📅 MEETING</option>
                        <option value="PROPOSAL">📝 PROPOSAL</option>
                        <option value="WON">🏆 WON</option>
                        <option value="LOST">❌ LOST / CLOSED</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        
                        {/* AI Pitch Modal */}
                        <button 
                          className="btn btn-primary"
                          style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                          onClick={() => onOpenPitchModal(lead)}
                          disabled={lead.isExpired}
                          title={lead.isExpired ? 'Post is expired/closed' : 'Generate Truthful AI Pitch'}
                        >
                          <Sparkles size={13} /> Pitch
                        </button>

                        {/* Inspect Details */}
                        <button 
                          className="btn btn-secondary"
                          style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                          onClick={() => onSelectLead(lead)}
                          title="View Full Audit & Notes"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>

        </table>
      </div>

    </div>
  );
};
