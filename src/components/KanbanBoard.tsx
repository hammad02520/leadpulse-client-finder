import React from 'react';
import { 
  Flame, 
  Sparkles, 
  Globe, 
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
  { id: 'NEW', label: '🆕 NEW LEADS', color: '#4f46e5' },
  { id: 'QUALIFIED', label: '⭐ QUALIFIED', color: '#0284c7' },
  { id: 'CONTACTED', label: '📨 CONTACTED', color: '#d97706' },
  { id: 'FOLLOW_UP', label: '⏳ FOLLOW-UP', color: '#db2777' },
  { id: 'REPLIED', label: '💬 REPLIED', color: '#7c3aed' },
  { id: 'MEETING', label: '📅 MEETING', color: '#2563eb' },
  { id: 'PROPOSAL', label: '📝 PROPOSAL', color: '#0d9488' },
  { id: 'WON', label: '🏆 WON', color: '#16a34a' },
  { id: 'LOST', label: '❌ LOST', color: '#dc2626' }
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
    <div style={{ padding: '24px', overflowX: 'auto' }}>
      
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
                background: '#f4f4f5',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 140px)'
              }}
            >
              {/* Stage Header */}
              <div style={{ 
                padding: '12px 16px', 
                borderBottom: '1px solid var(--border-color)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                background: '#ffffff',
                borderTop: `3px solid ${stage.color}`,
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px'
              }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: '700', color: '#09090b', letterSpacing: '0.02em' }}>
                  {stage.label}
                </h3>
                <span style={{ 
                  background: '#f4f4f5', 
                  color: '#71717a', 
                  fontSize: '0.725rem', 
                  fontWeight: '700', 
                  padding: '2px 8px', 
                  borderRadius: '999px' 
                }}>
                  {stageLeads.length}
                </span>
              </div>

              {/* Cards Container */}
              <div style={{ padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', flex: '1' }}>
                {stageLeads.length === 0 ? (
                  <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '0.75rem', color: '#a1a1aa', border: '1px dashed #e4e4e7', borderRadius: '8px', background: '#ffffff' }}>
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
                        style={{
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          border: '1px solid #e4e4e7',
                          background: '#ffffff',
                          borderRadius: '10px',
                          boxShadow: 'var(--shadow-sm)',
                          opacity: lead.isExpired ? 0.6 : 1
                        }}
                      >
                        {/* Company & Score */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span className={`badge ${tempClass}`} style={{ fontSize: '0.7rem' }}>
                            Score {lead.scoreBreakdown.totalScore}/100
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '700' }}>
                            {lead.source}
                          </span>
                        </div>

                        {/* Title & Industry */}
                        <div>
                          <h4 
                            onClick={() => onSelectLead(lead)}
                            style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: '700', 
                              color: '#09090b', 
                              cursor: 'pointer',
                              lineHeight: '1.3'
                            }}
                          >
                            {lead.company.name}
                          </h4>
                          <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px', lineHeight: '1.3' }}>
                            {lead.title}
                          </p>
                        </div>

                        {/* Audit Snippet */}
                        <div style={{ fontSize: '0.725rem', background: '#f4f4f5', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e4e4e7' }}>
                          <div style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
                            <Globe size={12} /> {lead.websiteAudit.domain}
                          </div>
                          <div style={{ color: '#71717a', marginTop: '2px' }}>
                            Opportunity: {lead.websiteAudit.opportunityScore}/100
                          </div>
                        </div>

                        {/* Footer & Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #e4e4e7' }}>
                          
                          <button 
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                            onClick={() => onOpenPitchModal(lead)}
                            disabled={lead.isExpired}
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
