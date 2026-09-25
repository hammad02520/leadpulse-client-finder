import zlib from 'zlib';

async function find556() {
  console.log('Searching for 556/559 series in SCB stream...');
  const res = await fetch('https://huggingface.co/datasets/krafs/bolagsverket-arkiv/resolve/main/ra/scb_bulkfil/2026-09-21/scb_bulkfil.zip', {
    headers: { Range: 'bytes=0-20971520' } // 20MB
  });
  const buf = Buffer.from(await res.arrayBuffer());
  const fnLen = buf.readUInt16LE(26);
  const extraLen = buf.readUInt16LE(28);
  const compressed = buf.slice(30 + fnLen + extraLen);

  const inflate = zlib.createInflateRaw();
  let buffer = '';
  const series556 = [];

  inflate.on('data', chunk => {
    buffer += chunk.toString('latin1');
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const l of lines) {
      const parts = l.split('\t');
      if (parts.length < 16) continue;
      const peOrgNr = parts[13] ? parts[13].replace(/\D/g, '') : '';
      let cleanOrg = peOrgNr;
      if (cleanOrg.length === 12 && (cleanOrg.startsWith('16') || cleanOrg.startsWith('19') || cleanOrg.startsWith('20'))) {
        cleanOrg = cleanOrg.slice(2);
      }

      if (cleanOrg.startsWith('556') || cleanOrg.startsWith('559')) {
        const name = parts[7];
        const city = parts[15];
        const sni = parts[8];
        const sparr = parts[17];
        series556.push({ cleanOrg, name, city, sni, sparr });

        if (series556.length <= 15) {
          console.log(`556/559 Found: ${name} (${cleanOrg}) | ${city} | SNI: ${sni} | Sparr: ${sparr}`);
        }
      }
    }
  });

  inflate.on('error', () => {
    console.log(`Total 556/559 companies found in first 20MB: ${series556.length}`);
  });

  inflate.write(compressed);
}

find556().catch(console.error);
