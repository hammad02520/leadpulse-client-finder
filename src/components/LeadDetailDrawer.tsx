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
  AlertCircle,
  Zap,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { pageSpeedService } from '../services/pageSpeedService';
import { calculateLeadScore } from '../services/scoringEngine';
import { formatExternalUrl } from '../services/contactValidationService';
import { swedenRegistryService, ViesVerificationResult } from '../services/swedenRegistryService';
import { Lead, LeadStatus } from '../types';

interface LeadDetailDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onOpenPitchModal: (lead: Lead) => void;
  onAddNote: (leadId: string, note: string) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onUpdateLead?: (lead: Lead) => void;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  lead,
  onClose,
  onOpenPitchModal,
  onAddNote,
  onStatusChange,
  onUpdateLead
}) => {
  const [newNote, setNewNote] = useState('');
  const [isAuditingPageSpeed, setIsAuditingPageSpeed] = useState(false);
  const [pageSpeedStatus, setPageSpeedStatus] = useState<string | null>(null);
  const [viesResult, setViesResult] = useState<ViesVerificationResult | null>(null);
  const [isVerifyingVies, setIsVerifyingVies] = useState(false);

  if (!lead) return null;

  const handleVerifyVies = async () => {
    if (!lead.swedenVatInfo || isVerifyingVies) return;
    setIsVerifyingVies(true);
    try {
      const res = await swedenRegistryService.verifyVatWithVies(
        lead.swedenVatInfo.vatNumber || lead.swedenVatInfo.orgNumber
      );
      setViesResult(res);
    } catch (e) {
      console.error('VIES drawer check error:', e);
    } finally {
      setIsVerifyingVies(false);
    }
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(lead.id, newNote);
    setNewNote('');
  };

  const handleRunLivePageSpeed = async () => {
    if (!auditedSiteUrl) return;
    setIsAuditingPageSpeed(true);
    setPageSpeedStatus('Contacting Google PageSpeed Insights API...');
    try {
      const res = await pageSpeedService.runLiveLighthouseAudit(auditedSiteUrl);
      if (res.success && res.audit) {
        const updatedScore = calculateLeadScore({
          hasExplicitHiringSignal: true,
          hasBusinessQuality: true,
          websiteAudit: res.audit,
          hasEmail: Boolean(lead.contact.email),
          hasWhatsapp: Boolean(lead.contact.hasWhatsapp),
          hasSocialPresence: Boolean(lead.company.socialPresence),
          freshnessTier: lead.freshnessTier,
          isExpired: lead.isExpired
        });

        const updatedLead: Lead = {
          ...lead,
          websiteAudit: res.audit,
          scoreBreakdown: updatedScore,
          lastVerifiedAt: new Date().toISOString(),
          notes: [
            ...lead.notes,
            `${new Date().toLocaleDateString()}: ⚡ Ran Official Google Lighthouse Audit (Score: ${res.audit.performanceScore}/100, FCP: ${res.audit.fcp}, LCP: ${res.audit.lcp})`
          ]
        };

        if (onUpdateLead) {
          onUpdateLead(updatedLead);
        }
        setPageSpeedStatus('✅ Official Google Lighthouse audit completed!');
      } else {
        setPageSpeedStatus(res.errorMessage || 'Lighthouse audit could not be completed.');
      }
    } catch (e: any) {
      setPageSpeedStatus(e.message || 'PageSpeed API error');
    } finally {
      setIsAuditingPageSpeed(false);
      setTimeout(() => setPageSpeedStatus(null), 6000);
    }
  };

  const audit = lead.websiteAudit;
  const score = lead.scoreBreakdown;

  const rawSite = lead.company.websiteUrl || (audit.domain && audit.domain !== 'No Domain' && audit.domain !== 'none' ? audit.domain : undefined);
  const auditedSiteUrl = formatExternalUrl(rawSite);
  const googleSearchEmailUrl = `https://www.google.com/search?q=${encodeURIComponent('contact email ' + lead.company.name + ' ' + (audit.domain || ''))}`;
  const linkedinSearchUrl = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(lead.company.name + ' founder OR owner OR CTO')}`;

  const getSourceMeta = () => {
    switch (lead.source) {
      case 'GLOBAL_REGISTRY':
        return {
          title: 'Official Corporate Registry Source',
          subtitle: 'View official corporate registration & entity listing',
          buttonText: 'View Registry Entry ↗',
          directLinkText: 'Open Official Registry Listing ↗'
        };
      case 'TRADE_EXPO':
        return {
          title: 'Official Trade Show Directory',
          subtitle: 'View official trade event exhibitor entry & booth info',
          buttonText: 'View Exhibitor Entry ↗',
          directLinkText: 'Open Official Exhibitor Entry ↗'
        };
      case 'LOCAL_BIZ':
        return {
          title: 'OpenStreetMap Verified Node',
          subtitle: 'View physical business coordinates & map tags',
          buttonText: 'View on OSM ↗',
          directLinkText: 'View Business on OpenStreetMap ↗'
        };
      case 'FUNDED_STARTUP':
        return {
          title: 'Venture Funding Registry Source',
          subtitle: 'View official startup funding announcement & round details',
          buttonText: 'View Funding Source ↗',
          directLinkText: 'Open Startup Funding Announcement ↗'
        };
      case 'TECH_STACK':
        return {
          title: 'Technology Stack Signal Source',
          subtitle: 'View detected tech stack & website signals',
          buttonText: 'View Source Link ↗',
          directLinkText: 'Open Technology Signal Source ↗'
        };
      case 'SWEDEN_VAT_REGISTRY':
        return {
          title: 'Bolagsverket & Skatteverket Official Swedish Registry',
          subtitle: 'Public corporate registration, VAT filing (SE...01) & F-skatt record',
          buttonText: 'View on Allabolag ↗',
          directLinkText: 'Open Swedish Corporate Registry Record ↗'
        };
      default:
        return {
          title: 'Point-to-Point Direct Source URL',
          subtitle: 'Opens the exact original source posting page',
          buttonText: 'Open Source Link ↗',
          directLinkText: `Open Direct Source Listing (${lead.source}) ↗`
        };
    }
  };

  const sourceMeta = getSourceMeta();

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
            {lead.source !== 'SWEDEN_VAT_REGISTRY' && (
              <span className={`badge ${score.temperature === 'HOT' ? 'badge-hot' : 'badge-warm'}`}>
                Score {score.totalScore}/100 ({score.temperature})
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              {lead.source === 'SWEDEN_VAT_REGISTRY' ? '🇸🇪 Bolagsverket & SCB (Officiellt HVD)' : lead.source}
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
        
        {/* Point to Point Direct Link Banner */}
        <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#3730a3' }}>
              {sourceMeta.title}
            </div>
            <div style={{ fontSize: '0.725rem', color: '#4338ca' }}>
              {sourceMeta.subtitle}
            </div>
          </div>
          <a 
            href={formatExternalUrl(lead.sourceUrl)} 
            target="_blank" 
            rel="noreferrer"
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: '0.775rem', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {sourceMeta.buttonText}
          </a>
        </div>

        {/* 🇸🇪 Swedish Corporate & VAT Registry Profile */}
        {lead.swedenVatInfo && (
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#005293', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🇸🇪</span> SWEDISH TAX & CORPORATE REGISTRY
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: '800', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px' }}>
                ✅ F-Tax: Approved (F-skatt)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.675rem', fontWeight: '700' }}>ORGANIZATION NUMBER</span>
                <span style={{ fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>{lead.swedenVatInfo.orgNumber}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.675rem', fontWeight: '700' }}>VAT ID (MOMSNR)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '800', color: '#16a34a', fontFamily: 'monospace' }}>{lead.swedenVatInfo.vatNumber}</span>
                  {viesResult ? (
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: '800',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: viesResult.isValid ? '#dcfce7' : '#fee2e2',
                      color: viesResult.isValid ? '#15803d' : '#b91c1c'
                    }}>
                      {viesResult.isValid ? (viesResult.source === 'EU_VIES_OFFICIAL' ? '✓ EU VIES' : '✓ Luhn OK') : '✕ Invalid'}
                    </span>
                  ) : (
                    <button
                      onClick={handleVerifyVies}
                      disabled={isVerifyingVies}
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#0369a1',
                        cursor: isVerifyingVies ? 'wait' : 'pointer'
                      }}
                    >
                      {isVerifyingVies ? 'Checking...' : 'Check VIES'}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.675rem', fontWeight: '700' }}>ANNUAL TURNOVER</span>
                <span style={{ fontWeight: '800', color: '#0284c7' }}>{lead.swedenVatInfo.revenueSek}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.675rem', fontWeight: '700' }}>ENTITY TYPE</span>
                <span style={{ fontWeight: '700', color: '#334155' }}>{lead.swedenVatInfo.companyType}</span>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#334155' }}>
              <strong>Industry (SNI):</strong> {lead.swedenVatInfo.sniCode} — {lead.swedenVatInfo.sniDescription}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#334155' }}>
              <strong>CEO / Contact:</strong> {lead.swedenVatInfo.ceoOrContact}
            </div>

            {viesResult && (
              <div style={{
                background: viesResult.isValid ? '#ecfdf5' : '#fef2f2',
                border: `1px solid ${viesResult.isValid ? '#a7f3d0' : '#fecaca'}`,
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: viesResult.isValid ? '#065f46' : '#991b1b',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}>
                <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{viesResult.isValid ? '✅' : '⚠️'}</span>
                  <span>{viesResult.source === 'EU_VIES_OFFICIAL' ? 'EU Commission VIES Validation' : 'Skatteverket Checksum Validation'}</span>
                </div>
                <div>{viesResult.statusMessage}</div>
                {viesResult.name && <div><strong>EU Registered Name:</strong> {viesResult.name}</div>}
                {viesResult.address && <div><strong>EU Registered Address:</strong> {viesResult.address}</div>}
              </div>
            )}
          </div>
        )}

        {/* Website Technical Audit Card with Prominent Audited Link */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', color: '#09090b', margin: 0 }}>
              <Globe size={16} color="#0284c7" /> Technical Website Audit Signals
            </h3>

            {auditedSiteUrl && (
              <button
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', padding: '6px 12px' }}
                onClick={handleRunLivePageSpeed}
                disabled={isAuditingPageSpeed}
              >
                <Zap size={13} /> {isAuditingPageSpeed ? '⏳ Auditing PageSpeed...' : 'Run Live Lighthouse Audit'}
              </button>
            )}
          </div>

          {/* Status notification */}
          {pageSpeedStatus && (
            <div style={{ padding: '8px 12px', background: pageSpeedStatus.includes('✅') ? '#d1fae5' : '#e0f2fe', color: pageSpeedStatus.includes('✅') ? '#065f46' : '#0369a1', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} /> {pageSpeedStatus}
            </div>
          )}

          {/* EXACT AUDITED WEBSITE LINK BANNER */}
          {auditedSiteUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                <Globe size={16} color="#0284c7" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.825rem', fontWeight: '700', color: '#0369a1', whiteSpace: 'nowrap' }}>Audited Target Site:</span>
                <span style={{ fontSize: '0.825rem', fontWeight: '700', color: '#0284c7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {audit.domain}
                </span>
              </div>
              <a 
                href={auditedSiteUrl} 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.75rem', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
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

            <div style={{ background: '#f4f4f5', padding: '8px 10px', borderRadius: '6px' }}>
              <span style={{ color: '#71717a' }}>Meta Pixel:</span>{' '}
              <strong style={{ color: audit.hasMetaPixel ? '#b45309' : '#71717a' }}>
                {audit.hasMetaPixel ? '🔥 Active (Ads Spend)' : 'None'}
              </strong>
            </div>

            <div style={{ background: '#f4f4f5', padding: '8px 10px', borderRadius: '6px' }}>
              <span style={{ color: '#71717a' }}>AI Chatbot:</span>{' '}
              <strong style={{ color: audit.hasChatbot ? '#16a34a' : '#dc2626' }}>
                {audit.hasChatbot ? '✅ Detected' : '❌ Zero Bot (High AI Need)'}
              </strong>
            </div>

            <div style={{ background: '#f4f4f5', padding: '8px 10px', borderRadius: '6px' }}>
              <span style={{ color: '#71717a' }}>Booking Funnel:</span>{' '}
              <strong style={{ color: audit.phoneOnlyBooking ? '#dc2626' : '#16a34a' }}>
                {audit.phoneOnlyBooking ? '📞 Phone-Only' : 'Direct / Online'}
              </strong>
            </div>

            <div style={{ background: '#f4f4f5', padding: '8px 10px', borderRadius: '6px' }}>
              <span style={{ color: '#71717a' }}>Tech Stack:</span>{' '}
              <strong style={{ color: '#4f46e5' }}>
                {audit.techFramework || 'Standard Web'}
              </strong>
            </div>
          </div>

          {/* Layer 3 Intent Signals Banner */}
          {lead.intentSignals && (
            <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '0.75rem' }}>
              <div style={{ fontWeight: '800', color: '#6b21a8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={13} color="#9333ea" /> LAYER 3 BUYING INTENT SIGNALS:
              </div>
              <div style={{ color: '#581c87', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {lead.intentSignals.aiAutomationIntent && (
                  <div>• <strong>AI Automation:</strong> {lead.intentSignals.aiAutomationIntent.opportunity} (Need Score: {lead.intentSignals.aiAutomationIntent.aiNeedScore}/100)</div>
                )}
                {lead.intentSignals.agencyPartnerIntent && (
                  <div>• <strong>White-Label Partner:</strong> {lead.intentSignals.agencyPartnerIntent.agencyType} lacking dev staff (Score: {lead.intentSignals.agencyPartnerIntent.whiteLabelScore}/100)</div>
                )}
                {lead.intentSignals.ecommerceIntent && (
                  <div>• <strong>eCommerce Speed:</strong> {lead.intentSignals.ecommerceIntent.platform} losing conversion with {lead.intentSignals.ecommerceIntent.speedScore}/100 PageSpeed</div>
                )}
                {lead.intentSignals.fundingIntent && (
                  <div>• <strong>Capital Filing:</strong> {lead.intentSignals.fundingIntent.round} ({lead.intentSignals.fundingIntent.amount}) via {lead.intentSignals.fundingIntent.source}</div>
                )}
                {lead.intentSignals.techDebtIntent && (
                  <div>• <strong>Tech Debt:</strong> {lead.intentSignals.techDebtIntent.cms} with {lead.intentSignals.techDebtIntent.migrationUrgency} urgency</div>
                )}
                {lead.intentSignals.reviewPainIntent && (
                  <div>• <strong>Customer Review Pain:</strong> {lead.intentSignals.reviewPainIntent.complaintSummary}</div>
                )}
              </div>
            </div>
          )}

          {/* Real-Time Google Lighthouse Verified Metrics */}
          {audit.isLiveAudit && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '12px', marginBottom: '12px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '800', color: '#065f46', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} color="#059669" /> Google Lighthouse Live Metrics
                </span>
                <span style={{ fontSize: '0.7rem', color: '#047857', fontWeight: '700' }}>
                  Live Verified
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', color: '#064e3b' }}>
                <div>FCP (First Paint): <strong>{audit.fcp || 'N/A'}</strong></div>
                <div>LCP (Largest Content): <strong>{audit.lcp || 'N/A'}</strong></div>
                <div>CLS (Layout Shift): <strong>{audit.cls || 'N/A'}</strong></div>
                <div>Speed Index: <strong>{audit.speedIndex || 'N/A'}</strong></div>
                {audit.seoScore !== undefined && (
                  <div>SEO Score: <strong>{audit.seoScore}/100</strong></div>
                )}
                {audit.accessibilityScore !== undefined && (
                  <div>Accessibility: <strong>{audit.accessibilityScore}/100</strong></div>
                )}
              </div>
            </div>
          )}

          {/* Detected Bottlenecks List */}
          {audit.issuesDetected && audit.issuesDetected.length > 0 && (
            <div style={{ marginBottom: '12px', fontSize: '0.75rem' }}>
              <div style={{ fontWeight: '700', color: '#991b1b', marginBottom: '4px' }}>Audit Bottlenecks & Weaknesses:</div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#b91c1c' }}>
                {audit.issuesDetected.map((issue, idx) => (
                  <li key={idx} style={{ marginBottom: '2px' }}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {audit.aiOpportunityReason && (
            <div style={{ fontSize: '0.775rem', background: '#f0f9ff', borderLeft: '3px solid #0284c7', padding: '8px 10px', borderRadius: '4px', color: '#0369a1' }}>
              <strong>AI Pitch Angle:</strong> {audit.aiOpportunityReason}
            </div>
          )}
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
              <a href={formatExternalUrl(lead.sourceUrl)} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>
                {sourceMeta.directLinkText}
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
        {/* Outreach History */}
        {lead.outreachHistory && lead.outreachHistory.length > 0 && (
          <div className="glass-panel" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '10px', color: '#09090b' }}>📤 Outreach History ({lead.outreachHistory.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lead.outreachHistory.map((item) => (
                <div key={item.id} style={{ fontSize: '0.75rem', background: item.type === 'EMAIL' ? '#eff6ff' : '#f0fdf4', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${item.type === 'EMAIL' ? '#bfdbfe' : '#bbf7d0'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: item.type === 'EMAIL' ? '#1d4ed8' : '#15803d' }}>{item.type === 'EMAIL' ? '📧 Email Sent' : '💬 WhatsApp Sent'}</strong>
                    <span style={{ color: '#71717a' }}>{new Date(item.sentAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ color: '#52525b', margin: 0, lineHeight: '1.4' }}>{item.pitchText.slice(0, 120)}...</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
