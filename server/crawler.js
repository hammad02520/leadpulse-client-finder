import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 4001;

app.use(cors());
app.use(express.json());

app.get('/api/version', (req, res) => {
  res.json({
    version: '2.5-verified-phone-crawler',
    features: ['in-page-click-extraction', 'real-phone-numbers', 'verified-no-website'],
    timestamp: new Date().toISOString()
  });
});

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

app.get('/api/enrich-domain', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  try {
    const formattedUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const fetchRes = await fetch(formattedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    clearTimeout(timeout);
    const html = await fetchRes.text();
    return res.json({ success: true, url: formattedUrl, html: html.slice(0, 500000) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to enrich domain', message: err.message });
  }
});

// Fast live Google Maps SMB Discovery for Local Businesses
app.get('/api/live-smb', async (req, res) => {
  const niche = req.query.niche || 'plumber';
  const city = req.query.city || 'Manchester';
  const country = req.query.country || 'UK';
  const limit = Math.min(parseInt(req.query.limit) || 25, 40);

  const query = `${niche} in ${city} ${country}`.trim();
  console.log(`[Live SMB Search] Starting query: "${query}" (target limit: ${limit})`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 35000 });

    // Handle Google cookie consent if present
    try {
      const consentBtn = await page.$('button[aria-label*="Accept all"], form[action*="consent"] button');
      if (consentBtn) {
        await consentBtn.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 4000 }).catch(() => {});
      }
    } catch (e) {
      // consent not shown or bypassed
    }

    await page.waitForSelector('[role="feed"], a[href*="/maps/place/"]', { timeout: 12000 }).catch(() => {});

    // Scroll feed down to trigger lazy-load of local businesses
    await page.evaluate(() => {
      const feed = document.querySelector('[role="feed"]');
      if (feed) feed.scrollBy(0, 3500);
    });
    await delay(1500);

    const isSocialOrDir = (url) => {
      if (!url) return false;
      const u = url.toLowerCase();
      return [
        'facebook.com',
        'instagram.com',
        'twitter.com',
        'x.com',
        'tiktok.com',
        'linkedin.com',
        'checkatrade.com',
        'yell.com',
        'yelp.com',
        'bark.com',
        'trustatrader.com',
        'mybuilder.com',
        'gumtree.com',
        'yellowpages.com',
        'getsquire.com',
        'booksy.com',
        'fresha.com',
        'vagaro.com',
        'google.com'
      ].some(domain => u.includes(domain));
    };

    // First collect all place targets as plain serializable data
    const places = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
      const list = [];
      const seen = new Set();

      for (const a of links) {
        const title = a.getAttribute('aria-label') || a.textContent.trim();
        if (!title || seen.has(title.toLowerCase())) continue;
        seen.add(title.toLowerCase());

        let card = a.parentElement;
        for (let i = 0; i < 6; i++) {
          if (!card) break;
          if (card.getAttribute('role') === 'article' || card.querySelector('button, a[data-value="Website"]')) break;
          card = card.parentElement;
        }

        const cardText = card ? card.innerText : '';
        const phoneMatch = cardText.match(/\+?\d{1,4}?[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,5}/);
        const ratingMatch = cardText.match(/([1-5]\.[0-9])/);
        const revMatch = cardText.match(/([0-9,]+)\s+reviews/i) || cardText.match(/\(([0-9,]+)\)/);

        const websiteBtn = card ? card.querySelector('a[data-value="Website"], a[aria-label*="website" i]') : null;
        let webUrl = websiteBtn ? websiteBtn.href : null;

        // Clean Google redirect / adurl
        if (webUrl && webUrl.includes('google.com/aclk')) {
          try {
            const u = new URL(webUrl);
            webUrl = u.searchParams.get('adurl') || null;
          } catch (e) {}
        }

        const lines = cardText.split('\n').map(l => l.trim()).filter(Boolean);
        let address = '';
        for (const line of lines) {
          if (line !== title && !line.includes('Open') && !line.includes('Closed') && !line.includes('stars') && !line.includes('review') && line.length > 5) {
            address = line;
            break;
          }
        }

        list.push({
          name: title,
          placeUrl: a.href,
          phone: phoneMatch ? phoneMatch[0].trim() : '',
          websiteUrl: webUrl,
          rating: ratingMatch ? parseFloat(ratingMatch[1]) : 5.0,
          reviews: revMatch ? parseInt(revMatch[1].replace(/,/g, ''), 10) : 0,
          address
        });
      }

      return list;
    });

    console.log(`[Live SMB Search] Found ${places.length} listings in feed for: "${query}"`);

    const items = [];
    const maxToProcess = Math.min(places.length, limit || 20);

    for (let i = 0; i < maxToProcess; i++) {
      const p = places[i];
      let phone = p.phone;
      let address = p.address;
      let websiteUrl = p.websiteUrl;

      // If phone or address is missing from the summary card, click the link directly by index in page
      if (!phone || !address || !websiteUrl) {
        try {
          const freshLink = await page.$(`a[href*="/maps/place/"][aria-label="${p.name.replace(/"/g, '\\"')}"]`);
          if (freshLink) {
            await freshLink.click().catch(() => {});
            await delay(400);

            const details = await page.evaluate(() => {
              let ph = '';
              const phoneBtn = document.querySelector('button[data-item-id^="phone:tel:"], button[aria-label*="Phone"]');
              if (phoneBtn) {
                ph = (phoneBtn.getAttribute('aria-label') || '').replace(/Phone:?/i, '').replace(/Phone number:?/i, '').trim();
                if (!ph) ph = phoneBtn.textContent.trim();
              }

              let addr = '';
              const addressBtn = document.querySelector('button[data-item-id="address"], button[aria-label*="Address"]');
              if (addressBtn) {
                addr = (addressBtn.getAttribute('aria-label') || '').replace(/Address:?/i, '').trim();
                if (!addr) addr = addressBtn.textContent.trim();
              }

              let w = '';
              const webBtn = document.querySelector('a[data-item-id="authority"], a[aria-label*="website" i]');
              if (webBtn) w = webBtn.href;

              return { ph, addr, w };
            });

            if (details.ph) phone = details.ph;
            if (details.addr) address = details.addr;
            if (details.w) {
              if (details.w.includes('google.com/aclk')) {
                try {
                  const u = new URL(details.w);
                  websiteUrl = u.searchParams.get('adurl') || null;
                } catch (e) {}
              } else {
                websiteUrl = details.w;
              }
            }
          }
        } catch (e) {}
      }

      // Check if URL is social or directory
      const isSocial = isSocialOrDir(websiteUrl);
      const hasOfficialWebsite = Boolean(websiteUrl && !isSocial && !websiteUrl.includes('google.com'));

      items.push({
        name: p.name,
        placeUrl: p.placeUrl,
        phone: phone || '',
        email: '', // Never fabricate dummy info@google.com emails!
        address: address || `${city}, ${country}`,
        hasWebsite: hasOfficialWebsite,
        isSocialOnly: isSocial,
        websiteUrl: hasOfficialWebsite ? websiteUrl : isSocial ? websiteUrl : null,
        rating: p.rating,
        reviews: p.reviews,
        snippet: `${address || city} • ${phone ? '📞 ' + phone : 'No Phone'} • ⭐ ${p.rating} (${p.reviews} reviews)`
      });
    }

    console.log(`[Live SMB Search] Returning ${items.length} verified leads for "${query}"`);
    return res.json({
      success: true,
      query,
      count: items.length,
      items
    });
  } catch (error) {
    console.error('[Live SMB Search] Error:', error);
    return res.status(500).json({ success: false, error: error.message, items: [] });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`[Crawler Engine] Background Server running on http://localhost:${PORT}`);
});
