import puppeteer from 'puppeteer';

async function inspectCards() {
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
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });

    await page.waitForSelector('[role="feed"], a[href*="/maps/place/"]', { timeout: 12000 }).catch(() => {});

    const details = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
      return links.slice(0, 3).map(a => {
        let card = a.parentElement;
        for (let i = 0; i < 6; i++) {
          if (!card) break;
          if (card.getAttribute('role') === 'article' || card.querySelector('button, a[data-value="Website"]')) break;
          card = card.parentElement;
        }
        return {
          title: a.getAttribute('aria-label') || a.textContent.trim(),
          innerText: card ? card.innerText : 'NO CARD',
          innerHTML: card ? card.innerHTML.slice(0, 500) : ''
        };
      });
    });

    console.log('Sample Card 1:', JSON.stringify(details[0], null, 2));
    console.log('Sample Card 2:', JSON.stringify(details[1], null, 2));
  } finally {
    await browser.close();
  }
}

inspectCards();
