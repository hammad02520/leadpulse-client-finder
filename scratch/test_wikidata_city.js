async function testSwedishCities() {
  const city = "Stockholm";
  const sparqlQuery = `
    SELECT DISTINCT ?item ?name ?orgNr ?website ?desc WHERE {
      ?item wdt:P2333 ?orgNr;
            wdt:P17 wd:Q34;
            rdfs:label ?name.
      FILTER(LANG(?name) = 'sv' || LANG(?name) = 'en')
      
      OPTIONAL { ?item schema:description ?desc. FILTER(LANG(?desc) = 'sv' || LANG(?desc) = 'en') }
      OPTIONAL { ?item wdt:P856 ?website. }
    } LIMIT 25
  `;

  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
  
  const startTime = Date.now();
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'LeadPulse-Swedish-Finder/1.0 (https://leadpulse.app; hello@leadpulse.app)'
    }
  });

  const data = await res.json();
  const duration = Date.now() - startTime;
  console.log(`Fetched ${data.results.bindings.length} results in ${duration}ms`);
  
  const results = data.results.bindings.map(b => ({
    name: b.name.value,
    orgNr: b.orgNr.value,
    vatNr: `SE${b.orgNr.value.replace(/[^0-9]/g, '').padEnd(10, '0')}01`,
    website: b.website?.value || null,
    desc: b.desc?.value || 'Swedish registered commercial enterprise'
  }));

  console.log(results.slice(0, 5));
}

testSwedishCities();
