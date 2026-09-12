import { BaseAdapter } from './BaseAdapter';
import { Lead } from '../types';
import { liveScraperService } from '../services/liveScraperService';

export class RedditAdapter implements BaseAdapter {
  sourceName = 'Live Reddit & Community Hiring Scraper';
  sourceType: Lead['source'] = 'REDDIT';

  async fetchLeads(): Promise<Lead[]> {
    try {
      const liveScraped = await liveScraperService.scrapeLiveWebLeads();
      const redditOnly = liveScraped.filter(l => l.source === 'REDDIT');
      return redditOnly;
    } catch (err) {
      console.error('RedditAdapter live scraping error:', err);
      return [];
    }
  }
}

