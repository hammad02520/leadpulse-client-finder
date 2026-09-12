import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Mail, 
  MessageSquare, 
  Check, 
  ShieldCheck
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
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
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
          maxWidth: '640px',
          background: '#ffffff',
          borderRadius: '14px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
        }}
      >
        {/* Modal Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--primary)" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#09090b' }}>
                Factual AI Proposal Generator
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#71717a' }}>
                Target: {lead.company.name} ({lead.websiteAudit.domain})
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#15803d', background: '#f0fdf4', padding: '8px 12px', borderRadius: '6px', border: '1px solid #dcfce7' }}>
            <ShieldCheck size={15} />
            <span><strong>Verified Data:</strong> Proposal uses factual website audit signals ({lead.websiteAudit.issuesDetected.length} audit issues detected).</span>
          </div>

          {/* Email Subject Line */}
          <div>
            <label style={{ fontSize: '0.775rem', fontWeight: '700', color: '#3f3f46', display: 'block', marginBottom: '4px' }}>
              Subject Line
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
            <label style={{ fontSize: '0.775rem', fontWeight: '700', color: '#3f3f46', display: 'block', marginBottom: '4px' }}>
              Cold Pitch Body
            </label>
            <textarea 
              className="input-field" 
              rows={8}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: '1.6' }}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
            />
          </div>

          {/* WhatsApp Preview */}
          <div style={{ background: '#f4f4f5', padding: '12px', borderRadius: '8px', border: '1px solid #e4e4e7' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#15803d', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MessageSquare size={14} /> Safe WhatsApp Draft Preview:
            </div>
            <p style={{ fontSize: '0.75rem', color: '#52525b', fontStyle: 'italic' }}>
              "{pitchData.whatsappMessage}"
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa', flexWrap: 'wrap', gap: '10px' }}>
          
          <button className="btn btn-secondary" onClick={handleCopy}>
            {copied ? <Check size={15} color="#16a34a" /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy Pitch'}
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-whatsapp" onClick={handleLaunchWhatsApp}>
              <MessageSquare size={15} /> Open WhatsApp wa.me
            </button>

            <button className="btn btn-email" onClick={handleLaunchEmail}>
              <Mail size={15} /> Open Mail Client
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
