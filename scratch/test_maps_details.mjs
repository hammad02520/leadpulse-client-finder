import puppeteer from 'puppeteer';

async function testExtraction() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const query = 'roofing contractors in Dallas TX';
    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForSelector('[role="feed"], a[href*="/maps/place/"]', { timeout: 10000 }).catch(() => {});

    // Scroll once to load more items
    await page.evaluate(() => {
      const feed = document.querySelector('[role="feed"]');
      if (feed) feed.scrollBy(0, 3000);
    });
    await new Promise(r => setTimeout(r, 2000));

    const leads = await page.evaluate(() => {
      const results = [];
      const placeLinks = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));

      placeLinks.forEach((a) => {
        const title = a.getAttribute('aria-label') || a.textContent.trim();
        if (!title) return;
        // Avoid duplicate links for the same business
        if (results.some(r => r.name.toLowerCase() === title.toLowerCase())) return;

        // Find the parent card container
        let card = a.parentElement;
        for (let i = 0; i < 5; i++) {
          if (!card) break;
          if (card.getAttribute('role') === 'article' || card.querySelector('button, a[data-value="Website"]')) {
            break;
          }
          card = card.parentElement;
        }

        const cardText = card ? card.innerText : '';

        // Extract phone number regex: (XXX) XXX-XXXX or +X XXX XXX XXXX or 0XX XXXX XXXX
        const phoneMatch = cardText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/) ||
                           cardText.match(/\+44\s?\d{2,4}\s?\d{3,4}\s?\d{3,4}/) ||
                           cardText.match(/0\d{3}\s?\d{3}\s?\d{4}/);
        const phone = phoneMatch ? phoneMatch[0].trim() : '';

        // Check if website button or link exists
        const websiteLink = card ? card.querySelector('a[aria-label*="website" i], a[data-value="Website"], a[href^="http"]:not([href*="google.com"])') : null;
        const hasWebsite = Boolean(websiteLink) || /website/i.test(cardText);
        const websiteUrl = websiteLink ? websiteLink.href : '';

        // Rating
        const ratingMatch = cardText.match(/([1-5]\.[0-9])/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

        // Address & details from card lines
        const lines = cardText.split('\n').map(l => l.trim()).filter(Boolean);

        results.push({
          name: title,
          placeUrl: a.href,
          phone,
          hasWebsite,
          websiteUrl,
          rating,
          fullText: lines.slice(0, 6).join(' | ')
        });
      });

      return results;
    });

    console.log(`Extracted ${leads.length} real businesses:`);
    leads.forEach((l, i) => {
      console.log(`[${i+1}] ${l.name} | Phone: ${l.phone || 'N/A'} | HasWebsite: ${l.hasWebsite} | Rating: ${l.rating}`);
    });
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
}

testExtraction();
