import React from 'react';
import { 
  Flame, 
  Sparkles, 
  ChevronRight, 
  Globe, 
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { Lead, LeadStatus } from '../types';

interface KanbanBoardProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenPitchModal: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
}

const STAGES: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'NEW', label: '🆕 NEW LEADS', color: '#6366f1' },
  { id: 'QUALIFIED', label: '⭐ QUALIFIED', color: '#06b6d4' },
  { id: 'CONTACTED', label: '📨 CONTACTED', color: '#f59e0b' },
  { id: 'FOLLOW_UP', label: '⏳ FOLLOW-UP', color: '#ec4899' },
  { id: 'REPLIED', label: '💬 REPLIED', color: '#8b5cf6' },
  { id: 'MEETING', label: '📅 MEETING', color: '#3b82f6' },
  { id: 'PROPOSAL', label: '📝 PROPOSAL', color: '#14b8a6' },
  { id: 'WON', label: '🏆 WON', color: '#10b981' }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  onSelectLead,
  onOpenPitchModal,
  onStatusChange
}) => {

  const getNextStage = (current: LeadStatus): LeadStatus | null => {
    const idx = STAGES.findIndex(s => s.id === current);
    if (idx !== -1 && idx < STAGES.length - 1) {
      return STAGES[idx + 1].id;
    }
    return null;
  };

  return (
    <div style={{ padding: '0 16px 32px 16px', overflowX: 'auto' }}>
      
      <div style={{ display: 'flex', gap: '16px', minWidth: '1600px', paddingBottom: '16px' }}>
        
        {STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.status === stage.id);

          return (
            <div 
              key={stage.id}
              style={{
                flex: '1',
                minWidth: '280px',
                maxWidth: '320px',
                background: 'rgba(17, 24, 39, 0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 200px)'
              }}
            >
              {/* Stage Header */}
              <div style={{ 
                padding: '14px 16px', 
                borderBottom: '1px solid var(--border-color)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderTop: `3px solid ${stage.color}`,
                borderTopLeftRadius: '14px',
                borderTopRightRadius: '14px'
              }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '0.02em' }}>
                  {stage.label}
                </h3>
                <span style={{ 
                  background: 'rgba(255, 255, 255, 0.08)', 
                  color: 'var(--text-muted)', 
                  fontSize: '0.75rem', 
                  fontWeight: '700', 
                  padding: '2px 8px', 
                  borderRadius: '999px' 
                }}>
                  {stageLeads.length}
                </span>
              </div>

              {/* Cards Container */}
              <div style={{ padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', flex: '1' }}>
                {stageLeads.length === 0 ? (
                  <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                    No leads in this stage
                  </div>
                ) : (
                  stageLeads.map(lead => {
                    const tempClass = 
                      lead.scoreBreakdown.temperature === 'HOT' ? 'badge-hot' :
                      lead.scoreBreakdown.temperature === 'WARM' ? 'badge-warm' : 'badge-cold';

                    const nextStage = getNextStage(lead.status);

                    return (
                      <div 
                        key={lead.id}
                        className="glass-panel"
                        style={{
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          border: '1px solid var(--border-color)',
                          background: '#0d131f',
                          borderRadius: '10px'
                        }}
                      >
                        {/* Company & Score */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span className={`badge ${tempClass}`} style={{ fontSize: '0.7rem' }}>
                            Score {lead.scoreBreakdown.totalScore}/100
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '600' }}>
                            {lead.source}
                          </span>
                        </div>

                        {/* Title & Industry */}
                        <div>
                          <h4 
                            onClick={() => onSelectLead(lead)}
                            style={{ 
                              fontSize: '0.9rem', 
                              fontWeight: '700', 
                              color: 'var(--text-main)', 
                              cursor: 'pointer',
                              lineHeight: '1.3'
                            }}
                          >
                            {lead.company.name}
                          </h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {lead.title}
                          </p>
                        </div>

                        {/* Audit Snippet */}
                        <div style={{ fontSize: '0.725rem', background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '6px' }}>
                          <div style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                            <Globe size={11} /> {lead.websiteAudit.domain}
                          </div>
                          <div style={{ color: 'var(--text-dim)', marginTop: '2px' }}>
                            Opportunity: {lead.websiteAudit.opportunityScore}/100
                          </div>
                        </div>

                        {/* Footer & Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                          
                          <button 
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                            onClick={() => onOpenPitchModal(lead)}
                          >
                            <Sparkles size={12} /> Pitch
                          </button>

                          {nextStage && (
                            <button 
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                              onClick={() => onStatusChange(lead.id, nextStage)}
                              title={`Advance to ${nextStage}`}
                            >
                              Move <ArrowRight size={12} />
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
