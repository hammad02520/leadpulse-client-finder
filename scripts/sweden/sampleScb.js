import zlib from 'zlib';

async function sampleScb() {
  const res = await fetch('https://huggingface.co/datasets/krafs/bolagsverket-arkiv/resolve/main/ra/scb_bulkfil/2026-09-21/scb_bulkfil.zip', {
    headers: { Range: 'bytes=0-1048576' }
  });
  const buf = Buffer.from(await res.arrayBuffer());
  const fnLen = buf.readUInt16LE(26);
  const extraLen = buf.readUInt16LE(28);
  const compressed = buf.slice(30 + fnLen + extraLen);

  const inflate = zlib.createInflateRaw();
  let decompressed = '';
  inflate.on('data', chunk => {
    decompressed += chunk.toString('latin1'); // SCB is ISO-8859-1 (latin1)
    if (decompressed.length > 3000) {
      inflate.destroy();
      console.log('--- SCB BULK FIRST 2000 CHARACTERS ---');
      console.log(decompressed.slice(0, 2000));
    }
  });
  inflate.on('error', () => {});
  inflate.write(compressed);
}

sampleScb().catch(console.error);
