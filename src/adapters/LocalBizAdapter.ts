import { BaseAdapter } from './BaseAdapter';
import { Lead } from '../types';
import { overpassService } from '../services/overpassService';

export class LocalBizAdapter implements BaseAdapter {
  sourceName = 'OpenStreetMap Worldwide SMB Engine';
  sourceType: Lead['source'] = 'LOCAL_BIZ';

  async fetchLeads(): Promise<Lead[]> {
    try {
      // Read saved location preference or use default global location
      let savedCountry = 'United States';
      let savedCity = 'New York';

      try {
        const storedPref = localStorage.getItem('leadpulse_osm_pref');
        if (storedPref) {
          const parsed = JSON.parse(storedPref);
          if (parsed.country && parsed.city) {
            savedCountry = parsed.country;
            savedCity = parsed.city;
          }
        }
      } catch {
        // use defaults
      }

      const osmLeads = await overpassService.discoverOsmBusinesses({
        country: savedCountry,
        city: savedCity,
        category: 'all',
        filterType: 'ALL',
        limit: 150
      });
      return osmLeads;
    } catch (err) {
      console.error('LocalBizAdapter OpenStreetMap search error:', err);
      return [];
    }
  }
}
