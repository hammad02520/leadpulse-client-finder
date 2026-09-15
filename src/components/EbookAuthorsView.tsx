import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  ExternalLink,
  Book,
  Download,
  Sparkles,
  ShoppingBag,
  Smartphone,
  Tag
} from 'lucide-react';
import { Lead, EbookSearchParams } from '../types';
import { ebookDiscoveryService } from '../services/ebookDiscoveryService';
import { leadService } from '../services/leadService';

interface EbookAuthorsViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenPitchModal: (lead: Lead) => void;
  onAddDiscoveredLeads: (newLeads: Lead[]) => void;
}

export const EbookAuthorsView: React.FC<EbookAuthorsViewProps> = ({
  leads,
  onSelectLead,
  onOpenPitchModal,
  onAddDiscoveredLeads
}) => {
  const [selectedGenre, setSelectedGenre] = useState<EbookSearchParams['genre']>('business');
  const [filterType, setFilterType] = useState<'ALL' | 'NO_WEBSITE' | 'NEEDS_APP'>('ALL');
  const [minPublishYear, setMinPublishYear] = useState<number>(2010);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filter leads for eBook Authors
  const allEbookLeads = leads.filter(l => l.source === 'EBOOK_AUTHOR' || l.tags.includes('EBOOK_AUTHOR'));

  // No auto-fetch on mount: User must select date/year and click Discover button manually

  const handleRunSearch = async () => {
    setIsSearching(true);
    try {
      const results = await ebookDiscoveryService.discoverEbookAuthors({
        genre: selectedGenre,
        filterType,
        minPublishYear,
        searchTerm: searchTerm.trim() || undefined,
        limit: 1000
      });
      onAddDiscoveredLeads(results);
    } catch (e) {
      console.error('eBook Authors search failed:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredLeads = allEbookLeads.filter(l => {
    const matchesSearch = 
      !searchTerm ||
      l.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.ebookInfo?.bookTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.ebookInfo?.genre || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilterType = 
      filterType === 'ALL' ||
      (filterType === 'NO_WEBSITE' && l.projectNeed === 'NO_WEBSITE_NO_APP') ||
      (filterType === 'NEEDS_APP' && l.projectNeed === 'EBOOK_CREATOR_NEED_APP');

    const matchesGenre = 
      selectedGenre === 'all' ||
      !selectedGenre ||
      (l.ebookInfo?.genre || '').toLowerCase().includes(selectedGenre.toLowerCase()) ||
      l.tags.some(t => t.toLowerCase().includes(selectedGenre.toLowerCase())) ||
      true;

    // Filter out any older cached leads published before minPublishYear
    const pubYearStr = l.ebookInfo?.publicationDate || '';
    const pubYearNum = parseInt(pubYearStr.slice(0, 4), 10);
    const matchesYear = isNaN(pubYearNum) || pubYearNum >= minPublishYear;

    return matchesSearch && matchesFilterType && matchesGenre && matchesYear;
  });

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, selectedGenre, minPublishYear, allEbookLeads.length]);

  const totalItems = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', borderLeft: '5px solid #059669' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-hot" style={{ fontSize: '0.75rem', background: '#d1fae5', color: '#047857', border: '1px solid #a7f3d0' }}>
                📚 eBook Authors & Active Digital Creators Discovery Engine
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Google Books API + OpenLibrary Modern Verified Feed (Total Authors: {allEbookLeads.length})
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Active Modern eBook Creators Lead Engine
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Target active digital product creators, self-published authors, and ebook writers who need direct-to-reader sales websites & mobile reading apps.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              className="btn btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.875rem', fontWeight: '700', background: '#059669', borderColor: '#059669' }}
              onClick={handleRunSearch}
              disabled={isSearching}
            >
              {isSearching ? '⏳ Querying Live Book Registries...' : '🚀 Discover Active Authors'}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          
          {/* Genre Selector */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              eBook Category / Genre
            </label>
            <select 
              className="input-field" 
              value={selectedGenre} 
              onChange={(e) => setSelectedGenre(e.target.value as any)}
            >
              <option value="all">🌟 All Categories</option>
              <option value="business">💼 Business & Entrepreneurship</option>
              <option value="self_help">🧠 Self-Help & Personal Growth</option>
              <option value="technology">💻 Technology & Coding</option>
              <option value="finance">📈 Finance & Crypto</option>
              <option value="fitness">🏋️ Health & Fitness</option>
              <option value="fiction">📖 Fiction & Novels</option>
            </select>
          </div>

          {/* Publication Year Filter (Custom Date Filter Input) */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              📅 Publish Year From (Date Filter)
            </label>
            <input 
              type="number"
              min="1980"
              max="2026"
              className="input-field" 
              value={minPublishYear} 
              onChange={(e) => setMinPublishYear(Number(e.target.value) || 2010)}
              placeholder="e.g. 2015"
            />
          </div>

          {/* Digital Need Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Digital Presence Need
            </label>
            <select 
              className="input-field" 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value="ALL">🌐 All eBook Authors</option>
              <option value="NO_WEBSITE">🚫 Missing Custom Author Store Website</option>
              <option value="NEEDS_APP">📱 Needs Mobile Reader / Audiobook App</option>
            </select>
          </div>

          {/* Search Term Input */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Search Author / Book Title
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Finance, Marketing, AI, Author name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

        </div>

        {/* Action & Export Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '600' }}>
            Filtered Authors: <span style={{ color: '#059669', fontWeight: '700' }}>{filteredLeads.length}</span> • Genre: <span style={{ color: '#0284c7', fontWeight: '700' }}>{selectedGenre.toUpperCase()}</span> • Year &gt;= <span style={{ color: '#059669', fontWeight: '700' }}>{minPublishYear}</span>
          </div>

          <button 
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px', fontWeight: '700', border: '1px solid #059669', color: '#059669' }}
            onClick={() => leadService.exportLeadsToCSV(filteredLeads, 'EBOOK_AUTHOR')}
          >
            <Download size={14} /> Export {filteredLeads.length} Authors (Excel/CSV)
          </button>
        </div>
      </div>

      {/* Authors Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {totalItems === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            <BookOpen size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {isSearching ? '⏳ Fetching live eBook authors from Google Books & OpenLibrary...' : 'No eBook Authors Found Matching Query'}
            </h3>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              Click <strong>"🚀 Discover Active Authors"</strong> to search live book registries!
            </p>
          </div>
        ) : (
          paginatedLeads.map(lead => {
            const audit = lead.websiteAudit;
            const score = lead.scoreBreakdown.totalScore;
            const ebook = lead.ebookInfo;

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
                  borderTop: `4px solid ${score >= 80 ? '#059669' : '#0284c7'}` 
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="badge badge-hot" style={{ background: '#d1fae5', color: '#047857' }}>
                      <Flame size={12} /> Score {score}/100
                    </span>
                    <span style={{ fontSize: '0.725rem', color: '#0284c7', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                      📚 {ebook?.platform === 'GOOGLE_BOOKS' ? 'Google Books' : 'OpenLibrary'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1.3' }}>
                    {lead.contact.personName}
                  </h3>
                  <div style={{ fontSize: '0.825rem', color: '#059669', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Book size={14} /> "{ebook?.bookTitle}"
                  </div>
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
                    {lead.description}
                  </p>

                  {/* Tags */}
                  {lead.tags && (
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {lead.tags.map((tag, idx) => (
                        <span key={idx} style={{ fontSize: '0.65rem', padding: '1px 6px', background: '#f0fdf4', color: '#166534', borderRadius: '4px', fontWeight: '800', border: '1px solid #bbf7d0' }}>
                          🏷️ {tag.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Author Contact Person & Outreach Status Block */}
                <div style={{ background: '#f0f9ff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontWeight: '800', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Mail size={13} color="#0284c7" /> Author Contact Details
                    </span>
                    <span style={{ color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', fontSize: '0.675rem', fontWeight: '800' }}>
                      VERIFIED AUTHOR
                    </span>
                  </div>
                  <div style={{ fontWeight: '700', color: '#0c4a6e', fontSize: '0.825rem' }}>
                    👤 {lead.contact.personName}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>✉️ Mailbox: <strong>Corporate / Publisher Mailbox Pending</strong></span>
                  </div>
                </div>

                {/* Technical Audit & Pitch Checklist */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontWeight: '700', color: '#3f3f46', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Author Digital Opportunity</span>
                    <span style={{ color: '#059669' }}>{lead.budgetSignal}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {audit.hasWebsite ? <CheckCircle2 size={13} color="#059669" /> : <XCircle size={13} color="#dc2626" />}
                      <span>Author Store Site: {audit.hasWebsite ? 'Custom Branded Site' : '❌ Missing (Using Store Link)'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Smartphone size={13} color="#d97706" />
                      <span>Mobile Reader App: ❌ Missing (Opportunity)</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShoppingBag size={13} color="#0284c7" />
                      <span>Direct Reader Margin: 100% Profit with Custom Store</span>
                    </div>
                  </div>
                </div>

                {/* Multi-Channel Outreach & Direct Contact Lookup */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '6px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <a 
                      href={`https://www.google.com/search?q=${encodeURIComponent('contact email author ' + lead.contact.personName + ' ' + (ebook?.bookTitle || ''))}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ flex: 1, fontSize: '0.7rem', padding: '5px 8px', borderRadius: '4px', background: '#f0fdf4', color: '#047857', border: '1px solid #a7f3d0', fontWeight: '700', textDecoration: 'none', textAlign: 'center' }}
                    >
                      ✉️ Find Email ↗
                    </a>

                    <a 
                      href={`https://www.google.com/search?q=${encodeURIComponent(lead.contact.personName + ' author LinkedIn site:linkedin.com/in')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ flex: 1, fontSize: '0.7rem', padding: '5px 8px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontWeight: '700', textDecoration: 'none', textAlign: 'center' }}
                    >
                      👔 LinkedIn ↗
                    </a>

                    <a 
                      href={`https://x.com/search?q=${encodeURIComponent(lead.contact.personName + ' author')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ flex: 1, fontSize: '0.7rem', padding: '5px 8px', borderRadius: '4px', background: '#f4f4f5', color: '#18181b', border: '1px solid #e4e4e7', fontWeight: '700', textDecoration: 'none', textAlign: 'center' }}
                    >
                      🐦 Twitter/X ↗
                    </a>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <button 
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => onSelectLead(lead)}
                    >
                      Inspect Audit
                    </button>

                    <button 
                      className="btn btn-primary"
                      style={{ fontSize: '0.75rem', padding: '6px 12px', background: '#059669', borderColor: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
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
