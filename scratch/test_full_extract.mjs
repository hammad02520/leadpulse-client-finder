import puppeteer from 'puppeteer';

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
    'vagaro.com'
  ].some(domain => u.includes(domain));
};

async function testFull() {
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
    console.log('Searching:', query);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });

    await page.waitForSelector('[role="feed"], a[href*="/maps/place/"]', { timeout: 12000 }).catch(() => {});

    // Collect feed items
    const links = await page.$$('a[href*="/maps/place/"]');
    console.log(`Found ${links.length} total places in feed.`);

    const leads = [];
    const targetCount = Math.min(links.length, 10);

    for (let i = 0; i < targetCount; i++) {
      const link = links[i];
      const title = await link.evaluate(el => el.getAttribute('aria-label') || el.textContent.trim());
      if (!title || leads.some(l => l.name === title)) continue;

      const placeUrl = await link.evaluate(el => el.href);

      // Click to open detail pane
      await link.click().catch(() => {});
      await new Promise(r => setTimeout(r, 650));

      const details = await page.evaluate(() => {
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

        let websiteUrl = '';
        const webBtn = document.querySelector('a[data-item-id="authority"], a[aria-label*="website" i]');
        if (webBtn) {
          websiteUrl = webBtn.href;
        }

        // Rating
        const ratingEl = document.querySelector('div[role="main"] span[aria-label*="stars"], span[aria-label*="stars"]');
        let rating = 5.0;
        if (ratingEl) {
          const m = (ratingEl.getAttribute('aria-label') || '').match(/([1-5]\.[0-9])/);
          if (m) rating = parseFloat(m[1]);
        }

        const revMatch = document.body.innerText.match(/([0-9,]+)\s+reviews/i);
        const reviews = revMatch ? parseInt(revMatch[1].replace(/,/g, ''), 10) : 0;

        return { phone, address, websiteUrl, rating, reviews };
      });

      const isSocial = isSocialOrDir(details.websiteUrl);
      const hasOfficialWebsite = Boolean(details.websiteUrl && !isSocial);

      leads.push({
        name: title,
        placeUrl,
        phone: details.phone,
        address: details.address,
        hasWebsite: hasOfficialWebsite,
        isSocialOnly: isSocial,
        websiteUrl: details.websiteUrl || null,
        rating: details.rating,
        reviews: details.reviews
      });

      console.log(`[${leads.length}] ${title} | 📞 ${details.phone || 'NO PHONE'} | 🌐 ${hasOfficialWebsite ? 'HAS WEB: ' + details.websiteUrl : isSocial ? 'SOCIAL ONLY: ' + details.websiteUrl : '❌ NO WEBSITE'}`);
    }

    console.log(`\nSuccessfully captured ${leads.length} leads with full contact info!`);
  } finally {
    await browser.close();
  }
}

testFull();
