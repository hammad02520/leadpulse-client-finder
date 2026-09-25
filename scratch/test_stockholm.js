async function testStockholm() {
  const query = `
    [out:json][timeout:15];
    (
      node["craft"](59.28,17.90,59.42,18.20);
      node["shop"](59.28,17.90,59.42,18.20);
      node["amenity"="restaurant"](59.28,17.90,59.42,18.20);
      node["amenity"="dentist"](59.28,17.90,59.42,18.20);
    );
    out center 30;
  `;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
    headers: { 'User-Agent': 'LeadPulse/1.0' }
  });
  const data = await res.json();
  const withNames = data.elements.filter(e => e.tags && e.tags.name);
  console.log("Found real Stockholm businesses:", withNames.length);
  console.log(withNames.slice(0, 5).map(e => ({
    name: e.tags.name,
    category: e.tags.craft || e.tags.shop || e.tags.amenity,
    phone: e.tags.phone || e.tags['contact:phone'],
    website: e.tags.website || e.tags['contact:website'],
    street: e.tags['addr:street']
  })));
}

testStockholm();
