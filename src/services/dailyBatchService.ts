import { CommonProspectRecord, DailyBatchSummary, SearchSpendingBudget } from '../types/prospect';

const STORAGE_KEYS = {
  RECORDS: 'leadpulse_prospect_records_v1',
  BATCHES: 'leadpulse_daily_batches_v1',
  BUDGET: 'leadpulse_search_budget_v1',
  CONFIG: 'leadpulse_prospect_config_v1'
};

export interface ProspectFinderConfig {
  dailyTarget: number;           // Target leads to deliver per day (e.g. 10 or 25)
  targetCountry: string;         // e.g. "UK"
  targetCity: string;            // e.g. "Manchester"
  targetCategory: string;        // e.g. "car_repair" or "all"
  braveApiKey?: string;
  spendingCapUsd: number;        // e.g. $10.00
  companiesHouseApiKey?: string;
}

export const defaultFinderConfig: ProspectFinderConfig = {
  dailyTarget: 10,
  targetCountry: 'UK',
  targetCity: 'Manchester',
  targetCategory: 'all',
  spendingCapUsd: 10.00
};

export const defaultSpendingBudget: SearchSpendingBudget = {
  monthly_credit_allowance: 5.00,
  cost_per_thousand: 5.00,
  total_searches_run: 0,
  estimated_cost_usd: 0.00,
  budget_cap_usd: 10.00,
  is_cap_reached: false
};

/**
 * 3-Pool Reserve & Transactional Daily Batch Engine
 * Manages Candidates -> Qualified Reserve -> Delivered
 */
export const dailyBatchService = {
  // Config
  getConfig(): ProspectFinderConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
      return data ? { ...defaultFinderConfig, ...JSON.parse(data) } : defaultFinderConfig;
    } catch {
      return defaultFinderConfig;
    }
  },

  saveConfig(config: ProspectFinderConfig): void {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  },

  // Search Budget
  getBudget(): SearchSpendingBudget {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUDGET);
      return data ? { ...defaultSpendingBudget, ...JSON.parse(data) } : defaultSpendingBudget;
    } catch {
      return defaultSpendingBudget;
    }
  },

  recordSearchSpend(searchesCount: number): SearchSpendingBudget {
    const budget = this.getBudget();
    budget.total_searches_run += searchesCount;
    budget.estimated_cost_usd = +(budget.total_searches_run * (budget.cost_per_thousand / 1000)).toFixed(2);
    budget.is_cap_reached = budget.estimated_cost_usd >= budget.budget_cap_usd;
    localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(budget));
    return budget;
  },

  // Records in all pools
  getAllRecords(): CommonProspectRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveRecords(records: CommonProspectRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  },

  // Save new candidate records (merges and preserves pools)
  upsertCandidates(newRecords: CommonProspectRecord[]): void {
    const existing = this.getAllRecords();
    const existingMap = new Map(existing.map(r => [r.id, r]));

    newRecords.forEach(rec => {
      if (!existingMap.has(rec.id)) {
        existingMap.set(rec.id, rec);
      }
    });

    this.saveRecords(Array.from(existingMap.values()));
  },

  // Pool accessors
  getCandidatesPool(): CommonProspectRecord[] {
    return this.getAllRecords().filter(r => r.pool === 'CANDIDATE');
  },

  getReservePool(): CommonProspectRecord[] {
    return this.getAllRecords()
      .filter(r => r.pool === 'RESERVE')
      .sort((a, b) => b.score.total_score - a.score.total_score);
  },

  getDeliveredPool(): CommonProspectRecord[] {
    return this.getAllRecords().filter(r => r.pool === 'DELIVERED');
  },

  // Transactional Daily Batch Delivery
  deliverDailyBatch(targetCount?: number): DailyBatchSummary | null {
    const config = this.getConfig();
    const count = targetCount || config.dailyTarget || 10;
    const allRecords = this.getAllRecords();

    // Pull highest ranking prospects from the Qualified Reserve Pool
    const reserve = allRecords
      .filter(r => r.pool === 'RESERVE')
      .sort((a, b) => b.score.total_score - a.score.total_score);

    if (reserve.length === 0) {
      return null;
    }

    const batchToDeliver = reserve.slice(0, count);
    const batchId = `batch-${new Date().toISOString().split('T')[0]}-${Date.now()}`;
    const now = new Date().toISOString();

    // Move from RESERVE -> DELIVERED atomically
    const deliveredIds = new Set(batchToDeliver.map(r => r.id));
    const updatedAll = allRecords.map(r => {
      if (deliveredIds.has(r.id)) {
        return {
          ...r,
          pool: 'DELIVERED' as const,
          batch_id: batchId,
          delivered_at: now
        };
      }
      return r;
    });

    this.saveRecords(updatedAll);

    // Save Batch Summary
    const deliveredRecords = updatedAll.filter(r => r.batch_id === batchId);
    const summary: DailyBatchSummary = {
      batch_id: batchId,
      date_string: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      delivered_count: deliveredRecords.length,
      email_ready_count: deliveredRecords.filter(r => Boolean(r.published_email)).length,
      call_ready_count: deliveredRecords.filter(r => Boolean(r.published_phone)).length,
      social_only_count: deliveredRecords.filter(r => r.prospect_category === 'SOCIAL_ONLY_BUSINESS').length,
      no_presence_count: deliveredRecords.filter(r => r.prospect_category === 'EXISTING_BUSINESS_NO_WEBSITE' || r.prospect_category === 'NEW_BUSINESS_NO_WEBSITE').length,
      average_score: Math.round(deliveredRecords.reduce((acc, r) => acc + r.score.total_score, 0) / (deliveredRecords.length || 1)),
      records: deliveredRecords
    };

    const batches = this.getBatches();
    batches.unshift(summary);
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));

    return summary;
  },

  getBatches(): DailyBatchSummary[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BATCHES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  getLatestBatch(): DailyBatchSummary | null {
    const batches = this.getBatches();
    return batches.length > 0 ? batches[0] : null;
  }
};
