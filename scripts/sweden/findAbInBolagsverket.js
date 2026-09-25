import zlib from 'zlib';

async function findAb() {
  console.log('Searching for 556/559 (AB) series in Bolagsverket bulk stream...');
  // Let's stream a larger chunk, e.g. 25MB
  const res = await fetch('https://huggingface.co/datasets/krafs/bolagsverket-arkiv/resolve/main/ra/bolagsverket_bulkfil/2026-09-21/bolagsverket_bulkfil.zip', {
    headers: { Range: 'bytes=0-26214400' } // 25MB
  });
  const buf = Buffer.from(await res.arrayBuffer());
  const fnLen = buf.readUInt16LE(26);
  const extraLen = buf.readUInt16LE(28);
  const compressed = buf.slice(30 + fnLen + extraLen);

  const inflate = zlib.createInflateRaw();
  let lineCount = 0;
  let abFound = 0;
  let hbFound = 0;
  let buffer = '';

  inflate.on('data', chunk => {
    buffer += chunk.toString('utf8');
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    lineCount += lines.length;

    for (const l of lines) {
      if (l.includes(';\"AB-ORGFO\";') || l.includes(';\"556') || l.includes(';\"559')) {
        abFound++;
        if (abFound <= 5) {
          console.log('Found AB:', l.slice(0, 120));
        }
      }
      if (l.includes(';\"HB-ORGFO\";') || l.includes(';\"916') || l.includes(';\"969')) {
        hbFound++;
      }
    }
  });

  inflate.on('end', () => {
    console.log(`Finished chunk. Total lines: ${lineCount} | AB count: ${abFound} | HB count: ${hbFound}`);
  });

  inflate.write(compressed);
  inflate.end();
}

findAb().catch(console.error);
