async function testYell() {
  try {
    const url = 'https://www.yell.com/ucs/UcsSearchAction.do?keywords=plumber&location=Manchester';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('Yell status:', res.status);
    const html = await res.text();
    console.log('HTML length:', html.length);
    const hasBusiness = html.includes('businessCapsule');
    console.log('Has business capsules:', hasBusiness);
  } catch (e) {
    console.error('Yell error:', e.message);
  }
}

testYell();
