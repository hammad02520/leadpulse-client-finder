import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';

const app = express();
const PORT = 3001;

app.use(cors());

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.get('/api/scrape', async (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  console.log(`[Scraper] Starting stealth scrape for: "${query}"`);
  
  let browser;
  try {
    // Launch stealth headless browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set a standard viewport and User-Agent to avoid mobile views and bot detection
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('[Scraper] Page loaded. Looking for feed...');

    // Wait for the feed element which contains the scrollable list of places
    await page.waitForSelector('[role="feed"]', { timeout: 15000 }).catch(() => console.log('Feed not found quickly, might be a single result or slow.'));
    
    // Scroll down multiple times to load more results
    console.log('[Scraper] Scrolling to load more results...');
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        const feed = document.querySelector('[role="feed"]');
        if (feed) feed.scrollBy(0, 5000);
      });
      await delay(2000); // Wait for network requests to load new items
    }

    // Extract Data
    console.log('[Scraper] Extracting local business leads...');
    const results = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('a[href^="https://www.google.com/maps/place"]'));
      
      const extracted = [];
      const seenNames = new Set();

      items.forEach(item => {
        try {
          const container = item.closest('div[role="article"]') || item.parentElement.parentElement;
          if (!container) return;

          // Title
          const titleEl = container.querySelector('.fontHeadlineSmall');
          if (!titleEl) return;
          const name = titleEl.textContent.trim();
          
          if (seenNames.has(name)) return; // Prevent duplicates
          seenNames.add(name);

          // Full Text content for parsing details (Rating, Reviews, Category, Address)
          const textContent = container.innerText;
          const lines = textContent.split('\n').map(l => l.trim()).filter(l => l);

          // Very basic parsing from innerText (Google DOM changes often, so text parsing is more resilient)
          let rating = null;
          let reviews = null;
          let category = 'Local Business';
          let phone = null;
          let website = null;
          let address = null;

          // Attempt to find rating/reviews
          const ratingLine = lines.find(l => l.includes('(') && l.match(/^[0-9]\.[0-9]/));
          if (ratingLine) {
            const rMatch = ratingLine.match(/([0-9]\.[0-9])/);
            if (rMatch) rating = parseFloat(rMatch[1]);
            const revMatch = ratingLine.match(/\(([\d,]+)\)/);
            if (revMatch) reviews = parseInt(revMatch[1].replace(',', ''));
            
            // Usually Category is right after rating
            const parts = ratingLine.split('·');
            if (parts.length > 1) {
                category = parts[parts.length - 1].trim();
            }
          }

          // Try to find Phone number
          const phoneLine = lines.find(l => l.match(/(?:(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4})/));
          if (phoneLine) {
            phone = phoneLine.match(/(?:(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4})/)[0].trim();
          }

          // Address is typically in lines, look for generic address patterns or just take the lines after category
          // For a simpler approach, we grab standard info.

          // Find Website Link
          const links = Array.from(container.querySelectorAll('a'));
          const websiteBtn = links.find(a => a.href && !a.href.includes('google.com/maps') && !a.href.includes('google.com/search'));
          if (websiteBtn) {
            website = websiteBtn.href;
          }

          extracted.push({
            name,
            rating,
            reviews,
            category,
            phone,
            website,
            address: lines.length > 2 ? lines[2] : null, // Fallback for address
            sourceUrl: item.href
          });
        } catch (e) {
          // Ignore parse errors for individual items
        }
      });

      return extracted;
    });

    console.log(`[Scraper] Successfully extracted ${results.length} leads.`);
    await browser.close();
    
    res.json({ success: true, count: results.length, data: results });

  } catch (error) {
    console.error('[Scraper] Error:', error);
    if (browser) await browser.close();
    res.status(500).json({ error: 'Scraping failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Scraper] Background Server running on http://localhost:${PORT}`);
});
