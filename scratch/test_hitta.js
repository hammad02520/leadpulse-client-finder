async function testHittaParse() {
  const url = 'https://www.hitta.se/s%C3%B6k?vad=r%C3%B6rmokare+stockholm';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
  const html = await res.text();
  
  // Check __NEXT_DATA__
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    const nextData = JSON.parse(nextDataMatch[1]);
    const pageProps = nextData.props?.pageProps;
    console.log('Keys in pageProps:', Object.keys(pageProps || {}));
    
    // Check results or companies
    const searchResult = pageProps?.initialState?.search?.data || pageProps?.searchResult || pageProps?.companies;
    console.log('SearchResult keys:', Object.keys(searchResult || {}));
    if (pageProps?.initialState) {
      console.log('initialState keys:', Object.keys(pageProps.initialState));
      const companies = pageProps.initialState.companies?.data || pageProps.initialState.search?.companies;
      console.log('Companies:', companies?.length);
    }
  }

  // Also check JSON-LD
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  if (jsonLd) {
    jsonLd.forEach(s => {
      const clean = s.replace('<script type="application/ld+json">', '').replace('</script>', '');
      try {
        const p = JSON.parse(clean);
        if (p['@type'] === 'ItemList') {
          console.log('Found ItemList with items:', p.itemListElement?.length);
          if (p.itemListElement?.[0]) {
            console.log('Sample Item:', p.itemListElement[0].item);
          }
        }
      } catch(e) {}
    });
  }
}

testHittaParse();
