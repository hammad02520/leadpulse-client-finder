import { Lead, FreshnessTier, ProjectNeedType } from '../types';
import { runWebsiteAudit } from './websiteAuditor';
import { calculateLeadScore } from './scoringEngine';
import { overpassService } from './overpassService';

export class LiveScraperService {

  /**
   * Classify project need dynamically based on title, description, and tags
   */
  private classifyProjectNeed(title: string, description: string): ProjectNeedType {
    const text = (title + ' ' + description).toLowerCase();

    if (text.includes('ebook') || text.includes('e-book') || text.includes('course') || text.includes('creator') || text.includes('gumroad') || text.includes('author') || text.includes('podcast') || text.includes('book')) {
      return 'EBOOK_CREATOR_NEED_APP';
    }
    if ((text.includes('app') || text.includes('flutter') || text.includes('react native') || text.includes('ios') || text.includes('android')) && (text.includes('website') || text.includes('existing site') || text.includes('shopify') || text.includes('wordpress') || text.includes('store'))) {
      return 'HAS_WEBSITE_NO_APP';
    }
    if (text.includes('no website') || text.includes('new business') || text.includes('launching') || text.includes('start from scratch') || text.includes('first site') || text.includes('offline')) {
      return 'NO_WEBSITE_NO_APP';
    }
    if (text.includes('mobile') || text.includes('ios') || text.includes('android') || text.includes('flutter') || text.includes('react native')) {
      return 'MOBILE_APP';
    }
    if (text.includes('redesign') || text.includes('overhaul') || text.includes('ui/ux') || text.includes('frontend')) {
      return 'WEB_REDESIGN';
    }
    if (text.includes('mvp') || text.includes('saas') || text.includes('fullstack') || text.includes('startup')) {
      return 'SAAS_MVP';
    }
    if (text.includes('ecommerce') || text.includes('e-commerce') || text.includes('shop') || text.includes('store')) {
      return 'ECOMMERCE';
    }
    return 'SPEED_PERFORMANCE';
  }

  private extractDomainFromUrl(url: string, fallbackName: string): string {
    try {
      if (!url) return `${fallbackName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
      const parsed = new URL(url);
      let hostname = parsed.hostname.replace(/^www\./, '');
      if (hostname.includes('remotive') || hostname.includes('arbeitnow') || hostname.includes('jobicy') || hostname.includes('ycombinator') || hostname.includes('dev.to') || hostname.includes('github')) {
        const cleanName = fallbackName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanName.length > 2 ? `${cleanName}.com` : 'none';
      }
      return hostname;
    } catch {
      const cleanName = fallbackName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanName.length > 2 ? `${cleanName}.com` : 'none';
    }
  }

  /**
   * 1. Scrape Live Remote Job Feeds (Remotive, Arbeitnow, Jobicy)
   */
  public async scrapeLiveJobFeedLeads(selectedSource: 'ALL' | 'REMOTIVE' | 'ARBEITNOW' | 'JOBICY' = 'ALL'): Promise<Lead[]> {
    const leads: Lead[] = [];

    // Remotive API
    if (selectedSource === 'ALL' || selectedSource === 'REMOTIVE') {
      try {
        const res = await fetch('https://remotive.com/api/remote-jobs?limit=25');
        if (res.ok) {
          const data = await res.json();
          const jobs = data.jobs || [];
        jobs.slice(0, 10).forEach((job: any) => {
          const domain = this.extractDomainFromUrl(job.url, job.company_name);
          const projectNeed = this.classifyProjectNeed(job.title, job.description || '');
          const audit = runWebsiteAudit(domain);
          audit.hasMobileApp = false;

          const scoreBreakdown = calculateLeadScore({
            hasExplicitHiringSignal: true,
            hasBusinessQuality: true,
            websiteAudit: audit,
            hasEmail: domain !== 'none',
            hasWhatsapp: false,
            hasSocialPresence: true,
            freshnessTier: 'JUST_NOW',
            isExpired: false
          });

          leads.push({
            id: `live-remotive-${job.id}`,
            title: job.title,
            description: (job.description || '').replace(/<[^>]*>?/gm, '').slice(0, 300) + '...',
            company: {
              name: job.company_name,
              industry: job.category || 'Software & Services',
              location: job.candidate_required_location || 'Remote',
              websiteUrl: domain !== 'none' ? `https://${domain}` : undefined,
              socialPresence: true
            },
            contact: {
              personName: 'Hiring Lead',
              role: 'Product / Tech Owner',
              email: domain !== 'none' ? `careers@${domain}` : undefined,
              hasWhatsapp: false
            },
            source: 'JOB_FEED',
            sourceUrl: job.url,
            projectNeed,
            budgetSignal: job.salary || '$3,000 - $7,000',
            scoreBreakdown,
            websiteAudit: audit,
            status: 'NEW',
            tags: ['LIVE_SCRAPED', 'REMOTIVE_API', projectNeed],
            notes: [`Live Scraped from Remotive API: ${job.url}`],
            discoveredAt: new Date().toISOString(),
            postedAt: job.publication_date || new Date().toISOString(),
            freshnessTier: 'JUST_NOW',
            isExpired: false,
            lastVerifiedAt: new Date().toISOString(),
            outreachHistory: []
          });
        });
      }
    } catch (e) {
      console.warn('Remotive live scrape failed:', e);
    }
  }

    // Arbeitnow API
    if (selectedSource === 'ALL' || selectedSource === 'ARBEITNOW') {
      try {
        const res = await fetch('https://www.arbeitnow.com/api/job-board-api');
        if (res.ok) {
          const data = await res.json();
          const jobs = data.data || [];
          jobs.slice(0, 15).forEach((job: any) => {
            const domain = this.extractDomainFromUrl(job.url, job.company_name);
            const projectNeed = this.classifyProjectNeed(job.title, job.description || '');
            const audit = runWebsiteAudit(domain);
            audit.hasMobileApp = false;

            const scoreBreakdown = calculateLeadScore({
              hasExplicitHiringSignal: true,
              hasBusinessQuality: true,
              websiteAudit: audit,
              hasEmail: domain !== 'none',
              hasWhatsapp: false,
              hasSocialPresence: true,
              freshnessTier: 'JUST_NOW',
              isExpired: false
            });

            leads.push({
              id: `live-arbeitnow-${job.slug}`,
              title: job.title,
              description: (job.description || '').replace(/<[^>]*>?/gm, '').slice(0, 300) + '...',
              company: {
                name: job.company_name,
                industry: 'Digital Company',
                location: job.location || 'Remote',
                websiteUrl: domain !== 'none' ? `https://${domain}` : undefined,
                socialPresence: true
              },
              contact: {
                personName: 'Hiring Manager',
                role: 'Founder / CTO',
                email: domain !== 'none' ? `jobs@${domain}` : undefined,
                hasWhatsapp: false
              },
              source: 'JOB_FEED',
              sourceUrl: job.url,
              projectNeed,
              budgetSignal: '$4,000 - $8,000',
              scoreBreakdown,
              websiteAudit: audit,
              status: 'NEW',
              tags: ['LIVE_SCRAPED', 'ARBEITNOW_API', projectNeed],
              notes: [`Live Scraped from Arbeitnow API: ${job.url}`],
              discoveredAt: new Date().toISOString(),
              postedAt: new Date().toISOString(),
              freshnessTier: 'JUST_NOW',
              isExpired: false,
              lastVerifiedAt: new Date().toISOString(),
              outreachHistory: []
            });
          });
        }
      } catch (e) {
        console.warn('Arbeitnow live scrape failed:', e);
      }
    }

    // Jobicy Live Remote Jobs API (100% Free Public API)
    if (selectedSource === 'ALL' || selectedSource === 'JOBICY') {
      try {
        const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=25');
        if (res.ok) {
          const data = await res.json();
          const jobs = data.jobs || [];
        jobs.slice(0, 15).forEach((job: any) => {
          const domain = this.extractDomainFromUrl(job.url, job.companyName);
          const projectNeed = this.classifyProjectNeed(job.jobTitle, job.jobDescription || job.jobExcerpt || '');
          const audit = runWebsiteAudit(domain);
          audit.hasMobileApp = false;

          const scoreBreakdown = calculateLeadScore({
            hasExplicitHiringSignal: true,
            hasBusinessQuality: true,
            websiteAudit: audit,
            hasEmail: domain !== 'none',
            hasWhatsapp: false,
            hasSocialPresence: true,
            freshnessTier: 'JUST_NOW',
            isExpired: false
          });

          // Calculate formatted budget if provided by Jobicy
          let budget = '$3,500 - $7,500';
          if (job.salaryMin && job.salaryMax) {
            const minFormatted = Math.round(job.salaryMin / 1000);
            const maxFormatted = Math.round(job.salaryMax / 1000);
            budget = `$${minFormatted}k - $${maxFormatted}k / yr (${job.salaryCurrency || 'USD'})`;
          }

          leads.push({
            id: `live-jobicy-${job.id}`,
            title: job.jobTitle,
            description: (job.jobExcerpt || job.jobDescription || '').replace(/<[^>]*>?/gm, '').slice(0, 300) + '...',
            company: {
              name: job.companyName,
              industry: Array.isArray(job.jobIndustry) ? job.jobIndustry.join(', ') : 'Tech & Software',
              location: job.jobGeo || 'Worldwide Remote',
              websiteUrl: domain !== 'none' ? `https://${domain}` : undefined,
              socialPresence: true
            },
            contact: {
              personName: 'Engineering Recruiter',
              role: 'Talent Acquisition',
              email: domain !== 'none' ? `talent@${domain}` : undefined,
              hasWhatsapp: false
            },
            source: 'JOB_FEED',
            sourceUrl: job.url,
            projectNeed,
            budgetSignal: budget,
            scoreBreakdown,
            websiteAudit: audit,
            status: 'NEW',
            tags: ['LIVE_SCRAPED', 'JOBICY_API', projectNeed],
            notes: [`Live Scraped from Jobicy API: ${job.url}`],
            discoveredAt: new Date().toISOString(),
            postedAt: job.pubDate || new Date().toISOString(),
            freshnessTier: 'JUST_NOW',
            isExpired: false,
            lastVerifiedAt: new Date().toISOString(),
            outreachHistory: []
          });
        });
      }
    } catch (e) {
      console.warn('Jobicy live scrape failed:', e);
    }
  }

    return leads;
  }

  /**
   * 2. Scrape Live Community & Reddit Hiring Calls (HackerNews Algolia)
   */
  public async scrapeLiveRedditLeads(): Promise<Lead[]> {
    const leads: Lead[] = [];

    // HackerNews Algolia Search API
    try {
      const res = await fetch('https://hn.algolia.com/api/v1/search_by_date?tags=story&query=hiring');
      if (res.ok) {
        const data = await res.json();
        const hits = data.hits || [];
        hits.slice(0, 10).forEach((hit: any) => {
          const companyName = hit.author || 'Tech Startup';
          const url = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
          const domain = this.extractDomainFromUrl(url, companyName);
          const projectNeed = this.classifyProjectNeed(hit.title, hit.story_text || '');
          const audit = runWebsiteAudit(domain);
          audit.hasMobileApp = false;

          const scoreBreakdown = calculateLeadScore({
            hasExplicitHiringSignal: true,
            hasBusinessQuality: true,
            websiteAudit: audit,
            hasEmail: domain !== 'none',
            hasWhatsapp: false,
            hasSocialPresence: true,
            freshnessTier: 'JUST_NOW',
            isExpired: false
          });

          leads.push({
            id: `live-hn-${hit.objectID}`,
            title: hit.title || 'HackerNews Hiring Opportunity',
            description: `Live hiring call posted by u/${hit.author} on HackerNews. Looking for web & mobile developers.`,
            company: {
              name: `${companyName} (HN Community)`,
              industry: 'Software / Startup',
              location: 'US / Remote',
              websiteUrl: domain !== 'none' ? `https://${domain}` : undefined,
              socialPresence: true
            },
            contact: {
              personName: hit.author,
              role: 'Hiring Founder',
              email: domain !== 'none' ? `team@${domain}` : undefined,
              hasWhatsapp: false
            },
            source: 'REDDIT',
            sourceUrl: url,
            projectNeed,
            budgetSignal: '$5,000 - $9,000',
            scoreBreakdown,
            websiteAudit: audit,
            status: 'NEW',
            tags: ['LIVE_SCRAPED', 'HN_ALGOLIA_API', projectNeed],
            notes: [`Live Scraped from HackerNews Algolia API: ${url}`],
            discoveredAt: new Date().toISOString(),
            postedAt: hit.created_at || new Date().toISOString(),
            freshnessTier: 'JUST_NOW',
            isExpired: false,
            lastVerifiedAt: new Date().toISOString(),
            outreachHistory: []
          });
        });
      }
    } catch (e) {
      console.warn('HackerNews live scrape failed:', e);
    }

    return leads;
  }

  /**
   * 3. Scrape Real OpenStreetMap Local Business Nodes Worldwide (Overpass API)
   */
  public async scrapeLiveLocalBizLeads(customParams?: Partial<import('../types').OsmSearchParams>): Promise<Lead[]> {
    try {
      const country = customParams?.country || 'United States';
      const city = customParams?.city || 'New York';
      const category = customParams?.category || 'all';
      const filterType = customParams?.filterType || 'ALL';
      const limit = customParams?.limit || 300;

      const osmResults = await overpassService.discoverOsmBusinesses({
        country,
        city,
        category,
        filterType,
        limit
      });
      return osmResults;
    } catch (e) {
      console.warn('OpenStreetMap Overpass live scrape failed:', e);
      return [];
    }
  }

}

export const liveScraperService = new LiveScraperService();
