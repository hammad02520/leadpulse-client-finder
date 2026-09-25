async function test() {
  const res = await fetch('https://www.hitta.se/s%C3%B6k?vad=r%C3%B6rmokare+stockholm', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
  const html = await res.text();
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  const data = JSON.parse(nextDataMatch[1]);
  const result = data.props.pageProps.result;
  console.log('Result keys:', Object.keys(result || {}));
  
  // Find where companies are stored
  for (const k of Object.keys(result || {})) {
    const val = result[k];
    if (val && typeof val === 'object') {
      console.log(`Key ${k}:`, Object.keys(val));
      if (val.rows || Array.isArray(val)) {
        const rows = val.rows || val;
        console.log(`Key ${k} has ${rows.length} rows`);
        if (rows[0]) {
          console.log(`Sample from ${k}:`, {
            displayName: rows[0].displayName,
            name: rows[0].name,
            orgNo: rows[0].orgNo || rows[0].legalName,
            phone: rows[0].phoneNumbers || rows[0].phone,
            address: rows[0].address,
            website: rows[0].homepage || rows[0].webAddress || rows[0].links
          });
        }
      }
    }
  }
}
test();
