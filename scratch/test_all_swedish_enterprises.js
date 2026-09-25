async function testAllEnterprises() {
  const sparql = `
    SELECT (COUNT(DISTINCT ?item) AS ?total) WHERE {
      ?item wdt:P17 wd:Q34;
            wdt:P31/wdt:P279* wd:Q4830453.
    }
  `;
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'LeadPulse/1.0' } });
  const data = await res.json();
  console.log("Total Swedish business enterprises in Wikidata:", data.results.bindings[0].total.value);
}

testAllEnterprises();
