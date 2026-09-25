async function testOverpass() {
  const query = `
    [out:json][timeout:25];
    area["ISO3166-1"="SE"][admin_level=2]->.sweden;
    (
      node["craft"](area.sweden);
      node["office"](area.sweden);
      node["shop"](area.sweden);
    );
    out center 15;
  `;
  const url = `https://overpass-api.de/api/interpreter`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: query,
      headers: {
        'User-Agent': 'LeadPulse-Client-Finder/1.0'
      }
    });
    const data = await res.json();
    console.log("Count:", data.elements?.length);
    console.log("Sample:", JSON.stringify(data.elements?.slice(0, 3), null, 2));
  } catch (err) {
    console.error(err);
  }
}

testOverpass();
