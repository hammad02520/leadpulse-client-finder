import zlib from 'zlib';

async function checkReklamsparr() {
  const res = await fetch('https://huggingface.co/datasets/krafs/bolagsverket-arkiv/resolve/main/ra/scb_bulkfil/2026-09-21/scb_bulkfil.zip', {
    headers: { Range: 'bytes=0-15728640' }
  });
  const buf = Buffer.from(await res.arrayBuffer());
  const fnLen = buf.readUInt16LE(26);
  const extraLen = buf.readUInt16LE(28);
  const compressed = buf.slice(30 + fnLen + extraLen);

  const inflate = zlib.createInflateRaw();
  let buffer = '';
  let countBlocked = 0;
  let countUnblocked = 0;
  const unblockedSamples = [];

  inflate.on('data', chunk => {
    buffer += chunk.toString('latin1');
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const l of lines) {
      const parts = l.split('\t');
      if (parts.length < 18) continue;
      const jurForm = parts[6];
      const name = parts[7];
      const sparr = parts[17];
      const isAB = jurForm === '41' || jurForm === '42' || jurForm === '49' || (name && name.toUpperCase().endsWith(' AB'));

      if (isAB && name) {
        if (sparr === '1') {
          countBlocked++;
        } else {
          countUnblocked++;
          if (unblockedSamples.length < 10) {
            unblockedSamples.push({ name, sparr, ort: parts[15] });
          }
        }
      }
    }
  });

  inflate.on('error', () => {
    console.log(`Results: Blocked: ${countBlocked} | Unblocked: ${countUnblocked}`);
    console.log('Unblocked samples:', unblockedSamples);
  });

  inflate.write(compressed);
}

checkReklamsparr().catch(console.error);
