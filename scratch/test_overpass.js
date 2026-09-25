const mirrors = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

const query = `[out:json][timeout:25];
(
  node["craft"="plumber"](53.3,-2.4,53.6,-2.1);
  way["craft"="plumber"](53.3,-2.4,53.6,-2.1);
  node["shop"="plumber"](53.3,-2.4,53.6,-2.1);
);
out body 20;
>;
out skel qt;`;

async function run() {
  for (const m of mirrors) {
    try {
      console.log('Testing mirror:', m);
      const start = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(m, {
        method: 'POST',
        headers: {
          'User-Agent': 'LeadPulse/1.0',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'data=' + encodeURIComponent(query),
        signal: controller.signal
      });
      clearTimeout(timeout);
      console.log(m, 'Status:', res.status, 'Time:', Date.now() - start, 'ms');
      if (res.ok) {
        const json = await res.json();
        console.log('Elements count:', json.elements ? json.elements.length : 0);
        if (json.elements && json.elements.length > 0) {
          const sample = json.elements.filter(e => e.tags && e.tags.name);
          console.log('Named elements count:', sample.length);
          if (sample[0]) console.log('Sample tags:', sample[0].tags);
        }
        return;
      }
    } catch (e) {
      console.log(m, 'Error:', e.message);
    }
  }
}

run();
