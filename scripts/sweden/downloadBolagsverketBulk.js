#!/usr/bin/env node

/**
 * LeadPulse — Swedish Official HVD Downloader
 * Downloads the official Bolagsverket & SCB bulk datasets published under EU 2023/138.
 * Supports direct download from Hugging Face HVD archive mirror or official portal.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STAGING_DIR = path.resolve(__dirname, '../../data/sweden/raw');

// Latest weekly snapshots in the open HVD repository
const SOURCES = {
  bolagsverket: 'https://huggingface.co/datasets/krafs/bolagsverket-arkiv/resolve/main/ra/bolagsverket_bulkfil/2026-09-21/bolagsverket_bulkfil.zip',
  scb: 'https://huggingface.co/datasets/krafs/bolagsverket-arkiv/resolve/main/ra/scb_bulkfil/2026-09-21/scb_bulkfil.zip'
};

export async function downloadBulkFiles(options = {}) {
  if (!fs.existsSync(STAGING_DIR)) {
    fs.mkdirSync(STAGING_DIR, { recursive: true });
  }

  console.log(`\n🇸🇪 LeadPulse Official Swedish HVD Downloader`);
  console.log(`Target Directory: ${STAGING_DIR}\n`);

  for (const [key, url] of Object.entries(SOURCES)) {
    const destZip = path.join(STAGING_DIR, `${key}_bulkfil.zip`);
    if (fs.existsSync(destZip) && !options.force) {
      console.log(`✓ ${key} already downloaded at: ${destZip}`);
      continue;
    }

    console.log(`⏳ Downloading ${key} official bulk archive from HVD mirror...`);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download ${key}: ${response.status} ${response.statusText}`);
      }

      const fileStream = fs.createWriteStream(destZip);
      const reader = response.body.getReader();

      let downloadedBytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fileStream.write(Buffer.from(value));
        downloadedBytes += value.length;
        if (downloadedBytes % (5 * 1024 * 1024) === 0) {
          process.stdout.write(`Downloaded ${(downloadedBytes / (1024 * 1024)).toFixed(1)} MB...\r`);
        }
      }
      fileStream.end();
      console.log(`\n✅ Saved: ${destZip} (${(downloadedBytes / (1024 * 1024)).toFixed(1)} MB)`);
    } catch (err) {
      console.error(`❌ Error downloading ${key}:`, err.message);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  downloadBulkFiles();
}
