import puppeteer from 'puppeteer';

async function testPlaceDetails() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Test with one of the user's exact results: Throne Barbershop Toronto
    const testUrl = 'https://www.google.com/maps/search/Throne+Barbershop+Toronto';
    console.log('Navigating to:', testUrl);
    await page.goto(testUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForSelector('button[data-item-id^="phone:tel:"], a[data-item-id="authority"], h1', { timeout: 10000 }).catch(() => {});

    const info = await page.evaluate(() => {
      let phone = '';
      let address = '';
      let website = '';

      const phoneBtn = document.querySelector('button[data-item-id^="phone:tel:"]');
      if (phoneBtn) {
        phone = (phoneBtn.getAttribute('aria-label') || '').replace(/Phone:?/i, '').replace(/Phone number:?/i, '').trim();
        if (!phone) phone = phoneBtn.textContent.trim();
      }

      const addressBtn = document.querySelector('button[data-item-id="address"]');
      if (addressBtn) {
        address = (addressBtn.getAttribute('aria-label') || '').replace(/Address:?/i, '').trim();
        if (!address) address = addressBtn.textContent.trim();
      }

      const webBtn = document.querySelector('a[data-item-id="authority"]');
      if (webBtn) {
        website = webBtn.href;
      }

      const h1 = document.querySelector('h1');
      const name = h1 ? h1.textContent.trim() : '';

      return { name, phone, address, website };
    });

    console.log('Extracted place details:', info);
  } finally {
    await browser.close();
  }
}

testPlaceDetails();
