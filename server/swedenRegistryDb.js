import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '../data/sweden/sweden_registry.db');

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    if (!fs.existsSync(DB_PATH)) {
      return null;
    }
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA synchronous = NORMAL;');
    dbInstance.exec('PRAGMA cache_size = -32000;');
  }
  return dbInstance;
}

export function isDbReady() {
  if (!fs.existsSync(DB_PATH)) return false;
  try {
    const db = getDb();
    if (!db) return false;
    const res = db.prepare("SELECT count(*) as count FROM sweden_companies").get();
    return Boolean(res && res.count > 0);
  } catch {
    return false;
  }
}

export function getSwedenRegistryStats() {
  const db = getDb();
  if (!db) {
    return { isReady: false, count: 0 };
  }

  try {
    const totalRow = db.prepare("SELECT count(*) as total FROM sweden_companies").get();
    const abRow = db.prepare("SELECT count(*) as abCount FROM sweden_companies WHERE legal_form = 'AB'").get();
    const hbRow = db.prepare("SELECT count(*) as hbCount FROM sweden_companies WHERE legal_form = 'HB'").get();
    const safeRow = db.prepare("SELECT count(*) as safeCount FROM sweden_companies WHERE marketing_blocked = 0").get();

    const fileSizeMb = (fs.statSync(DB_PATH).size / (1024 * 1024)).toFixed(1);

    return {
      isReady: true,
      totalCount: totalRow.total,
      abCount: abRow.abCount,
      hbCount: hbRow.hbCount,
      safeOutreachCount: safeRow.safeCount,
      fileSizeMb,
      dbPath: DB_PATH
    };
  } catch (err) {
    return { isReady: false, error: err.message };
  }
}

export function querySwedenCompanies(params = {}) {
  const db = getDb();
  if (!db) {
    throw new Error('Sweden Registry SQLite database is not ready or currently building.');
  }

  const {
    city = 'ALL',
    industry = 'ALL',
    legalForm = 'ALL',
    excludeReklamsparr = true,
    revenueTier = 'ALL',
    search = '',
    limit = 50,
    offset = 0
  } = params;

  const conditions = [];
  const queryParams = [];

  // Active check
  conditions.push('c.is_active = 1');

  // Reklamspärr
  if (String(excludeReklamsparr) === 'true' || excludeReklamsparr === true) {
    conditions.push('c.marketing_blocked = 0');
  }

  // City filter
  if (city && city !== 'ALL') {
    conditions.push('c.city = ? COLLATE NOCASE');
    queryParams.push(city);
  }

  // Legal form
  if (legalForm && legalForm !== 'ALL') {
    conditions.push('c.legal_form = ?');
    queryParams.push(legalForm);
  }

  // Revenue tier
  if (revenueTier && revenueTier !== 'ALL') {
    conditions.push('c.revenue_tier = ?');
    queryParams.push(revenueTier);
  }

  // Industry / SNI
  if (industry && industry !== 'ALL') {
    conditions.push('(c.primary_sni LIKE ? OR c.category_en LIKE ?)');
    queryParams.push(`${industry}%`);
    queryParams.push(`%${industry}%`);
  }

  // Search term (FTS5 full text match with accent folding + prefix match)
  const trimmedSearch = (search || '').trim();
  if (trimmedSearch.length > 0) {
    // Clean query for FTS5 (escape quotes)
    const sanitized = trimmedSearch.replace(/["'*^$]/g, '').trim();
    const tokens = sanitized.split(/\s+/).filter(t => t.length > 0);

    if (tokens.length > 0) {
      // Build FTS5 match expression: e.g. "Volvo* AND Stockholm*"
      const ftsQuery = tokens.map(t => `${t}*`).join(' AND ');
      conditions.push(`c.rowid IN (SELECT rowid FROM sweden_companies_fts WHERE sweden_companies_fts MATCH ?)`);
      queryParams.push(ftsQuery);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 1. Total count for this query
  const countSql = `SELECT count(*) as total FROM sweden_companies c ${whereClause}`;
  const countRow = db.prepare(countSql).get(...queryParams);
  const totalCount = countRow ? countRow.total : 0;

  // 2. Paginated rows
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 500));
  const safeOffset = Math.max(0, Number(offset) || 0);

  const dataSql = `
    SELECT 
      c.org_number,
      c.org_number_formatted,
      c.legal_name,
      c.legal_form,
      c.primary_sni,
      c.category_en,
      c.description_sv,
      c.city,
      c.municipality,
      c.county,
      c.street_address,
      c.postal_code,
      c.marketing_blocked,
      c.vat_number,
      c.revenue_sek,
      c.revenue_tier,
      c.website_url,
      c.is_active
    FROM sweden_companies c
    ${whereClause}
    ORDER BY c.rowid ASC
    LIMIT ? OFFSET ?
  `;

  const rows = db.prepare(dataSql).all(...queryParams, safeLimit, safeOffset);

  return {
    totalCount,
    limit: safeLimit,
    offset: safeOffset,
    page: Math.floor(safeOffset / safeLimit) + 1,
    companies: rows
  };
}
