async function testOsm() {
  try {
    const body = `data=${encodeURIComponent('[out:json];node["amenity"~"restaurant|bakery|gym|clinic|beauty"](30.25,-97.76,30.35,-97.70);out 25;')}`;
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const data = await res.json();
    console.log('OSM Elements returned:', data.elements ? data.elements.length : 0);
    if (data.elements) {
      const withName = data.elements.filter(e => e.tags && e.tags.name);
      console.log('Named SMB Businesses:', withName.length);
      withName.slice(0, 5).forEach((b, i) => {
        console.log(`${i+1}. Name: "${b.tags.name}" | Amenity: ${b.tags.amenity} | Has Website?: ${b.tags.website ? b.tags.website : '❌ NO WEBSITE'}`);
      });
    }
  } catch (e) {
    console.error('OSM error:', e.message);
  }
}
testOsm();
