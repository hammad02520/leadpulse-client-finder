import puppeteer from 'puppeteer';

async function testMaps() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const query = 'plumber in Manchester UK';
    console.log('Navigating to Google Maps for:', query);
    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('Page title:', await page.title());

    // Check for cookie consent button if present
    try {
      const consentBtn = await page.$('button[aria-label*="Accept all"], form[action*="consent"] button');
      if (consentBtn) {
        console.log('Clicking consent button...');
        await consentBtn.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
      }
    } catch (e) {
      // ignore
    }

    await page.waitForSelector('[role="feed"], a[href*="/maps/place/"]', { timeout: 10000 }).catch(() => {});

    const items = await page.evaluate(() => {
      const results = [];
      const links = document.querySelectorAll('a[href*="/maps/place/"]');
      links.forEach(a => {
        const text = a.getAttribute('aria-label') || a.textContent || '';
        const href = a.href;
        if (text && !results.some(r => r.name === text)) {
          // get parent or text around
          const container = a.closest('div[jsaction]') || a.parentElement;
          const containerText = container ? container.textContent : '';
          results.push({ name: text, href, previewText: containerText.slice(0, 150) });
        }
      });
      return results;
    });

    console.log('Found businesses count:', items.length);
    console.log('Sample businesses:', items.slice(0, 5));
  } catch (err) {
    console.error('Test failed:', err.message);
  } finally {
    await browser.close();
  }
}

testMaps();
