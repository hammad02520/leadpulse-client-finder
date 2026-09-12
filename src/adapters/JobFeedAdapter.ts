import { BaseAdapter } from './BaseAdapter';
import { Lead } from '../types';
import { liveScraperService } from '../services/liveScraperService';

export class JobFeedAdapter implements BaseAdapter {
  sourceName = 'Live Web Job Scraper Engine (Remotive, Arbeitnow, Jobicy)';
  sourceType: Lead['source'] = 'JOB_FEED';

  async fetchLeads(): Promise<Lead[]> {
    try {
      const liveScraped = await liveScraperService.scrapeLiveWebLeads();
      const jobFeedOnly = liveScraped.filter(l => l.source === 'JOB_FEED');
      return jobFeedOnly;
    } catch (err) {
      console.error('JobFeedAdapter live scraping error:', err);
      return [];
    }
  }
}

