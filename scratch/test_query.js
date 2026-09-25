async function test() {
  const res = await fetch('http://localhost:4001/api/live-smb?niche=' + encodeURIComponent('Plumbers & Heating Engineers') + '&city=Manchester&country=' + encodeURIComponent('United Kingdom') + '&limit=30');
  const data = await res.json();
  console.log('Total items returned:', data.items?.length);
  if (data.items) {
    data.items.forEach((it, idx) => {
      console.log(`[${idx+1}] ${it.name} | hasWebsite: ${it.hasWebsite} | websiteUrl: ${it.websiteUrl}`);
    });
  }
}
test();
