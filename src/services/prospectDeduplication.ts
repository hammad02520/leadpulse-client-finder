import { CommonProspectRecord } from '../types/prospect';

export interface DeduplicationReport {
  deduplicatedRecords: CommonProspectRecord[];
  duplicatesRemoved: number;
  duplicateLog: Array<{
    retainedId: string;
    removedId: string;
    matchSignal: string;
  }>;
}

/**
 * Multi-Signal Deduplication Engine
 * Strictly enforces rules from Section 7 of the blueprint:
 * - Signal 1: Official Registration ID
 * - Signal 2: Same Source Record ID
 * - Signal 3: Same E.164 phone + similar trading name/city
 * - Signal 4: Same normalized name + full address
 */
export function deduplicateProspects(records: CommonProspectRecord[]): DeduplicationReport {
  const seenRegIds = new Map<string, string>(); // regId -> recordId
  const seenSourceIds = new Map<string, string>(); // sourceId -> recordId
  const seenPhones = new Map<string, { id: string; name: string; city: string }>(); // phone -> metadata
  const seenNameAddresses = new Set<string>();

  const deduplicatedRecords: CommonProspectRecord[] = [];
  const duplicateLog: Array<{ retainedId: string; removedId: string; matchSignal: string }> = [];

  for (const record of records) {
    let isDuplicate = false;
    let matchSignal = '';
    let retainedId = '';

    // Signal 1: Official Registration ID
    if (record.source_name === 'COMPANIES_HOUSE' && record.source_record_id) {
      if (seenRegIds.has(record.source_record_id)) {
        isDuplicate = true;
        retainedId = seenRegIds.get(record.source_record_id)!;
        matchSignal = `Same Official Registration ID (${record.source_record_id})`;
      } else {
        seenRegIds.set(record.source_record_id, record.id);
      }
    }

    // Signal 2: Same Source ID (e.g. OSM Node ID)
    if (!isDuplicate && record.source_record_id) {
      const sourceKey = `${record.source_name}:${record.source_record_id}`;
      if (seenSourceIds.has(sourceKey)) {
        isDuplicate = true;
        retainedId = seenSourceIds.get(sourceKey)!;
        matchSignal = `Same Source Record ID (${sourceKey})`;
      } else {
        seenSourceIds.set(sourceKey, record.id);
      }
    }

    // Signal 3: Same Published Phone + Similar Name/City
    if (!isDuplicate && record.published_phone) {
      const cleanPhone = record.published_phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 8) {
        if (seenPhones.has(cleanPhone)) {
          const prev = seenPhones.get(cleanPhone)!;
          const nameSimilarity = calculateJaccardSimilarity(record.trading_name, prev.name);
          const cityMatches = record.city.toLowerCase() === prev.city.toLowerCase();

          if (nameSimilarity > 0.4 || cityMatches) {
            isDuplicate = true;
            retainedId = prev.id;
            matchSignal = `Same Phone (${record.published_phone}) + matching city/name`;
          }
        } else {
          seenPhones.set(cleanPhone, {
            id: record.id,
            name: record.trading_name,
            city: record.city
          });
        }
      }
    }

    // Signal 4: Same Name + Full Address
    if (!isDuplicate && record.address) {
      const nameAddressKey = `${normalizeString(record.trading_name)}||${normalizeString(record.address)}`;
      if (seenNameAddresses.has(nameAddressKey)) {
        isDuplicate = true;
        retainedId = 'previously-seen-address';
        matchSignal = 'Same Business Name + Full Address match';
      } else {
        seenNameAddresses.add(nameAddressKey);
      }
    }

    if (isDuplicate) {
      duplicateLog.push({
        retainedId,
        removedId: record.id,
        matchSignal
      });
    } else {
      deduplicatedRecords.push(record);
    }
  }

  return {
    deduplicatedRecords,
    duplicatesRemoved: duplicateLog.length,
    duplicateLog
  };
}

function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function calculateJaccardSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.toLowerCase().split(/\s+/));
  const set2 = new Set(str2.toLowerCase().split(/\s+/));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}
