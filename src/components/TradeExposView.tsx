import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Search, 
  MapPin, 
  RefreshCw, 
  Download, 
  Flame, 
  Sparkles, 
  Mail, 
  MessageSquare, 
  Tag, 
  Zap, 
  Code2, 
  Layout, 
  CheckCircle2, 
  Globe2,
  BadgeAlert
} from 'lucide-react';
import { Lead, LeadStatus } from '../types';
import { tradeExposService, FEATURED_TRADE_EXPOS } from '../services/tradeExposService';

interface TradeExposViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenPitchModal: (lead: Lead) => void;
  onStatusChange?: (leadId: string, status: LeadStatus) => void;
  onExportCSV: () => void;
  onAddDiscoveredLeads: (newLeads: Lead[]) => void;
}

export const TradeExposView: React.FC<TradeExposViewProps> = ({
  leads,
  onSelectLead,
  onOpenPitchModal,
  onExportCSV,
  onAddDiscoveredLeads
}) => {
  const [selectedExpo, setSelectedExpo] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const expoLeads = useMemo(() => {
    return leads.filter(l => l.source === 'TRADE_EXPO');
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return expoLeads.filter(lead => {
      const matchesExpo = selectedExpo === 'ALL' 
        || (lead.expoInfo && lead.expoInfo.expoName.toLowerCase().includes(selectedExpo.toLowerCase()))
        || lead.tags.some(t => t.toLowerCase().includes(selectedExpo.toLowerCase()));

      const matchesSearch = !searchQuery 
        || lead.company.name.toLowerCase().includes(searchQuery.toLowerCase())
        || lead.title.toLowerCase().includes(searchQuery.toLowerCase())
        || (lead.contact.personName && lead.contact.personName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesExpo && matchesSearch;
    });
  }, [expoLeads, selectedExpo, searchQuery]);

  const hotCount = filteredLeads.filter(l => l.scoreBreakdown.temperature === 'HOT').length;
  const speedRebuildCount = filteredLeads.filter(l => l.websiteAudit.performanceScore < 50).length;

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      const discovered = await tradeExposService.discoverExhibitorLeads({
        expoName: selectedExpo,
        limit: 100
      });
      onAddDiscoveredLeads(discovered);
    } catch (err) {
      console.error('Expo scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
        color: '#ffffff',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(4, 120, 87, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ background: '#10b981', color: '#ffffff', fontSize: '0.75rem', fontWeight: '800', padding: '4px 10px', borderRadius: '999px', letterSpacing: '0.05em' }}>
              EXPO & TRADE SHOW MODULE
            </span>
            <span style={{ color: '#a7f3d0', fontSize: '0.825rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} /> High-Budget Exhibitor Directories
            </span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '6px', color: '#ffffff' }}>
            Trade Shows & Exhibition Exhibitors
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#d1fae5', lineHeight: '1.5' }}>
            Target companies spending $10k–$50k+ on exhibition booths (GITEX Dubai, CES Vegas, Arab Health, Web Summit). Pitch mobile speed rebuilds and booth QR landing apps.
          </p>
        </div>

        <button 
          onClick={handleRunScan}
          disabled={isScanning}
          style={{
            background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '0.9rem',
            cursor: isScanning ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)'
          }}
        >
          <RefreshCw size={18} className={isScanning ? 'spin-icon' : ''} />
          {isScanning ? 'Scanning Exhibitors...' : 'Scan Expo Exhibitors 🎪'}
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} color="#059669" /> Exhibitor Leads
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
            {filteredLeads.length}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={16} color="#ef4444" /> Hot Opportunities (80+)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
            {hotCount}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={16} color="#d97706" /> Slow Speed / Rebuild Need
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>
            {speedRebuildCount}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button 
            onClick={onExportCSV}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: '#f8fafc',
              fontWeight: '700',
              fontSize: '0.85rem',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Download size={16} /> Export Exhibitors CSV
          </button>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Expo Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '260px' }}>
          <label style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)' }}>
            Select Featured Trade Show / Expo
          </label>
          <select 
            value={selectedExpo} 
            onChange={(e) => setSelectedExpo(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontWeight: '600',
              fontSize: '0.875rem',
              background: '#ffffff'
            }}
          >
            {FEATURED_TRADE_EXPOS.map(exp => (
              <option key={exp.id} value={exp.id}>{exp.name}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '220px' }}>
          <label style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-muted)' }}>
            Search Exhibitor / Booth #
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search exhibitor name, booth number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

      </div>

      {/* Grid of Exhibitors */}
      {filteredLeads.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Calendar size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
            No Exhibitor Leads Discovered Yet
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '6px' }}>
            Click "Scan Expo Exhibitors 🎪" above to extract active trade show exhibitors.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filteredLeads.map((lead) => (
            <div 
              key={lead.id} 
              className="card" 
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: lead.scoreBreakdown.temperature === 'HOT' ? '4px solid #ef4444' : '4px solid #059669'
              }}
            >
              <div>
                {/* Top Badges */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    background: '#dcfce7',
                    color: '#15803d',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Calendar size={12} /> {lead.expoInfo?.expoName || 'Expo Exhibitor'}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`badge badge-${lead.scoreBreakdown.temperature.toLowerCase()}`}>
                      <Flame size={12} /> {lead.scoreBreakdown.totalScore}/100
                    </span>
                  </div>
                </div>

                {/* Company Name & Title */}
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {lead.company.name}
                </h3>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <MapPin size={13} /> {lead.company.location}
                </div>

                {/* Booth Details Box */}
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '10px', marginBottom: '12px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#047857', fontWeight: '700' }}>Booth / Stand:</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontWeight: '800', color: '#065f46' }}>
                      {lead.expoInfo?.boothNumber}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Contact Person:</span>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                      {lead.contact.personName} ({lead.contact.role})
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>PageSpeed Score:</span>
                    <span style={{ fontWeight: '800', color: lead.websiteAudit.performanceScore < 50 ? '#dc2626' : '#d97706' }}>
                      {lead.websiteAudit.performanceScore}/100 on Mobile
                    </span>
                  </div>
                </div>

                {/* Pitch Angle Reason */}
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '10px', fontSize: '0.8rem', color: '#c2410c', marginBottom: '14px' }}>
                  <Sparkles size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  {lead.websiteAudit.aiOpportunityReason}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => onOpenPitchModal(lead)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#059669',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Mail size={14} /> AI Expo Pitch
                </button>

                {lead.contact.hasWhatsapp && (
                  <a 
                    href={`https://wa.me/${lead.contact.phoneNormalized?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${lead.contact.personName}, saw your team is exhibiting at ${lead.expoInfo?.expoName} (Booth ${lead.expoInfo?.boothNumber}). We build fast mobile app lead capture portals for trade shows. Check our work...`)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #bbf7d0',
                      background: '#dcfce7',
                      color: '#15803d',
                      fontWeight: '700',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'none'
                    }}
                  >
                    <MessageSquare size={14} /> WhatsApp
                  </a>
                )}

                <button 
                  onClick={() => onSelectLead(lead)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: '#ffffff',
                    color: 'var(--text-main)',
                    fontWeight: '600',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Details
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
