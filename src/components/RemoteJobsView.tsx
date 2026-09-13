import React, { useState } from 'react';
import { 
  Briefcase, 
  Search, 
  Flame, 
  ExternalLink, 
  Sparkles, 
  Code2, 
  Clock, 
  Layers,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download
} from 'lucide-react';
import { Lead, ProjectNeedType, JobFeedSource } from '../types';
import { liveScraperService } from '../services/liveScraperService';
import { leadService } from '../services/leadService';

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
  const [sourceFilter, setSourceFilter] = useState<JobFeedSource>('ALL');
  const [isScrapingLive, setIsScrapingLive] = useState(false);
  const [scrapeSuccessMsg, setScrapeSuccessMsg] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter remote developer jobs & reddit hiring posts
  const remoteLeads = leads.filter(l => l.source === 'JOB_FEED' || l.source === 'REDDIT');

  const filteredLeads = remoteLeads.filter(l => {
    const matchesSearch = 
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.company.location && l.company.location.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesNeed = needFilter === 'ALL' || l.projectNeed === needFilter;

    let matchesSource = true;
    if (sourceFilter === 'REMOTIVE') {
      matchesSource = l.tags.includes('REMOTIVE_API') || l.sourceUrl.includes('remotive');
    } else if (sourceFilter === 'ARBEITNOW') {
      matchesSource = l.tags.includes('ARBEITNOW_API') || l.sourceUrl.includes('arbeitnow');
    } else if (sourceFilter === 'JOBICY') {
      matchesSource = l.tags.includes('JOBICY_API') || l.sourceUrl.includes('jobicy');
    } else if (sourceFilter === 'HACKERNEWS') {
      matchesSource = l.tags.includes('HN_ALGOLIA_API') || l.sourceUrl.includes('ycombinator');
    }

    return matchesSearch && matchesNeed && matchesSource;
  });

  // Pagination calculations
  const totalItems = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  const handleRunLiveScrape = async () => {
    setIsScrapingLive(true);
    setScrapeSuccessMsg(null);
    try {
      let newDiscovered: Lead[] = [];
      if (sourceFilter === 'HACKERNEWS') {
        newDiscovered = await liveScraperService.scrapeLiveRedditLeads();
      } else if (sourceFilter === 'ALL') {
        const jobs = await liveScraperService.scrapeLiveJobFeedLeads('ALL');
        const hn = await liveScraperService.scrapeLiveRedditLeads();
        newDiscovered = [...jobs, ...hn];
      } else {
        newDiscovered = await liveScraperService.scrapeLiveJobFeedLeads(sourceFilter as any);
      }
      onAddDiscoveredLeads(newDiscovered);
      setScrapeSuccessMsg(`✅ Successfully fetched ${newDiscovered.length} fresh leads from ${sourceFilter === 'ALL' ? 'all remote sources' : sourceFilter}!`);
      setTimeout(() => setScrapeSuccessMsg(null), 5000);
    } catch (e) {
      console.error('Live Job Scrape Error:', e);
    } finally {
      setIsScrapingLive(false);
    }
  };

  const handleExportRemoteLeads = () => {
    leadService.exportLeadsToCSV(filteredLeads, 'REMOTE_JOBS');
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f4f4f5 100%)', borderLeft: '5px solid #0284c7' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-hot" style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd' }}>
                💼 Multi-Source Remote Developer Feed
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-Time Open APIs (Remotive, Arbeitnow, Jobicy, HackerNews)</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Remote Fullstack, Mobile & SaaS Project Finder
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Filter and scrape live hiring projects across specific free boards or aggregate them simultaneously.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary"
              style={{ padding: '10px 16px', fontSize: '0.825rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={handleExportRemoteLeads}
              disabled={filteredLeads.length === 0}
            >
              <Download size={15} /> Export {filteredLeads.length} Jobs (CSV)
            </button>

            <button 
              className="btn btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.875rem', fontWeight: '700' }}
              onClick={handleRunLiveScrape}
              disabled={isScrapingLive}
            >
              {isScrapingLive ? '⏳ Scraping Live Jobs...' : `🔄 Scrape Live Jobs (${sourceFilter === 'ALL' ? 'All Sources' : sourceFilter})`}
            </button>
          </div>
        </div>

        {scrapeSuccessMsg && (
          <div style={{ marginTop: '14px', padding: '10px 14px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#15803d', fontSize: '0.825rem', fontWeight: '600' }}>
            {scrapeSuccessMsg}
          </div>
        )}
      </div>

      {/* Filter Controls Panel */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Keyword Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '240px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text"
            className="input-field"
            placeholder="Search jobs by title, company, tech, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Source Filter Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building2 size={16} color="#4f46e5" />
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#3f3f46' }}>Source Board:</span>
          <select 
            className="input-field" 
            style={{ width: 'auto', fontSize: '0.8rem', padding: '6px 12px' }}
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value as JobFeedSource);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">🌐 All Remote Boards (Aggregated)</option>
            <option value="JOBICY">⚡ Jobicy (200+ Daily Remote Jobs)</option>
            <option value="REMOTIVE">💼 Remotive (US / Europe Tech)</option>
            <option value="ARBEITNOW">🇪🇺 Arbeitnow (EU Remote / Visa)</option>
            <option value="HACKERNEWS">🟧 HackerNews ("Who is Hiring?")</option>
          </select>
        </div>

        {/* Category Need Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Code2 size={16} color="#0284c7" />
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#3f3f46' }}>Category:</span>
          <select 
            className="input-field" 
            style={{ width: 'auto', fontSize: '0.8rem', padding: '6px 12px' }}
            value={needFilter}
            onChange={(e) => {
              setNeedFilter(e.target.value as any);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">🛠️ All Project Needs</option>
            <option value="EBOOK_CREATOR_NEED_APP">📚 E-Book Author / Course App</option>
            <option value="HAS_WEBSITE_NO_APP">🌐 Has Website, Missing Mobile App</option>
            <option value="MOBILE_APP">📱 Mobile App (iOS / Android)</option>
            <option value="WEB_REDESIGN">🎨 Web Redesign</option>
            <option value="SAAS_MVP">🚀 SaaS MVP Development</option>
            <option value="ECOMMERCE">🛍️ E-Commerce Store</option>
            <option value="SPEED_PERFORMANCE">⚡ Speed & Performance</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
          Showing <strong>{filteredLeads.length}</strong> matching jobs
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
          paginatedLeads.map(lead => {
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
                    {lead.company.location && (
                      <span style={{ fontSize: '0.725rem', color: '#6366f1', background: '#e0e7ff', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
                        📍 {lead.company.location}
                      </span>
                    )}
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

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '16px 20px', background: '#ffffff', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{startIndex + 1}</strong>–<strong>{endIndex}</strong> of <strong>{totalItems}</strong> jobs
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Per Page:</span>
            <select 
              className="input-field" 
              style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>

            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 10px' }} 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              title="First Page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 10px' }} 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            
            <span style={{ fontSize: '0.85rem', fontWeight: '700', padding: '0 8px', color: 'var(--text-main)' }}>
              {currentPage} / {totalPages}
            </span>

            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 10px' }} 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 10px' }} 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Last Page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
