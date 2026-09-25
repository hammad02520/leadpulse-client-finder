import React from 'react';
import { 
  Flame, 
  Sparkles, 
  Globe, 
  ArrowRight,
  MessageSquare,
  MapPin,
  CheckCircle2,
  XCircle,
  Phone
} from 'lucide-react';
import { Lead, LeadStatus } from '../types';

interface KanbanBoardProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenPitchModal: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
}

const CRM_STAGES: { id: LeadStatus; label: string; color: string; bg: string }[] = [
  { id: 'NEW', label: '🆕 NEW LEADS', color: '#16a34a', bg: '#dcfce7' },
  { id: 'CONTACTED', label: '📨 CONTACTED', color: '#0284c7', bg: '#e0f2fe' },
  { id: 'REPLIED', label: '💬 REPLIED', color: '#7c3aed', bg: '#ede9fe' },
  { id: 'MEETING', label: '📅 MEETING / DEMO', color: '#d97706', bg: '#fef3c7' },
  { id: 'WON', label: '🏆 DEAL WON', color: '#15803d', bg: '#bbf7d0' },
  { id: 'LOST', label: '❌ LOST / ARCHIVED', color: '#dc2626', bg: '#fee2e2' }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  onSelectLead,
  onOpenPitchModal,
  onStatusChange
}) => {

  const getNextStage = (current: LeadStatus): LeadStatus | null => {
    const idx = CRM_STAGES.findIndex(s => s.id === current);
    if (idx !== -1 && idx < CRM_STAGES.length - 2) { // Won & Lost are terminal
      return CRM_STAGES[idx + 1].id;
    }
    return null;
  };

  return (
    <div style={{ padding: '24px', overflowX: 'auto', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
          Outreach CRM Pipeline
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
          Track client conversations from initial discovery to closed website deals.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '16px', minWidth: '1300px', paddingBottom: '20px' }}>
        
        {CRM_STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.status === stage.id);

          return (
            <div 
              key={stage.id}
              style={{
                flex: '1',
                minWidth: '240px',
                maxWidth: '280px',
                background: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 180px)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {/* Column Header */}
              <div style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: stage.color }}>
                    {stage.label}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: stage.bg,
                  color: stage.color
                }}>
                  {stageLeads.length}
                </span>
              </div>

              {/* Cards Scrollable Body */}
              <div style={{
                padding: '12px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flex: 1
              }}>
                {stageLeads.length === 0 ? (
                  <div style={{
                    padding: '24px 12px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '8px',
                    margin: 'auto 0'
                  }}>
                    No businesses in this stage.
                  </div>
                ) : (
                  stageLeads.map(lead => {
                    const fit = lead.freelancerFitScore || lead.scoreBreakdown.totalScore;
                    const nextStage = getNextStage(lead.status);
                    const verification = lead.websiteVerification;
                    const phoneClean = lead.contact?.phoneNormalized || lead.contact?.phone?.replace(/\D/g, '') || '';

                    return (
                      <div 
                        key={lead.id}
                        style={{
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          borderRadius: '10px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                          transition: 'box-shadow 0.15s'
                        }}
                      >
                        {/* Top Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                          <span style={{
                            fontSize: '0.675rem',
                            fontWeight: '800',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: fit >= 80 ? '#dcfce7' : '#fef3c7',
                            color: fit >= 80 ? '#15803d' : '#b45309'
                          }}>
                            🔥 Fit {fit}/100
                          </span>

                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: verification?.status === 'VERIFIED_NO_WEBSITE' ? '#fee2e2' : '#f1f5f9',
                            color: verification?.status === 'VERIFIED_NO_WEBSITE' ? '#dc2626' : '#475569'
                          }}>
                            {verification?.status === 'VERIFIED_NO_WEBSITE' ? '❌ NO WEBSITE' : '🌐 HAS SITE'}
                          </span>
                        </div>

                        {/* Title & Industry */}
                        <div>
                          <h4 
                            onClick={() => onSelectLead(lead)}
                            style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: '800', 
                              color: '#0f172a', 
                              cursor: 'pointer',
                              margin: '0 0 2px 0',
                              lineHeight: '1.3'
                            }}
                          >
                            {lead.company.name}
                          </h4>
                          <div style={{ fontSize: '0.725rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin size={11} /> {lead.company.city || lead.company.location} ({lead.company.industry})
                          </div>
                        </div>

                        {/* Contact details */}
                        <div style={{ fontSize: '0.725rem', color: '#334155' }}>
                          {lead.contact.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: '700' }}>
                              <Phone size={11} /> {lead.contact.phone}
                            </div>
                          )}
                          {lead.contact.email && (
                            <div style={{ fontSize: '0.7rem', color: '#0284c7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              ✉️ {lead.contact.email}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                          
                          {phoneClean && (
                            <a 
                              href={`https://wa.me/${phoneClean}?text=${encodeURIComponent(`Hi ${lead.company.name}! Noticed you offer ${lead.company.industry} in ${lead.company.city || 'the area'}, but don't have an official website listed on Google yet. We build fast, mobile-friendly sites for local trades in 48h. Can I send a 60-sec preview?`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: '700', background: '#25D366', borderColor: '#25D366', color: '#ffffff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <MessageSquare size={11} /> WA
                            </a>
                          )}

                          <button 
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                            onClick={() => onOpenPitchModal(lead)}
                            title="Open pitch scripts"
                          >
                            <Sparkles size={11} color="#d97706" /> Pitch
                          </button>

                          {nextStage && (
                            <button 
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                              onClick={() => onStatusChange(lead.id, nextStage)}
                              title={`Advance to ${nextStage}`}
                            >
                              Next <ArrowRight size={11} />
                            </button>
                          )}

                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
};
