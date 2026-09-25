import puppeteer from 'puppeteer';

async function testYelp() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const query = 'plumber';
    const loc = 'Manchester, UK';
    const url = `https://www.yelp.com/search?find_desc=${encodeURIComponent(query)}&find_loc=${encodeURIComponent(loc)}`;
    console.log('Fetching Yelp:', url);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const items = await page.evaluate(() => {
      const results = [];
      const headings = document.querySelectorAll('h3 a[href*="/biz/"]');
      headings.forEach(h => {
        const name = h.textContent.trim();
        const href = h.href;
        if (name && !results.some(r => r.name === name)) {
          results.push({ name, href });
        }
      });
      return results;
    });

    console.log('Yelp items count:', items.length);
    console.log('Sample items:', items.slice(0, 3));
  } catch (err) {
    console.error('Yelp error:', err.message);
  } finally {
    await browser.close();
  }
}

testYelp();
