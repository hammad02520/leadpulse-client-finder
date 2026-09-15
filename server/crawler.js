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
  shouldStop: false
};

const CSV_FILE = path.resolve('server/scraped_leads.csv');

// Helper to write logs
const addLog = (msg) => {
  const timestamp = new Date().toLocaleTimeString();
  status.logs.unshift(`[${timestamp}] ${msg}`);
  if (status.logs.length > 50) status.logs.pop(); // Keep only last 50 logs
  console.log(msg);
};

// Helper for delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Ensure CSV exists and has headers
if (!fs.existsSync(CSV_FILE)) {
  fs.writeFileSync(CSV_FILE, 'Name,Phone,Email,Category,Rating,Reviews,Website,Address\n', 'utf-8');
}

async function startCrawling(queries) {
  status.isRunning = true;
  status.shouldStop = false;
  status.totalScraped = 0;
  status.logs = [];
  
  addLog('Initializing Stealth Crawler Engine...');
  
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
    
    // Set standard user agent
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    await listPage.setUserAgent(ua);
    await detailPage.setUserAgent(ua);

    for (const query of queries) {
      if (status.shouldStop) break;
      
      status.currentQuery = query;
      addLog(`Starting query: "${query}"`);
      
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
      await listPage.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      
      addLog('Waiting for Google Maps results feed...');
      await listPage.waitForSelector('[role="feed"]', { timeout: 15000 }).catch(() => addLog('Feed selector timeout, attempting to continue...'));

      let noNewItemsCount = 0;
      const seenUrls = new Set(); 

      // Infinite scroll loop to just collect URLs
      while (!status.shouldStop) {
        
        // 1. Extract URLs from the current view
        const newUrls = await listPage.evaluate(() => {
          const items = Array.from(document.querySelectorAll('a[href^="https://www.google.com/maps/place"]'));
          return items.map(i => i.href);
        });

        const urlsToVisit = [];
        for (const url of newUrls) {
          // Normalize URL to prevent duplicates (remove query params if needed, or just strict match)
          const cleanUrl = url.split('?')[0]; 
          if (!seenUrls.has(cleanUrl)) {
            seenUrls.add(cleanUrl);
            urlsToVisit.push(url);
          }
        }

        if (urlsToVisit.length > 0) {
          addLog(`Found ${urlsToVisit.length} new profiles in list. Deep scraping now...`);
          noNewItemsCount = 0;
          
          await detailPage.bringToFront(); // Focus detail page to prevent throttling
          
          // 2. Visit each new URL one by one to guarantee accurate data extraction
          for (const profileUrl of urlsToVisit) {
             if (status.shouldStop) break;
             
             try {
                await detailPage.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                // Short wait to ensure panel text loads
                await delay(2000); // Slightly longer wait to ensure Google renders the side panel
                
                const profileData = await detailPage.evaluate(() => {
                   let name = '';
                   let rating = '';
                   let reviews = '';
                   let category = '';
                   let phone = '';
                   let website = '';
                   let address = '';

                   // Title usually in an h1
                   const h1 = document.querySelector('h1');
                   if (h1) name = h1.textContent.trim();

                   // Rating and Reviews
                   const ratingBtn = document.querySelector('div[aria-label*="stars"], span[aria-label*="stars"]');
                   if (ratingBtn) {
                      const aria = ratingBtn.getAttribute('aria-label');
                      const rMatch = aria.match(/([0-9]\.[0-9])/);
                      if (rMatch) rating = rMatch[1];
                      const revMatch = aria.match(/([0-9,]+)\s+reviews/i);
                      if (revMatch) reviews = revMatch[1].replace(/,/g, '');
                   }

                   // Category
                   const catBtn = document.querySelector('button[jsaction="pane.rating.category"]');
                   if (catBtn) category = catBtn.textContent.trim();

                   // Phone
                   const phoneBtn = document.querySelector('button[data-item-id^="phone:tel:"]');
                   if (phoneBtn) {
                      const aria = phoneBtn.getAttribute('aria-label') || '';
                      phone = aria.replace('Phone number:', '').replace('Phone:', '').trim();
                      if (!phone) phone = phoneBtn.textContent.trim();
                   }

                   // Website
                   const websiteBtn = document.querySelector('a[data-item-id="authority"]');
                   if (websiteBtn) website = websiteBtn.href;

                   // Address
                   const addressBtn = document.querySelector('button[data-item-id="address"]');
                   if (addressBtn) {
                      const aria = addressBtn.getAttribute('aria-label') || '';
                      address = aria.replace('Address:', '').trim();
                      if (!address) address = addressBtn.textContent.trim();
                   }

                   return { name: name.replace(/,/g, ''), rating, reviews, category: category.replace(/,/g, ''), phone, website: website || '', address: address.replace(/,/g, ' ') };
                });

                if (profileData.name) {
                  const csvLine = `${profileData.name},${profileData.phone},,${profileData.category},${profileData.rating},${profileData.reviews},${profileData.website},${profileData.address}\n`;
                  fs.appendFileSync(CSV_FILE, csvLine, 'utf-8');
                  status.totalScraped++;
                }

             } catch (err) {
                // Ignore single page timeout errors
             }
          }
          
          addLog(`Finished deep scraping batch. (Total this session: ${status.totalScraped})`);
          
        } else {
          noNewItemsCount++;
        }

        if (noNewItemsCount >= 5) {
          addLog(`Reached end of results for "${query}". Moving to next...`);
          break; // Exit scroll loop, go to next query
        }

        await listPage.bringToFront(); // Focus list page so IntersectionObserver works during scroll
        // Scroll down
        await listPage.evaluate(() => {
          const feed = document.querySelector('[role="feed"]');
          if (feed) feed.scrollBy(0, 5000);
        });

        addLog('Scrolling list and waiting 3 seconds...');
        await delay(3000); // Wait longer for list items to render on DOM
      }
    }

    addLog('Crawl Session Complete.');
  } catch (error) {
    addLog(`Error: ${error.message}`);
  } finally {
    if (browser) await browser.close();
    status.isRunning = false;
  }
}

// API Endpoints

app.post('/api/crawler/start', (req, res) => {
  const { queries } = req.body;
  if (!queries || !Array.isArray(queries) || queries.length === 0) {
    return res.status(400).json({ error: 'Valid queries array is required' });
  }
  
  if (status.isRunning) {
    return res.status(400).json({ error: 'Crawler is already running' });
  }

  // Start asynchronously (don't await)
  startCrawling(queries);
  res.json({ message: 'Crawler started in background' });
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
