async function testOverpass() {
  const query = `
    [out:json][timeout:15];
    (
      node["craft"](59.30,18.00,59.35,18.10);
      node["shop"](59.30,18.00,59.35,18.10);
      node["amenity"="restaurant"](59.30,18.00,59.35,18.10);
      node["amenity"="dentist"](59.30,18.00,59.35,18.10);
    );
    out center 25;
  `;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'LeadPulse-Client-Finder/1.0'
    }
  });
  const data = await res.json();
  const withNames = data.elements.filter(e => e.tags && e.tags.name);
  console.log("Success! Real Stockholm businesses fetched live:", withNames.length);
  console.log(withNames.slice(0, 3).map(e => ({
    name: e.tags.name,
    category: e.tags.craft || e.tags.shop || e.tags.amenity,
    phone: e.tags.phone || e.tags['contact:phone'] || null,
    website: e.tags.website || e.tags['contact:website'] || null,
    street: e.tags['addr:street'] || null
  })));
}

testOverpass();
