import { BaseAdapter } from './BaseAdapter';
import { Lead } from '../types';
import { liveScraperService } from '../services/liveScraperService';

export class RedditAdapter implements BaseAdapter {
  sourceName = 'Live Reddit & HackerNews Scraper Engine';
  sourceType: Lead['source'] = 'REDDIT';

  async fetchLeads(): Promise<Lead[]> {
    try {
      const liveScraped = await liveScraperService.scrapeLiveRedditLeads();
      return liveScraped;
    } catch (err) {
      console.error('RedditAdapter live scraping error:', err);
      return [];
    }
  }
}
