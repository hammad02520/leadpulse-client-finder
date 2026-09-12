import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Mail, 
  MessageSquare, 
  Check, 
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Lead } from '../types';
import { generateAIPitch, AIPitchResult } from '../services/aiPitchGenerator';

interface OutreachModalProps {
  lead: Lead | null;
  onClose: () => void;
  onRecordOutreach: (leadId: string, type: 'EMAIL' | 'WHATSAPP', pitchText: string) => void;
}

export const OutreachModal: React.FC<OutreachModalProps> = ({
  lead,
  onClose,
  onRecordOutreach
}) => {
  if (!lead) return null;

  const [pitchData, setPitchData] = useState<AIPitchResult | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (lead) {
      const generated = generateAIPitch(lead);
      setPitchData(generated);
      setEmailSubject(generated.emailSubject);
      setEmailBody(generated.emailBody);
    }
  }, [lead]);

  if (!pitchData) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunchEmail = () => {
    const mailtoUrl = `mailto:${lead.contact.email || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    onRecordOutreach(lead.id, 'EMAIL', emailBody);
    window.location.href = mailtoUrl;
  };

  const handleLaunchWhatsApp = () => {
    onRecordOutreach(lead.id, 'WHATSAPP', pitchData.whatsappMessage);
    window.open(pitchData.whatsappUrl, '_blank');
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          background: '#0d131f',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Modal Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111827' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '8px', borderRadius: '10px' }}>
              <Sparkles size={20} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>
                Truthful AI Pitch Generator
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Target: {lead.company.name} ({lead.websiteAudit.domain})
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          
          {/* Truth Guarantee Alert */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <ShieldCheck size={16} />
            <span><strong>Factual Pitch Engine:</strong> Pitch relies strictly on verified website audit signals ({lead.websiteAudit.issuesDetected.length} audit issues found). Zero false claims!</span>
          </div>

          {/* Email Subject Line */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Email Subject Line
            </label>
            <input 
              type="text" 
              className="input-field" 
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </div>

          {/* Email Body */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Personalized Cold Email Pitch Draft
            </label>
            <textarea 
              className="input-field" 
              rows={9}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: '1.6' }}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
            />
          </div>

          {/* Safe WhatsApp Preview Box */}
          <div style={{ background: '#090d16', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#25D366', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={16} /> Safe WhatsApp wa.me Draft Preview:
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              "{pitchData.whatsappMessage}"
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0d131f', flexWrap: 'wrap', gap: '12px' }}>
          
          <button className="btn btn-secondary" onClick={handleCopy}>
            {copied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
            {copied ? 'Copied Pitch!' : 'Copy to Clipboard'}
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-whatsapp" onClick={handleLaunchWhatsApp}>
              <MessageSquare size={16} /> Launch WhatsApp wa.me
            </button>

            <button className="btn btn-email" onClick={handleLaunchEmail}>
              <Mail size={16} /> Launch Mail Client
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
