async function testWikidata() {
  const query = `
    SELECT DISTINCT ?item ?name ?orgNr ?city ?website WHERE {
      ?item wdt:P2333 ?orgNr;
            wdt:P17 wd:Q34;
            rdfs:label ?name.
      FILTER(LANG(?name) = 'sv' || LANG(?name) = 'en')
      OPTIONAL { ?item wdt:P131 ?cityItem. ?cityItem rdfs:label ?city. FILTER(LANG(?city) = 'sv') }
      OPTIONAL { ?item wdt:P856 ?website. }
    } LIMIT 10
  `;
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'LeadPulse-Client-Finder/1.0 (https://leadpulse.app; developer@leadpulse.app)'
    }
  });
  const data = await res.json();
  console.log(JSON.stringify(data.results.bindings.slice(0, 5), null, 2));
}

testWikidata();
