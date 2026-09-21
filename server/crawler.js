import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 4001;

app.use(cors());
app.use(express.json());

// Crawler State
let status = {
  isRunning: false,
  totalScraped: 0,
  currentQuery: '',
  logs: [],
  shouldStop: false,
  niche: '',
  location: '',
  totalLeads: 0
};

const CSV_FILE = path.resolve('server/scraped_leads.csv');

const addLog = (msg) => {
  const timestamp = new Date().toLocaleTimeString();
  status.logs.unshift(`[${timestamp}] ${msg}`);
  if (status.logs.length > 50) status.logs.pop();
  console.log(msg);
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

if (!fs.existsSync(CSV_FILE)) {
  fs.writeFileSync(CSV_FILE, 'Name,Phone,Email,Category,Rating,Reviews,Website,Address\n', 'utf-8');
}

async function startCrawling({ niche, location, totalLeads }) {
  status.isRunning = true;
  status.shouldStop = false;
  status.totalScraped = 0;
  status.logs = [];
  status.niche = niche;
  status.location = location;
  status.totalLeads = Number(totalLeads) || 0;

  const query = `${niche} in ${location}`;
  status.currentQuery = query;
  addLog(`Initializing targeted crawler for: "${query}"`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const listPage = await browser.newPage();
    const detailPage = await browser.newPage();
    await listPage.setViewport({ width: 1280, height: 800 });
    await detailPage.setViewport({ width: 1280, height: 800 });

    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    await listPage.setUserAgent(ua);
    await detailPage.setUserAgent(ua);

    addLog(`Starting query: "${query}"`);
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await listPage.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    addLog('Waiting for Google Maps results feed...');
    await listPage.waitForSelector('[role="feed"]', { timeout: 15000 }).catch(() => addLog('Feed selector timeout, attempting to continue...'));

    let noNewItemsCount = 0;
    const seenUrls = new Set();

    while (!status.shouldStop && status.totalScraped < status.totalLeads) {
      const newUrls = await listPage.evaluate(() => {
        const items = Array.from(document.querySelectorAll('a[href^="https://www.google.com/maps/place"]'));
        return items.map(i => i.href);
      });

      const urlsToVisit = [];
      for (const url of newUrls) {
        const cleanUrl = url.split('?')[0];
        if (!seenUrls.has(cleanUrl)) {
          seenUrls.add(cleanUrl);
          urlsToVisit.push(url);
        }
      }

      if (urlsToVisit.length > 0) {
        addLog(`Found ${urlsToVisit.length} new profiles. Collecting details...`);
        noNewItemsCount = 0;

        await detailPage.bringToFront();

        for (const profileUrl of urlsToVisit) {
          if (status.shouldStop || status.totalScraped >= status.totalLeads) break;

          try {
            await detailPage.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await delay(2000);

            const profileData = await detailPage.evaluate(() => {
              let name = '';
              let rating = '';
              let reviews = '';
              let category = '';
              let phone = '';
              let website = '';
              let address = '';

              const h1 = document.querySelector('h1');
              if (h1) name = h1.textContent.trim();

              const ratingBtn = document.querySelector('div[aria-label*="stars"], span[aria-label*="stars"]');
              if (ratingBtn) {
                const aria = ratingBtn.getAttribute('aria-label');
                const rMatch = aria && aria.match(/([0-9]\.[0-9])/);
                if (rMatch) rating = rMatch[1];
                const revMatch = aria && aria.match(/([0-9,]+)\s+reviews/i);
                if (revMatch) reviews = revMatch[1].replace(/,/g, '');
              }

              const catBtn = document.querySelector('button[jsaction="pane.rating.category"]');
              if (catBtn) category = catBtn.textContent.trim();

              const phoneBtn = document.querySelector('button[data-item-id^="phone:tel:"]');
              if (phoneBtn) {
                const aria = phoneBtn.getAttribute('aria-label') || '';
                phone = aria.replace('Phone number:', '').replace('Phone:', '').trim();
                if (!phone) phone = phoneBtn.textContent.trim();
              }

              const websiteBtn = document.querySelector('a[data-item-id="authority"]');
              if (websiteBtn) website = websiteBtn.href;

              const addressBtn = document.querySelector('button[data-item-id="address"]');
              if (addressBtn) {
                const aria = addressBtn.getAttribute('aria-label') || '';
                address = aria.replace('Address:', '').trim();
                if (!address) address = addressBtn.textContent.trim();
              }

              return {
                name: name.replace(/,/g, ''),
                rating,
                reviews,
                category: category.replace(/,/g, ''),
                phone,
                website: website || '',
                address: address.replace(/,/g, ' ')
              };
            });

            if (profileData.name) {
              const csvLine = `${profileData.name},${profileData.phone},,${profileData.category},${profileData.rating},${profileData.reviews},${profileData.website},${profileData.address}\n`;
              fs.appendFileSync(CSV_FILE, csvLine, 'utf-8');
              status.totalScraped += 1;
              addLog(`Lead ${status.totalScraped}/${status.totalLeads} captured`);

              if (status.totalScraped >= status.totalLeads) {
                addLog(`Target reached: ${status.totalLeads} leads collected. Stopping crawler.`);
                break;
              }
            }
          } catch (err) {
            // ignore per-page error
          }
        }

        if (status.totalScraped >= status.totalLeads) break;
      } else {
        noNewItemsCount += 1;
      }

      if (noNewItemsCount >= 5) {
        addLog(`Reached end of results for "${query}".`);
        break;
      }

      await listPage.bringToFront();
      await listPage.evaluate(() => {
        const feed = document.querySelector('[role="feed"]');
        if (feed) feed.scrollBy(0, 5000);
      });

      addLog('Scrolling and collecting more results...');
      await delay(3000);
    }

    addLog('Crawler session complete.');
  } catch (error) {
    addLog(`Error: ${error.message}`);
  } finally {
    if (browser) await browser.close();
    status.isRunning = false;
  }
}

app.post('/api/crawler/start', (req, res) => {
  const { niche, location, totalLeads, queries } = req.body || {};

  if (Array.isArray(queries) && queries.length > 0) {
    const firstQuery = queries[0];
    const fallbackNiche = typeof firstQuery === 'string' ? firstQuery.split(/\s+in\s+/i)[0] || '' : '';
    const fallbackLocation = typeof firstQuery === 'string'
      ? firstQuery.split(/\s+in\s+/i).slice(1).join(' in ') || ''
      : '';

    if (!fallbackNiche || !fallbackLocation) {
      return res.status(400).json({ error: 'Valid queries array is required' });
    }

    if (status.isRunning) {
      return res.status(400).json({ error: 'Crawler is already running' });
    }

    startCrawling({ niche: fallbackNiche, location: fallbackLocation, totalLeads: queries.length || 10 });
    return res.json({ message: 'Crawler started in background', niche: fallbackNiche, location: fallbackLocation, totalLeads: queries.length || 10 });
  }

  const cleanedNiche = typeof niche === 'string' ? niche.trim() : '';
  const cleanedLocation = typeof location === 'string' ? location.trim() : '';
  const safeTotal = Number(totalLeads) || 0;

  if (!cleanedNiche || !cleanedLocation || safeTotal <= 0) {
    return res.status(400).json({ error: 'Please provide niche, location, and totalLeads.' });
  }

  if (status.isRunning) {
    return res.status(400).json({ error: 'Crawler is already running' });
  }

  startCrawling({ niche: cleanedNiche, location: cleanedLocation, totalLeads: safeTotal });
  res.json({ message: 'Crawler started in background', niche: cleanedNiche, location: cleanedLocation, totalLeads: safeTotal });
});

app.post('/api/crawler/stop', (req, res) => {
  status.shouldStop = true;
  addLog('Stop signal received. Halting after current cycle...');
  res.json({ message: 'Stopping crawler...' });
});

app.get('/api/crawler/status', (req, res) => {
  res.json(status);
});

app.get('/api/crawler/download', (req, res) => {
  if (fs.existsSync(CSV_FILE)) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leadpulse_google_maps_leads.csv"');
    const stream = fs.createReadStream(CSV_FILE);
    stream.pipe(res);
  } else {
    res.status(404).json({ error: 'No data file found yet' });
  }
});

app.listen(PORT, () => {
  console.log(`[Crawler Engine] Background Server running on http://localhost:${PORT}`);
});
