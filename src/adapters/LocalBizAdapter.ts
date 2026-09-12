import { BaseAdapter } from './BaseAdapter';
import { Lead } from '../types';
import { liveScraperService } from '../services/liveScraperService';

export class LocalBizAdapter implements BaseAdapter {
  sourceName = 'Live Small Business & Creator Scraper';
  sourceType: Lead['source'] = 'LOCAL_BIZ';

  async fetchLeads(): Promise<Lead[]> {
    try {
      const liveScraped = await liveScraperService.scrapeLiveLocalBizLeads();
      return liveScraped;
    } catch (err) {
      console.error('LocalBizAdapter live scraping error:', err);
      return [];
    }
  }
}
