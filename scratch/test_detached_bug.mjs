import puppeteer from 'puppeteer';

async function testDetachedBug() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const query = 'plumber in Sydney Australia';
    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });

    await page.waitForSelector('[role="feed"], a[href*="/maps/place/"]', { timeout: 12000 }).catch(() => {});

    const placeLinks = await page.$$('a[href*="/maps/place/"]');
    console.log('Found links:', placeLinks.length);

    for (let i = 0; i < Math.min(placeLinks.length, 5); i++) {
      try {
        console.log(`Trying item ${i}...`);
        const title = await placeLinks[i].evaluate(el => el.getAttribute('aria-label') || el.textContent);
        console.log(`Item ${i} title:`, title);
        await placeLinks[i].click();
        await new Promise(r => setTimeout(r, 600));
        console.log(`Item ${i} click success!`);
      } catch (err) {
        console.error(`Item ${i} ERROR:`, err.message);
      }
    }
  } finally {
    await browser.close();
  }
}

testDetachedBug();
