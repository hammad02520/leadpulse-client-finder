const isSocialOrDirectory = (url) => {
  if (!url) return true;
  const u = url.toLowerCase();
  return [
    'facebook.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'tiktok.com',
    'linkedin.com',
    'checkatrade.com',
    'yell.com',
    'yelp.com',
    'bark.com',
    'trustatrader.com',
    'mybuilder.com',
    'gumtree.com',
    'yellowpages.com'
  ].some(domain => u.includes(domain));
};

async function test() {
  const res = await fetch('http://localhost:4001/api/live-smb?niche=' + encodeURIComponent('Plumbers & Heating Engineers') + '&city=Manchester&country=' + encodeURIComponent('United Kingdom') + '&limit=30');
  const data = await res.json();
  console.log('Total items:', data.items?.length);
  data.items.forEach((it, idx) => {
    const isSoc = isSocialOrDirectory(it.websiteUrl);
    const hasRealWebsite = it.hasWebsite && it.websiteUrl && !isSoc;
    console.log(`[${idx+1}] ${it.name} | Has Real Website: ${hasRealWebsite} | Is Social/Directory: ${isSoc} | URL: ${it.websiteUrl || 'NONE'}`);
  });
}
test();
