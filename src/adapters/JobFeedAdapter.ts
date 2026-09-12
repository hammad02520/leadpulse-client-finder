import { BaseAdapter } from './BaseAdapter';
import { Lead } from '../types';
import { liveScraperService } from '../services/liveScraperService';

export class JobFeedAdapter implements BaseAdapter {
  sourceName = 'Live Web Job Scraper Engine (Remotive, Arbeitnow, Jobicy)';
  sourceType: Lead['source'] = 'JOB_FEED';

  async fetchLeads(): Promise<Lead[]> {
    try {
      const liveScraped = await liveScraperService.scrapeLiveJobFeedLeads();
      return liveScraped;
    } catch (err) {
      console.error('JobFeedAdapter live scraping error:', err);
      return [];
    }
  }
}
