import puppeteer from 'puppeteer';

async function testFastDetailExtraction() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const query = 'barbershop in Toronto Canada';
    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    console.log('Navigating to Google Maps...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });

    await page.waitForSelector('[role="feed"], a[href*="/maps/place/"]', { timeout: 12000 }).catch(() => {});

    // Collect first 6 places
    const links = await page.$$('a[href*="/maps/place/"]');
    console.log(`Found ${links.length} places. Clicking top 5 to extract phone & website in real-time...`);

    const results = [];
    const maxItems = Math.min(links.length, 6);

    for (let i = 0; i < maxItems; i++) {
      const link = links[i];
      const start = Date.now();
      
      // Click the link to load detail pane
      await link.click().catch(() => {});
      await new Promise(r => setTimeout(r, 600)); // 600ms wait for detail pane to update

      const data = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        const name = h1 ? h1.textContent.trim() : '';

        let phone = '';
        const phoneBtn = document.querySelector('button[data-item-id^="phone:tel:"], button[aria-label*="Phone"]');
        if (phoneBtn) {
          phone = (phoneBtn.getAttribute('aria-label') || '').replace(/Phone:?/i, '').replace(/Phone number:?/i, '').trim();
          if (!phone) phone = phoneBtn.textContent.trim();
        }

        let address = '';
        const addressBtn = document.querySelector('button[data-item-id="address"], button[aria-label*="Address"]');
        if (addressBtn) {
          address = (addressBtn.getAttribute('aria-label') || '').replace(/Address:?/i, '').trim();
          if (!address) address = addressBtn.textContent.trim();
        }

        let website = '';
        const webBtn = document.querySelector('a[data-item-id="authority"], a[aria-label*="website" i]');
        if (webBtn) {
          website = webBtn.href;
        }

        // Rating
        const ratingBtn = document.querySelector('div[aria-label*="stars"], span[aria-label*="stars"]');
        const rating = ratingBtn ? (ratingBtn.getAttribute('aria-label') || '').match(/([1-5]\.[0-9])/)?.[1] : null;

        return { name, phone, address, website, rating };
      });

      console.log(`[${i+1}] ${data.name} | Phone: ${data.phone || 'NONE'} | Web: ${data.website || 'NO WEBSITE'} | Time: ${Date.now() - start}ms`);
      results.push(data);
    }
  } finally {
    await browser.close();
  }
}

testFastDetailExtraction();
