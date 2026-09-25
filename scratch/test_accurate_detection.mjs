import puppeteer from 'puppeteer';

const isSocialOrDirectory = (url) => {
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
    'yellowpages.com'
  ].some(domain => u.includes(domain));
};

async function testExtraction() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const query = 'Plumbers & Heating Engineers in Manchester United Kingdom';
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 35000 });

    await page.waitForSelector('[role="feed"], a[href*="/maps/place/"]', { timeout: 12000 }).catch(() => {});

    await page.evaluate(() => {
      const feed = document.querySelector('[role="feed"]');
      if (feed) feed.scrollBy(0, 3500);
    });
    await new Promise(r => setTimeout(r, 1500));

    const items = await page.evaluate(() => {
      const results = [];
      const placeLinks = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));

      placeLinks.forEach((a) => {
        const title = a.getAttribute('aria-label') || a.textContent.trim();
        if (!title || results.some(r => r.name.toLowerCase() === title.toLowerCase())) return;

        // Find enclosing card
        let card = a.parentElement;
        for (let i = 0; i < 6; i++) {
          if (!card) break;
          if (card.getAttribute('role') === 'article' || card.querySelector('button, a[data-value="Website"]')) {
            break;
          }
          card = card.parentElement;
        }

        const cardText = card ? card.innerText : '';

        // Extract phone number regex: UK (+44 / 01x / 07x) and US ((xxx) xxx-xxxx / +1) or international
        const phoneMatch = cardText.match(/\+44\s?\d{2,4}\s?\d{3,4}\s?\d{3,4}/) ||
                           cardText.match(/0[1-9]\d{2,3}\s?\d{3,4}\s?\d{3,4}/) ||
                           cardText.match(/(?:\+?1[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/) ||
                           cardText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
        const phone = phoneMatch ? phoneMatch[0].trim() : '';

        // Check website presence on Google Maps card specifically
        // Note: Do NOT use cardText.includes('Website') because Google ads or buttons can have 'Website' in text!
        const websiteLink = card ? card.querySelector('a[data-value="Website"], a[aria-label*="website" i]') : null;
        const rawUrl = websiteLink ? websiteLink.href : null;

        // Rating and reviews
        const ratingMatch = cardText.match(/([1-5]\.[0-9])/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 5.0;

        const revMatch = cardText.match(/\(([0-9,]+)\)/) || cardText.match(/([0-9,]+)\s+reviews/i);
        const reviews = revMatch ? parseInt(revMatch[1].replace(/,/g, ''), 10) : 0;

        const lines = cardText.split('\n').map(l => l.trim()).filter(Boolean);
        let address = '';
        for (const line of lines) {
          if (line !== title && !line.includes('Open') && !line.includes('Closed') && !line.includes('stars') && !line.includes('review') && line.length > 5) {
            address = line;
            break;
          }
        }

        results.push({
          name: title,
          placeUrl: a.href,
          phone,
          rawUrl,
          rating,
          reviews,
          address
        });
      });

      return results;
    });

    console.log(`Extracted ${items.length} items:`);
    items.forEach((it, i) => {
      const isSocial = isSocialOrDirectory(it.rawUrl);
      const hasRealWeb = Boolean(it.rawUrl) && !isSocial;
      const status = hasRealWeb ? 'HAS_WEBSITE' : isSocial ? 'SOCIAL_ONLY' : 'NO_WEBSITE';
      console.log(`[${i+1}] ${it.name} -> ${status} (Url: ${it.rawUrl || 'NONE'}, Phone: ${it.phone || 'NONE'})`);
    });
  } finally {
    await browser.close();
  }
}

testExtraction();
