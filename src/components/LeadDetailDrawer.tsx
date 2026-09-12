import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  Globe, 
  Mail, 
  Phone, 
  MessageSquare, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Sparkles,
  Send,
  Plus,
  Search,
  Linkedin
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
        maxWidth: '540px',
        background: '#090d16',
        borderLeft: '1px solid var(--border-color)',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Drawer Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0d131f' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${score.temperature === 'HOT' ? 'badge-hot' : 'badge-warm'}`}>
              <Flame size={12} /> Score {score.totalScore}/100 ({score.temperature})
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>
              {lead.source}
            </span>
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '6px', color: 'var(--text-main)' }}>
            {lead.company.name}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {lead.title}
          </p>
        </div>

        <button 
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
        >
          <X size={22} />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Quick Outreach CTA */}
        <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff' }}>Generate Truthful AI Pitch</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-tailored using website audit data</div>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => onOpenPitchModal(lead)}
            disabled={lead.isExpired}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            <Sparkles size={15} /> Pitch & Contact
          </button>
        </div>

        {/* Website Audit Card */}
        <div className="glass-panel" style={{ padding: '18px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={16} color="#06b6d4" /> Technical Website Audit Signals
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', marginBottom: '14px' }}>
            <div style={{ background: '#0d131f', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Mobile Layout:</span>{' '}
              <strong style={{ color: audit.mobileFriendly ? '#34d399' : '#fb7185' }}>
                {audit.mobileFriendly ? '✅ Optimized' : '❌ Unoptimized'}
              </strong>
            </div>

            <div style={{ background: '#0d131f', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Performance:</span>{' '}
              <strong style={{ color: audit.performanceScore >= 70 ? '#34d399' : '#fbbf24' }}>
                {audit.performanceScore}/100
              </strong>
            </div>

            <div style={{ background: '#0d131f', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>HTTPS SSL:</span>{' '}
              <strong style={{ color: audit.hasHttps ? '#34d399' : '#fb7185' }}>
                {audit.hasHttps ? '✅ Secure' : '❌ Warning'}
              </strong>
            </div>

            <div style={{ background: '#0d131f', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Lead CTA:</span>{' '}
              <strong style={{ color: audit.hasCta ? '#34d399' : '#fbbf24' }}>
                {audit.hasCta ? '✅ Present' : '❌ Missing'}
              </strong>
            </div>
          </div>

          {/* AI Reasoning */}
          <div style={{ fontSize: '0.8rem', background: 'rgba(6, 182, 212, 0.1)', borderLeft: '3px solid #06b6d4', padding: '10px 12px', borderRadius: '4px', color: '#e0f2fe' }}>
            <strong>AI Pitch Angle:</strong> {audit.aiOpportunityReason}
          </div>
        </div>

        {/* Verified Contacts & Live Search Links */}
        <div className="glass-panel" style={{ padding: '18px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px' }}>Verified Contact & Live Search Links</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
            
            {lead.contact.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} color="var(--accent-cyan)" />
                <span style={{ fontWeight: '600' }}>{lead.contact.email}</span>
              </div>
            )}
            
            {lead.contact.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} color="var(--accent-emerald)" />
                <span style={{ fontWeight: '600' }}>{lead.contact.phone}</span>
              </div>
            )}

            {/* Direct Link to Original Post */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ExternalLink size={16} color="var(--primary)" />
              <a href={lead.sourceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
                Open Original Post on {lead.source} ↗
              </a>
            </div>

            {/* Google Contact Email Search Link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <Search size={16} color="#fbbf24" />
              <a href={googleSearchEmailUrl} target="_blank" rel="noreferrer" style={{ color: '#fbbf24', textDecoration: 'none', fontSize: '0.8rem' }}>
                Search Direct Contact Email on Google ↗
              </a>
            </div>

            {/* LinkedIn Decision Maker Search Link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Linkedin size={16} color="#0077b5" />
              <a href={linkedinSearchUrl} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.8rem' }}>
                Find Founder / CTO on LinkedIn ↗
              </a>
            </div>

          </div>
        </div>

        {/* Lead Score Matrix */}
        <div className="glass-panel" style={{ padding: '18px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={16} color="#f43f5e" /> Lead Qualification Matrix
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Explicit Need Signal:</span> <strong>+{score.needSignalScore} pts</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Website Audit Opportunity:</span> <strong>+{score.websiteProblemsScore} pts</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Freshness Bonus:</span> <strong style={{ color: '#34d399' }}>+{score.freshnessScore} pts</strong>
            </div>
            {score.penalties > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fb7185' }}>
                <span>Expired/Risk Penalties:</span> <strong>-{score.penalties} pts</strong>
              </div>
            )}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '0.9rem' }}>
              <span>Final Calculated Score:</span> <span style={{ color: 'var(--primary)' }}>{score.totalScore}/100</span>
            </div>
          </div>
        </div>

        {/* Notes & Activity History */}
        <div className="glass-panel" style={{ padding: '18px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px' }}>Notes & Activity Timeline</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {lead.notes.map((note, idx) => (
              <div key={idx} style={{ fontSize: '0.8rem', background: '#0d131f', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                {note}
              </div>
            ))}
          </div>

          <form onSubmit={handleNoteSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Add a new note..."
              className="input-field"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary" style={{ padding: '8px 12px' }}>
              <Plus size={16} /> Add
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
