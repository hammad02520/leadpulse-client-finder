import React from 'react';
import { 
  Flame, 
  Sun, 
  Snowflake, 
  TrendingUp, 
  Send, 
  Layers, 
  Globe, 
  Sparkles,
  ArrowRight,
  Clock,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { Lead } from '../types';

interface DashboardProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenPitchModal: (lead: Lead) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  leads,
  onSelectLead,
  onOpenPitchModal
}) => {
  const total = leads.length;
  const hotLeads = leads.filter(l => l.scoreBreakdown.temperature === 'HOT');
  const warmLeads = leads.filter(l => l.scoreBreakdown.temperature === 'WARM');
  const coldLeads = leads.filter(l => l.scoreBreakdown.temperature === 'COLD');

  const contactedCount = leads.filter(l => ['CONTACTED', 'FOLLOW_UP', 'REPLIED', 'MEETING', 'PROPOSAL', 'WON'].includes(l.status)).length;
  const wonCount = leads.filter(l => l.status === 'WON').length;

  const avgAuditScore = Math.round(
    leads.reduce((acc, curr) => acc + (curr.websiteAudit.opportunityScore || 0), 0) / (total || 1)
  );

  const redditCount = leads.filter(l => l.source === 'REDDIT').length;
  const jobFeedCount = leads.filter(l => l.source === 'JOB_FEED').length;
  const localBizCount = leads.filter(l => l.source === 'LOCAL_BIZ').length;
  const b2bCount = leads.filter(l => l.source === 'B2B_APOLLO').length;
  const techStackCount = leads.filter(l => l.source === 'TECH_STACK').length;
  const startupCount = leads.filter(l => l.source === 'FUNDED_STARTUP').length;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Title & Subtitle */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Executive Lead Overview
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Real-time high-intent client discovery & technical audit score breakdown.
        </p>
      </div>

      {/* Top Metrics Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        {/* Total Discovered */}
        <div className="glass-panel" style={{ padding: '20px', borderTop: '4px solid #4f46e5' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Total Ingested Leads</span>
            <Layers size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>{total}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px', fontWeight: '600' }}>
            ✓ Multi-adapter synced
          </div>
        </div>

        {/* Hot Opportunities */}
        <div className="glass-panel" style={{ padding: '20px', borderTop: '4px solid #e11d48' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Hot Opportunities</span>
            <Flame size={18} color="#e11d48" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#e11d48' }}>{hotLeads.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Score 80+ (High Intent & Verified)
          </div>
        </div>

        {/* Audit Score */}
        <div className="glass-panel" style={{ padding: '20px', borderTop: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Avg Opportunity Score</span>
            <Globe size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0284c7' }}>{avgAuditScore}/100</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Tech gap & mobile audit index
          </div>
        </div>

        {/* Active Outreach */}
        <div className="glass-panel" style={{ padding: '20px', borderTop: '4px solid #059669' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Active Outreach</span>
            <Send size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#059669' }}>{contactedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {wonCount} Won Deals | Safe wa.me/mailto
          </div>
        </div>

      </div>

      {/* Middle Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Source Adapter Throughput */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--primary)" /> Adapter Source Ingestion
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Reddit */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: '#ea580c', fontWeight: '600' }}>Reddit Subreddits</span>
                <span style={{ fontWeight: '700' }}>{redditCount} leads</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(redditCount / (total || 1)) * 100}%`, height: '100%', background: '#ea580c' }}></div>
              </div>
            </div>

            {/* Job Feeds */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: '#0284c7', fontWeight: '600' }}>Remote Job Feeds (HN, WWR)</span>
                <span style={{ fontWeight: '700' }}>{jobFeedCount} leads</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(jobFeedCount / (total || 1)) * 100}%`, height: '100%', background: '#0284c7' }}></div>
              </div>
            </div>

            {/* Local Business */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: '#059669', fontWeight: '600' }}>Local Business (OpenStreetMap)</span>
                <span style={{ fontWeight: '700' }}>{localBizCount} leads</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(localBizCount / (total || 1)) * 100}%`, height: '100%', background: '#059669' }}></div>
              </div>
            </div>

            {/* B2B Decision Makers */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: '#8b5cf6', fontWeight: '600' }}>B2B Decision Makers (CEO/CTO)</span>
                <span style={{ fontWeight: '700' }}>{b2bCount} leads</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(b2bCount / (total || 1)) * 100}%`, height: '100%', background: '#8b5cf6' }}></div>
              </div>
            </div>

            {/* Tech Stack Audits */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: '#d97706', fontWeight: '600' }}>Tech Stack & Slow Sites</span>
                <span style={{ fontWeight: '700' }}>{techStackCount} leads</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(techStackCount / (total || 1)) * 100}%`, height: '100%', background: '#d97706' }}></div>
              </div>
            </div>

            {/* Funded Startups */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: '#f43f5e', fontWeight: '600' }}>Funded Startups & Launches</span>
                <span style={{ fontWeight: '700' }}>{startupCount} leads</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(startupCount / (total || 1)) * 100}%`, height: '100%', background: '#f43f5e' }}></div>
              </div>
            </div>

          </div>
        </div>

        {/* Lead Quality Tiers */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--accent-amber)" /> Quality Tier Breakdown
          </h3>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <div style={{ flex: 1, padding: '14px', background: '#ffe4e6', borderRadius: '12px', border: '1px solid #fecdd3', textAlign: 'center' }}>
              <Flame color="#e11d48" size={22} style={{ margin: '0 auto 4px auto' }} />
              <div style={{ fontWeight: '800', fontSize: '1.3rem', color: '#e11d48' }}>{hotLeads.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#9f1239', fontWeight: '600' }}>Hot (80-100)</div>
            </div>

            <div style={{ flex: 1, padding: '14px', background: '#fef3c7', borderRadius: '12px', border: '1px solid #fde68a', textAlign: 'center' }}>
              <Sun color="#d97706" size={22} style={{ margin: '0 auto 4px auto' }} />
              <div style={{ fontWeight: '800', fontSize: '1.3rem', color: '#d97706' }}>{warmLeads.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: '600' }}>Warm (60-79)</div>
            </div>

            <div style={{ flex: 1, padding: '14px', background: '#e0f2fe', borderRadius: '12px', border: '1px solid #bae6fd', textAlign: 'center' }}>
              <Snowflake color="#0284c7" size={22} style={{ margin: '0 auto 4px auto' }} />
              <div style={{ fontWeight: '800', fontSize: '1.3rem', color: '#0284c7' }}>{coldLeads.length}</div>
              <div style={{ fontSize: '0.75rem', color: '#075985', fontWeight: '600' }}>Cold (40-59)</div>
            </div>
          </div>
        </div>

      </div>

      {/* Top High Intent Opportunities Feed */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <Sparkles size={18} color="var(--primary)" /> Top High-Intent Client Opportunities
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Prioritized by Lead Score, website audit issues, and direct contactability.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {hotLeads.concat(warmLeads).slice(0, 4).map(lead => (
            <div 
              key={lead.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                gap: '16px',
                flexWrap: 'wrap',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ flex: '1', minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className={`badge ${lead.scoreBreakdown.temperature === 'HOT' ? 'badge-hot' : 'badge-warm'}`}>
                    Score {lead.scoreBreakdown.totalScore}/100
                  </span>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>{lead.company.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {lead.company.industry}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {lead.title}
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {lead.websiteAudit.issuesDetected.slice(0, 2).map((issue, idx) => (
                    <span key={idx} style={{ fontSize: '0.7rem', color: '#dc2626', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                      ⚠️ {issue}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => onSelectLead(lead)}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Inspect Audit
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => onOpenPitchModal(lead)}
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                >
                  <Sparkles size={14} /> AI Pitch <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
