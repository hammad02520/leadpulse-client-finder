import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  Globe, 
  Mail, 
  Phone, 
  ExternalLink, 
  Sparkles, 
  Plus, 
  Search, 
  Linkedin,
  Building2,
  AlertCircle
} from 'lucide-react';
import { Lead, LeadStatus } from '../types';

interface LeadDetailDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onOpenPitchModal: (lead: Lead) => void;
  onAddNote: (leadId: string, note: string) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  lead,
  onClose,
  onOpenPitchModal,
  onAddNote,
  onStatusChange
}) => {
  if (!lead) return null;

  const [newNote, setNewNote] = useState('');

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(lead.id, newNote);
    setNewNote('');
  };

  const audit = lead.websiteAudit;
  const score = lead.scoreBreakdown;

  const auditedSiteUrl = lead.company.websiteUrl || (audit.domain && audit.domain !== 'No Domain' ? `https://${audit.domain}` : undefined);
  const googleSearchEmailUrl = `https://www.google.com/search?q=${encodeURIComponent('contact email ' + lead.company.name + ' ' + (audit.domain || ''))}`;
  const linkedinSearchUrl = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(lead.company.name + ' founder OR owner OR CTO')}`;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        maxWidth: '520px',
        background: '#ffffff',
        borderLeft: '1px solid var(--border-color)',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Drawer Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${score.temperature === 'HOT' ? 'badge-hot' : 'badge-warm'}`}>
              Score {score.totalScore}/100 ({score.temperature})
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              {lead.source}
            </span>
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '4px', color: 'var(--text-main)' }}>
            {lead.company.name}
          </h2>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            {lead.title}
          </p>
        </div>

        <button 
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Point to Point Direct Post Link Banner */}
        <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#3730a3' }}>Point-to-Point Direct Post URL</div>
            <div style={{ fontSize: '0.725rem', color: '#4338ca' }}>Opens the exact original post page</div>
          </div>
          <a 
            href={lead.sourceUrl} 
            target="_blank" 
            rel="noreferrer"
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: '0.775rem', textDecoration: 'none' }}
          >
            Open Job Post ↗
          </a>
        </div>

        {/* Website Technical Audit Card with Prominent Audited Link */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#09090b' }}>
            <Globe size={16} color="#0284c7" /> Technical Website Audit Signals
          </h3>

          {/* EXACT AUDITED WEBSITE LINK BANNER */}
          {auditedSiteUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontWeight: '700', fontSize: '0.825rem' }}>
                <Globe size={16} /> Audited Target Site: <span style={{ color: '#0284c7' }}>{audit.domain}</span>
              </div>
              <a 
                href={auditedSiteUrl} 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-primary"
                style={{ padding: '5px 12px', fontSize: '0.75rem', textDecoration: 'none' }}
              >
                Open Audited Site ↗
              </a>
            </div>
          ) : (
            <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', fontSize: '0.775rem', fontWeight: '600', marginBottom: '12px' }}>
              ⚠️ No active website domain found for this business.
            </div>
          )}

          {/* Audit Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.775rem', marginBottom: '12px' }}>
            <div style={{ background: '#f4f4f5', padding: '8px 10px', borderRadius: '6px' }}>
              <span style={{ color: '#71717a' }}>Mobile Layout:</span>{' '}
              <strong style={{ color: audit.mobileFriendly ? '#16a34a' : '#dc2626' }}>
                {audit.mobileFriendly ? '✅ OK' : '❌ Poor'}
              </strong>
            </div>

            <div style={{ background: '#f4f4f5', padding: '8px 10px', borderRadius: '6px' }}>
              <span style={{ color: '#71717a' }}>Performance:</span>{' '}
              <strong style={{ color: audit.performanceScore >= 70 ? '#16a34a' : '#d97706' }}>
                {audit.performanceScore}/100
              </strong>
            </div>

            <div style={{ background: '#f4f4f5', padding: '8px 10px', borderRadius: '6px' }}>
              <span style={{ color: '#71717a' }}>HTTPS SSL:</span>{' '}
              <strong style={{ color: audit.hasHttps ? '#16a34a' : '#dc2626' }}>
                {audit.hasHttps ? '✅ Secure' : '❌ Warning'}
              </strong>
            </div>

            <div style={{ background: '#f4f4f5', padding: '8px 10px', borderRadius: '6px' }}>
              <span style={{ color: '#71717a' }}>Lead CTA:</span>{' '}
              <strong style={{ color: audit.hasCta ? '#16a34a' : '#d97706' }}>
                {audit.hasCta ? '✅ Present' : '❌ Missing'}
              </strong>
            </div>
          </div>

          <div style={{ fontSize: '0.775rem', background: '#f0f9ff', borderLeft: '3px solid #0284c7', padding: '8px 10px', borderRadius: '4px', color: '#0369a1' }}>
            <strong>AI Pitch Angle:</strong> {audit.aiOpportunityReason}
          </div>
        </div>

        {/* Quick Outreach CTA */}
        <div style={{ background: '#f4f4f5', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e4e4e7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#09090b' }}>AI Proposal Pitch</div>
            <div style={{ fontSize: '0.75rem', color: '#71717a' }}>Fact-checked audit proposal</div>
          </div>
          <button 
            className="btn btn-secondary"
            onClick={() => onOpenPitchModal(lead)}
            disabled={lead.isExpired}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <Sparkles size={14} /> Pitch & Contact
          </button>
        </div>

        {/* Verified Contacts & Direct Links */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '10px', color: '#09090b' }}>Verified Contacts & Direct Links</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
            
            {auditedSiteUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={15} color="#0284c7" />
                <a href={auditedSiteUrl} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: '700', textDecoration: 'none' }}>
                  Visit Audited Website ({audit.domain}) ↗
                </a>
              </div>
            )}

            {lead.contact.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#18181b' }}>
                <Mail size={15} color="#0284c7" />
                <span style={{ fontWeight: '600' }}>{lead.contact.email}</span>
              </div>
            )}
            
            {lead.contact.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#18181b' }}>
                <Phone size={15} color="#16a34a" />
                <span style={{ fontWeight: '600' }}>{lead.contact.phone}</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ExternalLink size={15} color="var(--primary)" />
              <a href={lead.sourceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>
                Open Direct Job Post on {lead.source} ↗
              </a>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={15} color="#d97706" />
              <a href={googleSearchEmailUrl} target="_blank" rel="noreferrer" style={{ color: '#d97706', textDecoration: 'none' }}>
                Search Company Email on Google ↗
              </a>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Linkedin size={15} color="#0077b5" />
              <a href={linkedinSearchUrl} target="_blank" rel="noreferrer" style={{ color: '#0077b5', textDecoration: 'none' }}>
                Find Decision Maker on LinkedIn ↗
              </a>
            </div>

          </div>
        </div>

        {/* Lead Score Matrix */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '10px', color: '#09090b' }}>Qualification Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.775rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#71717a' }}>
              <span>Need Signal:</span> <strong>+{score.needSignalScore} pts</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#71717a' }}>
              <span>Website Audit Opportunity:</span> <strong>+{score.websiteProblemsScore} pts</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#71717a' }}>
              <span>Freshness Bonus:</span> <strong style={{ color: '#16a34a' }}>+{score.freshnessScore} pts</strong>
            </div>
            {score.penalties > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                <span>Risk/Expired Penalties:</span> <strong>-{score.penalties} pts</strong>
              </div>
            )}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '0.85rem', color: '#09090b' }}>
              <span>Total Calculated Score:</span> <span style={{ color: 'var(--primary)' }}>{score.totalScore}/100</span>
            </div>
          </div>
        </div>

        {/* Notes & Activity Timeline */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '10px', color: '#09090b' }}>Notes & Timeline</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
            {lead.notes.map((note, idx) => (
              <div key={idx} style={{ fontSize: '0.75rem', background: '#f4f4f5', padding: '6px 10px', borderRadius: '6px', color: '#3f3f46' }}>
                {note}
              </div>
            ))}
          </div>

          <form onSubmit={handleNoteSubmit} style={{ display: 'flex', gap: '6px' }}>
            <input 
              type="text" 
              placeholder="Add note..."
              className="input-field"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary" style={{ padding: '6px 10px' }}>
              <Plus size={14} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
