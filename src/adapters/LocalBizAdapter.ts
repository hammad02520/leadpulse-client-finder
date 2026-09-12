import { BaseAdapter } from './BaseAdapter';
import { Lead } from '../types';
import { overpassService } from '../services/overpassService';

export class LocalBizAdapter implements BaseAdapter {
  sourceName = 'OpenStreetMap Worldwide SMB Engine';
  sourceType: Lead['source'] = 'LOCAL_BIZ';

  async fetchLeads(): Promise<Lead[]> {
    try {
      // Automatically query real OpenStreetMap business nodes for default location
      const osmLeads = await overpassService.discoverOsmBusinesses({
        country: 'Sweden',
        city: 'Stockholm',
        category: 'restaurant',
        filterType: 'ALL'
      });
      return osmLeads;
    } catch (err) {
      console.error('LocalBizAdapter OpenStreetMap search error:', err);
      return [];
    }
  }
}
