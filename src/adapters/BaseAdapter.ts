import { Lead } from '../types';

export interface BaseAdapter {
  sourceName: string;
  sourceType: Lead['source'];
  fetchLeads(params?: { query?: string; category?: string }): Promise<Lead[]>;
}
