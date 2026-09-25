import puppeteer from 'puppeteer';

async function checkNoWebsiteCards() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Search specifically for local trade services in an area
    const query = 'mobile car detailing in Dallas TX';
    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForSelector('[role="feed"], a[href*="/maps/place/"]', { timeout: 10000 }).catch(() => {});

    const items = await page.evaluate(() => {
      const results = [];
      const placeLinks = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));

      placeLinks.forEach((a) => {
        const title = a.getAttribute('aria-label') || a.textContent.trim();
        if (!title || results.some(r => r.name === title)) return;

        // Parent card
        let card = a.parentElement;
        while (card && !card.querySelector('a[aria-label*="website" i], a[data-value="Website"], a[href*="http"]:not([href*="google"])') && card.getAttribute('role') !== 'article' && card.parentElement && card.parentElement !== document.body) {
          if (card.innerText && card.innerText.includes('Website')) break;
          card = card.parentElement;
        }

        const cardText = card ? card.innerText : '';
        const hasWebsite = /website/i.test(cardText);
        const websiteLink = card ? card.querySelector('a[aria-label*="website" i], a[data-value="Website"]') : null;

        results.push({
          name: title,
          hasWebsite,
          websiteUrl: websiteLink ? websiteLink.href : null,
          hasDirections: /directions/i.test(cardText),
          hasCall: /call|phone/i.test(cardText)
        });
      });

      return results;
    });

    console.log('Results breakdown:');
    items.forEach(it => {
      console.log(`${it.name}: HasWebsite=${it.hasWebsite}, Url=${it.websiteUrl}`);
    });
  } finally {
    await browser.close();
  }
}

checkNoWebsiteCards();
