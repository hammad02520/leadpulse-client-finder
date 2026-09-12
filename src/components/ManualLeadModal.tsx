import React, { useState } from 'react';
import { X, Plus, Building2, User, Mail, Phone, Globe, DollarSign } from 'lucide-react';
import { Lead, ProjectNeedType } from '../types';
import { calculateLeadScore } from '../services/scoringEngine';
import { runWebsiteAudit } from '../services/websiteAuditor';

interface ManualLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (lead: Lead) => void;
}

export const ManualLeadModal: React.FC<ManualLeadModalProps> = ({
  isOpen,
  onClose,
  onAddLead
}) => {
  if (!isOpen) return null;

  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('E-Commerce');
  const [websiteDomain, setWebsiteDomain] = useState('');
  const [personName, setPersonName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [projectNeed, setProjectNeed] = useState<ProjectNeedType>('WEB_REDESIGN');
  const [budget, setBudget] = useState('$2,500 - $5,000');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    const audit = runWebsiteAudit(websiteDomain || 'none');
    const scoreBreakdown = calculateLeadScore({
      hasExplicitHiringSignal: true,
      hasBusinessQuality: true,
      websiteAudit: audit,
      hasEmail: !!email,
      hasWhatsapp: !!phone,
      hasSocialPresence: true,
      freshnessTier: 'JUST_NOW',
      isExpired: false
    });

    const newLead: Lead = {
      id: `manual-${Date.now()}`,
      title: title || `Custom Lead: ${projectNeed} for ${companyName}`,
      description: description || `Manually added lead for ${companyName}.`,
      company: {
        name: companyName,
        industry,
        location: 'Custom Location',
        websiteUrl: websiteDomain ? `https://${websiteDomain}` : undefined,
        socialPresence: true
      },
      contact: {
        personName: personName || 'Owner / Decision Maker',
        email,
        phone,
        hasWhatsapp: !!phone
      },
      source: 'MANUAL_IMPORT',
      sourceUrl: websiteDomain ? `https://${websiteDomain}` : '#',
      projectNeed,
      budgetSignal: budget,
      scoreBreakdown,
      websiteAudit: audit,
      status: 'NEW',
      tags: ['MANUAL_ADD', projectNeed, 'FRESH'],
      notes: [`Manually added on ${new Date().toLocaleDateString()}`],
      discoveredAt: new Date().toISOString(),
      postedAt: new Date().toISOString(),
      freshnessTier: 'JUST_NOW',
      isExpired: false,
      lastVerifiedAt: new Date().toISOString(),
      outreachHistory: []
    };

    onAddLead(newLead);
    onClose();
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
        zIndex: 1200,
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
          maxWidth: '560px',
          background: '#0d131f',
          borderRadius: '16px',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111827' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} color="var(--primary)" /> Add Custom Prospect Lead
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Company Name *</label>
              <input required type="text" className="input-field" placeholder="Acme Corp" value={companyName} onChange={e => setCompanyName(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Website Domain</label>
              <input type="text" className="input-field" placeholder="acmecorp.com" value={websiteDomain} onChange={e => setWebsiteDomain(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Contact Person</label>
              <input type="text" className="input-field" placeholder="John Doe" value={personName} onChange={e => setPersonName(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email Address</label>
              <input type="email" className="input-field" placeholder="john@acmecorp.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Phone / WhatsApp</label>
              <input type="text" className="input-field" placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Project Need</label>
              <select className="input-field" value={projectNeed} onChange={e => setProjectNeed(e.target.value as any)}>
                <option value="WEB_REDESIGN">Web Redesign</option>
                <option value="MOBILE_APP">Mobile App (iOS/Android)</option>
                <option value="SAAS_MVP">SaaS MVP Development</option>
                <option value="ECOMMERCE">E-Commerce Store</option>
                <option value="SPEED_PERFORMANCE">Speed & Performance</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Budget Signal</label>
            <input type="text" className="input-field" placeholder="$3,000 - $6,000" value={budget} onChange={e => setBudget(e.target.value)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Plus size={16} /> Add & Run Audit</button>
          </div>

        </form>
      </div>
    </div>
  );
};
