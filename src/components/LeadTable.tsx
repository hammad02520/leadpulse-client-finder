import React, { useState } from 'react';
import { 
  Search, 
  Flame, 
  Globe, 
  ExternalLink, 
  ChevronRight,
  Sparkles,
  Clock,
  Code2,
  Building2
} from 'lucide-react';
import { Lead, LeadStatus, LeadTemperature, SourceType, ProjectNeedType } from '../types';

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
  const [needFilter, setNeedFilter] = useState<ProjectNeedType | 'ALL'>('ALL');
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
    const matchesNeed = needFilter === 'ALL' || l.projectNeed === needFilter;

    return matchesSearch && matchesTemp && matchesSource && matchesNeed;
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
      
      {/* Interactive Filter Control Panel */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Top Search & Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          
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

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <input 
              type="checkbox" 
              checked={hideExpired}
              onChange={(e) => setHideExpired(e.target.checked)}
            />
            Hide Expired / Stale Posts
          </label>

        </div>

        {/* Filter Selection Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
          
          {/* Source Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={15} color="var(--primary)" />
            <span style={{ fontSize: '0.775rem', fontWeight: '700', color: '#3f3f46' }}>Source:</span>
            <select 
              className="input-field" 
              style={{ width: 'auto', padding: '5px 10px', fontSize: '0.775rem' }}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
            >
              <option value="ALL">🌐 All Sources</option>
              <option value="LOCAL_BIZ">📍 Local Business Directory</option>
              <option value="JOB_FEED">💼 Remote Job Feeds (HN, WWR)</option>
              <option value="REDDIT">🔴 Reddit Hiring Subreddits</option>
              <option value="MANUAL_IMPORT">📥 Custom Manual Leads</option>
            </select>
          </div>

          {/* Project Need Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Code2 size={15} color="#0284c7" />
            <span style={{ fontSize: '0.775rem', fontWeight: '700', color: '#3f3f46' }}>Need Category:</span>
            <select 
              className="input-field" 
              style={{ width: 'auto', padding: '5px 10px', fontSize: '0.775rem' }}
              value={needFilter}
              onChange={(e) => setNeedFilter(e.target.value as any)}
            >
              <option value="ALL">🛠️ All Project Needs</option>
              <option value="MOBILE_APP">📱 Mobile App (iOS / Android)</option>
              <option value="WEB_REDESIGN">🎨 Web Redesign</option>
              <option value="SAAS_MVP">🚀 SaaS MVP Development</option>
              <option value="ECOMMERCE">🛍️ E-Commerce Store</option>
              <option value="SPEED_PERFORMANCE">⚡ Speed & Performance</option>
            </select>
          </div>

          {/* Lead Quality Temperature Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={15} color="#dc2626" />
            <span style={{ fontSize: '0.775rem', fontWeight: '700', color: '#3f3f46' }}>Score Tier:</span>
            <select 
              className="input-field" 
              style={{ width: 'auto', padding: '5px 10px', fontSize: '0.775rem' }}
              value={tempFilter}
              onChange={(e) => setTempFilter(e.target.value as any)}
            >
              <option value="ALL">🔥 All Score Tiers</option>
              <option value="HOT">🔥 Hot (Score 80-100)</option>
              <option value="WARM">☀️ Warm (Score 60-79)</option>
              <option value="COLD">❄️ Cold (Score 40-59)</option>
            </select>
          </div>

          <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
            Showing <strong>{filteredLeads.length}</strong> of {leads.length} leads
          </div>

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
              <th style={{ padding: '14px 16px' }}>Source Link</th>
              <th style={{ padding: '14px 16px' }}>Pipeline Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No active leads matching your selected filters. Change filters or click "Fetch Live Leads".
                </td>
              </tr>
            ) : (
              filteredLeads.map(lead => {
                const tempClass = 
                  lead.scoreBreakdown.temperature === 'HOT' ? 'badge-hot' :
                  lead.scoreBreakdown.temperature === 'WARM' ? 'badge-warm' : 'badge-cold';

                const auditedSiteUrl = lead.company.websiteUrl || (lead.websiteAudit.domain && lead.websiteAudit.domain !== 'No Domain' ? `https://${lead.websiteAudit.domain}` : undefined);

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

                    {/* Website Audit with target="_blank" link */}
                    <td style={{ padding: '14px 16px', minWidth: '180px' }}>
                      {lead.websiteAudit.hasWebsite && auditedSiteUrl ? (
                        <div style={{ fontSize: '0.8rem' }}>
                          <a 
                            href={auditedSiteUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ color: '#0284c7', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                            title="Open audited client site in new blank tab"
                          >
                            <Globe size={13} /> {lead.websiteAudit.domain} ↗
                          </a>
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

                    {/* Source with target="_blank" link */}
                    <td style={{ padding: '14px 16px' }}>
                      <a 
                        href={lead.sourceUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.8rem', textDecoration: 'none', fontWeight: '700' }}
                        title="Open direct job post in new blank tab"
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
