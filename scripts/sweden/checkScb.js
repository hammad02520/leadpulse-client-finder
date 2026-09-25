import zlib from 'zlib';

async function checkScb() {
  console.log('Checking SCB bulk file header...');
  const res = await fetch('https://huggingface.co/datasets/krafs/bolagsverket-arkiv/resolve/main/ra/scb_bulkfil/2026-09-21/scb_bulkfil.zip', {
    headers: { Range: 'bytes=0-1000' }
  });
  const buf = Buffer.from(await res.arrayBuffer());
  const fnLen = buf.readUInt16LE(26);
  const filename = buf.slice(30, 30 + fnLen).toString('utf8');
  console.log('SCB Filename in zip:', filename);
}

checkScb().catch(console.error);
