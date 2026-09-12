import React, { useState } from 'react';
import { 
  Briefcase, 
  Search, 
  Flame, 
  ExternalLink, 
  Sparkles, 
  Code2, 
  Clock, 
  Layers
} from 'lucide-react';
import { Lead, ProjectNeedType } from '../types';
import { liveScraperService } from '../services/liveScraperService';

interface RemoteJobsViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenPitchModal: (lead: Lead) => void;
  onAddDiscoveredLeads: (newLeads: Lead[]) => void;
}

export const RemoteJobsView: React.FC<RemoteJobsViewProps> = ({
  leads,
  onSelectLead,
  onOpenPitchModal,
  onAddDiscoveredLeads
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [needFilter, setNeedFilter] = useState<ProjectNeedType | 'ALL'>('ALL');
  const [isScrapingLive, setIsScrapingLive] = useState(false);

  // Filter remote developer jobs & reddit hiring posts
  const remoteLeads = leads.filter(l => l.source === 'JOB_FEED' || l.source === 'REDDIT');

  const filteredLeads = remoteLeads.filter(l => {
    const matchesSearch = 
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesNeed = needFilter === 'ALL' || l.projectNeed === needFilter;

    return matchesSearch && matchesNeed;
  });

  const handleRunLiveScrape = async () => {
    setIsScrapingLive(true);
    try {
      const jobFeedResults = await liveScraperService.scrapeLiveJobFeedLeads();
      const redditResults = await liveScraperService.scrapeLiveRedditLeads();
      onAddDiscoveredLeads([...jobFeedResults, ...redditResults]);
    } catch (e) {
      console.error('Live Job Scrape Error:', e);
    } finally {
      setIsScrapingLive(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f4f4f5 100%)', borderLeft: '5px solid #0284c7' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-hot" style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd' }}>
                💼 Remote Developer & Client Project Feed
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-Time Open Web API Ingestion</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Remote Fullstack & Mobile Developer Project Finder
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Scrape live tech hiring posts from Remotive, Arbeitnow, Jobicy, HackerNews Algolia, and GitHub Hiring Issues.
            </p>
          </div>

          <button 
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.875rem', fontWeight: '700' }}
            onClick={handleRunLiveScrape}
            disabled={isScrapingLive}
          >
            {isScrapingLive ? '⏳ Scraping Live Jobs...' : '🔄 Scrape Live Remote Jobs Now'}
          </button>
        </div>
      </div>

      {/* Filter Controls Panel */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '260px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text"
            className="input-field"
            placeholder="Search remote developer jobs by title, company, or tech..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Code2 size={16} color="#0284c7" />
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#3f3f46' }}>Category Need:</span>
          <select 
            className="input-field" 
            style={{ width: 'auto', fontSize: '0.8rem', padding: '6px 12px' }}
            value={needFilter}
            onChange={(e) => setNeedFilter(e.target.value as any)}
          >
            <option value="ALL">🛠️ All Project Needs</option>
            <option value="EBOOK_CREATOR_NEED_APP">📚 E-Book Author / Course Creator App</option>
            <option value="HAS_WEBSITE_NO_APP">🌐 Has Website, Missing Mobile App</option>
            <option value="MOBILE_APP">📱 Mobile App (iOS / Android)</option>
            <option value="WEB_REDESIGN">🎨 Web Redesign</option>
            <option value="SAAS_MVP">🚀 SaaS MVP Development</option>
            <option value="ECOMMERCE">🛍️ E-Commerce Store</option>
            <option value="SPEED_PERFORMANCE">⚡ Speed & Performance</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
          Showing <strong>{filteredLeads.length}</strong> live remote leads
        </div>

      </div>

      {/* Remote Jobs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {filteredLeads.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            <Briefcase size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>No Remote Jobs Match Filters</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              Click <strong>"🔄 Scrape Live Remote Jobs Now"</strong> to fetch fresh real-time hiring posts!
            </p>
          </div>
        ) : (
          filteredLeads.map(lead => {
            const score = lead.scoreBreakdown.totalScore;

            return (
              <div 
                key={lead.id}
                className="glass-panel"
                style={{ 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  gap: '14px',
                  borderTop: '4px solid #4f46e5' 
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="badge badge-fresh">
                      <Clock size={12} /> Live Scraped
                    </span>
                    <span className="badge badge-hot">
                      <Flame size={12} /> Score {score}/100
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1.3' }}>
                    {lead.title}
                  </h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#09090b' }}>
                      {lead.company.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {lead.company.industry}</span>
                  </div>

                  <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                    {lead.description}
                  </p>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '4px', fontWeight: '700' }}>
                      {lead.projectNeed}
                    </span>
                    {lead.budgetSignal && (
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#d1fae5', color: '#059669', borderRadius: '4px', fontWeight: '700' }}>
                        💰 {lead.budgetSignal}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                  <a 
                    href={lead.sourceUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ fontSize: '0.775rem', color: 'var(--primary)', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                    title="Open direct job application link in new tab"
                  >
                    Apply / Source Link <ExternalLink size={12} />
                  </a>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      onClick={() => onSelectLead(lead)}
                    >
                      Inspect Audit
                    </button>
                    <button 
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      onClick={() => onOpenPitchModal(lead)}
                    >
                      <Sparkles size={13} /> Pitch
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
