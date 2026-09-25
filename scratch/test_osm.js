async function testOsm() {
  const url = 'https://nominatim.openstreetmap.org/search?q=plumber+manchester&format=json&extratags=1&addressdetails=1&limit=20';
  const res = await fetch(url, { headers: { 'User-Agent': 'LeadPulse-Client-Finder/2.0' } });
  const data = await res.json();
  console.log('Nominatim items:', data.length);
}
testOsm();
