async function testCount() {
  const sparql = `
    SELECT (COUNT(DISTINCT ?item) AS ?total) WHERE {
      ?item wdt:P2333 ?orgNr;
            wdt:P17 wd:Q34.
    }
  `;
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'LeadPulse/1.0' }
  });
  const data = await res.json();
  console.log("Total Swedish companies with P2333 in Wikidata:", data.results.bindings[0].total.value);
}

testCount();
