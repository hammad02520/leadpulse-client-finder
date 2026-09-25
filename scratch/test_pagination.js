async function testPagination() {
  const limit = 100;
  const offset = 0;
  const sparql = `
    SELECT DISTINCT ?item ?name ?orgNr ?website ?desc WHERE {
      ?item wdt:P2333 ?orgNr;
            wdt:P17 wd:Q34;
            rdfs:label ?name.
      FILTER(LANG(?name) = 'sv' || LANG(?name) = 'en')
      OPTIONAL { ?item schema:description ?desc. FILTER(LANG(?desc) = 'sv' || LANG(?desc) = 'en') }
      OPTIONAL { ?item wdt:P856 ?website. }
    } LIMIT ${limit} OFFSET ${offset}
  `;

  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
  const startTime = Date.now();
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'LeadPulse-Swedish-Registry/1.0 (https://leadpulse.app; research@leadpulse.app)'
    }
  });

  const data = await res.json();
  const duration = Date.now() - startTime;
  console.log(`Fetched ${data.results.bindings.length} registered Swedish corporations in ${duration}ms!`);
}

testPagination();
