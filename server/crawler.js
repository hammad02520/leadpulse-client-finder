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

// Background Crawler Function
async function startCrawling(queries) {
  status.isRunning = true;
  status.shouldStop = false;
  status.totalScraped = 0; // Reset session count, file keeps growing
  status.logs = [];
  
  addLog('Initializing Stealth Crawler Engine...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    for (const query of queries) {
      if (status.shouldStop) break;
      
      status.currentQuery = query;
      addLog(`Starting query: "${query}"`);
      
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      
      addLog('Waiting for Google Maps results feed...');
      await page.waitForSelector('[role="feed"]', { timeout: 15000 }).catch(() => addLog('Feed selector timeout, attempting to continue...'));

      let previousItemCount = 0;
      let noNewItemsCount = 0;
      const seenNames = new Set(); // Prevent duplicates in this specific query session

      // Infinite scroll loop for the current query
      while (!status.shouldStop) {
        // Extract items
        const results = await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll('a[href^="https://www.google.com/maps/place"]'));
          const extracted = [];
          
          items.forEach(item => {
            try {
              const container = item.closest('div[role="article"]') || item.parentElement.parentElement;
              if (!container) return;

              const titleEl = container.querySelector('.fontHeadlineSmall');
              if (!titleEl) return;
              const name = titleEl.textContent.trim();

              const textContent = container.innerText;
              const lines = textContent.split('\n').map(l => l.trim()).filter(l => l);

              let rating = '';
              let reviews = '';
              let category = '';
              let phone = '';
              let website = '';
              let address = '';

              const ratingLine = lines.find(l => l.includes('(') && l.match(/^[0-9]\.[0-9]/));
              if (ratingLine) {
                const rMatch = ratingLine.match(/([0-9]\.[0-9])/);
                if (rMatch) rating = rMatch[1];
                const revMatch = ratingLine.match(/\(([\d,]+)\)/);
                if (revMatch) reviews = revMatch[1].replace(',', '');
                const parts = ratingLine.split('·');
                if (parts.length > 1) category = parts[parts.length - 1].trim();
              }

              // Robust Phone Extraction
              const phoneBtn = container.querySelector('button[data-tooltip*="phone"], button[aria-label*="Phone"]');
              if (phoneBtn) {
                 const aria = phoneBtn.getAttribute('aria-label') || '';
                 phone = aria.replace('Phone number:', '').replace('Phone:', '').trim();
              }
              if (!phone) {
                 // Aggressive text regex for US and International phones
                 const allText = container.innerText || '';
                 const usPhoneRegex = /(?:\+1\s?)?\(?[2-9]\d{2}\)?[\s.-]?[2-9]\d{2}[\s.-]?\d{4}/; 
                 // Matches +XX, (XXX), XXX-XXX, and generic international spacing
                 const genericPhoneRegex = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,5}\)?[\s.-]?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{0,4}/;
                 
                 const usMatch = allText.match(usPhoneRegex);
                 if (usMatch) {
                   phone = usMatch[0];
                 } else {
                   const genMatch = allText.match(genericPhoneRegex);
                   if (genMatch) {
                     // Filter out matches that are too short to be real numbers (e.g. just a year "2023")
                     const cleanNum = genMatch[0].replace(/[^\d]/g, '');
                     if (cleanNum.length >= 8) {
                        phone = genMatch[0].trim();
                     }
                   }
                 }
              }

              // Robust Website Extraction
              const websiteBtn = container.querySelector('a[data-tooltip*="website"], a[aria-label*="Website"], a[data-value="Website"]');
              if (websiteBtn) {
                 website = websiteBtn.href;
              }
              if (!website) {
                 const links = Array.from(container.querySelectorAll('a'));
                 const validLink = links.find(a => 
                   a.href && 
                   a.href.startsWith('http') && 
                   !a.href.includes('google.com') && 
                   !a.href.includes('gstatic.com')
                 );
                 if (validLink) website = validLink.href;
              }
              
              address = lines.length > 2 ? lines[2].replace(/,/g, '') : ''; // Simple comma strip for CSV

              extracted.push({ name: name.replace(/,/g, ''), rating, reviews, category: category.replace(/,/g, ''), phone, website, address });
            } catch (e) { }
          });
          return extracted;
        });

        // Save new unique items to CSV
        let newlyAdded = 0;
        let csvData = '';
        for (const item of results) {
          if (!seenNames.has(item.name)) {
            seenNames.add(item.name);
            // Notice the empty space for the Email column (we leave it blank for them to fill later)
            csvData += `${item.name},${item.phone},,${item.category},${item.rating},${item.reviews},${item.website},${item.address}\n`;
            newlyAdded++;
            status.totalScraped++;
          }
        }

        if (newlyAdded > 0) {
          fs.appendFileSync(CSV_FILE, csvData, 'utf-8');
          addLog(`Scraped & saved ${newlyAdded} new leads. (Total this session: ${status.totalScraped})`);
          noNewItemsCount = 0;
        } else {
          noNewItemsCount++;
        }

        if (noNewItemsCount >= 3) {
          addLog(`Reached end of results for "${query}". Moving to next...`);
          break; // Exit scroll loop, go to next query
        }

        // Scroll down
        await page.evaluate(() => {
          const feed = document.querySelector('[role="feed"]');
          if (feed) feed.scrollBy(0, 5000);
        });

        addLog('Scrolling and waiting 3 seconds for bot evasion...');
        await delay(3000); // Human-like wait
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
