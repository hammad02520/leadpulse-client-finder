async function testWikidataStockholm() {
  const sparqlQuery = `
    SELECT DISTINCT ?item ?name ?orgNr ?cityLabel ?website ?industryLabel WHERE {
      ?item wdt:P2333 ?orgNr;
            wdt:P17 wd:Q34;
            rdfs:label ?name.
      FILTER(LANG(?name) = 'sv' || LANG(?name) = 'en')
      
      OPTIONAL { ?item wdt:P131 ?city. ?city rdfs:label ?cityLabel. FILTER(LANG(?cityLabel) = 'sv' || LANG(?cityLabel) = 'en') }
      OPTIONAL { ?item wdt:P856 ?website. }
      OPTIONAL { ?item wdt:P452 ?industry. ?industry rdfs:label ?industryLabel. FILTER(LANG(?industryLabel) = 'sv' || LANG(?industryLabel) = 'en') }
    } LIMIT 20
  `;

  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
  
  const startTime = Date.now();
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'LeadPulse-Swedish-Finder/1.0 (https://leadpulse.app)'
    }
  });

  const data = await res.json();
  const duration = Date.now() - startTime;
  console.log(`Fetched ${data.results.bindings.length} live Swedish companies in ${duration}ms:`);
  
  const companies = data.results.bindings.map(b => ({
    name: b.name.value,
    orgNr: b.orgNr.value,
    vatNumber: `SE${b.orgNr.value.replace(/[^0-9]/g, '').padEnd(10, '0')}01`,
    city: b.cityLabel?.value || 'Sverige',
    industry: b.industryLabel?.value || 'Företag / Tjänster',
    website: b.website?.value || null
  }));

  console.log(JSON.stringify(companies.slice(0, 6), null, 2));
}

testWikidataStockholm();
