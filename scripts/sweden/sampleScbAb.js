import zlib from 'zlib';

async function sampleScbAb() {
  console.log('Searching for Aktiebolag (AB) in SCB bulk stream...');
  const res = await fetch('https://huggingface.co/datasets/krafs/bolagsverket-arkiv/resolve/main/ra/scb_bulkfil/2026-09-21/scb_bulkfil.zip', {
    headers: { Range: 'bytes=0-10485760' } // 10MB
  });
  const buf = Buffer.from(await res.arrayBuffer());
  const fnLen = buf.readUInt16LE(26);
  const extraLen = buf.readUInt16LE(28);
  const compressed = buf.slice(30 + fnLen + extraLen);

  const inflate = zlib.createInflateRaw();
  let buffer = '';
  const abCompanies = [];

  inflate.on('data', chunk => {
    buffer += chunk.toString('latin1');
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length < 16) continue;

      const jurForm = parts[6]; // JurForm: 41, 42, 49 is AB, 31 is HB
      const name = parts[7]; // Namn
      const sni = parts[8]; // Ng1 (SNI code)
      const peOrgNr = parts[13]; // PeOrgNr (12 digits, e.g. 165561234567 or 5561234567)
      const postNr = parts[14];
      const postOrt = parts[15];
      const street = parts[4];
      const reklamsparr = parts[17] === '1';

      // 41/42/49 = Aktiebolag, 31 = Handelsbolag
      const isAB = jurForm === '41' || jurForm === '42' || jurForm === '49' || name.toUpperCase().endsWith(' AB');
      const isHB = jurForm === '31' || jurForm === '32' || name.toUpperCase().endsWith(' HB');

      if ((isAB || isHB) && name && name.length > 3) {
        // Normalize 10-digit org number: PeOrgNr often has century prefix (e.g. 16556... -> 556...)
        let cleanOrg = peOrgNr ? peOrgNr.replace(/\D/g, '') : '';
        if (cleanOrg.length === 12 && (cleanOrg.startsWith('16') || cleanOrg.startsWith('19') || cleanOrg.startsWith('20'))) {
          cleanOrg = cleanOrg.slice(2);
        }

        if (cleanOrg.length === 10) {
          abCompanies.push({
            cleanOrg,
            name,
            form: isAB ? 'AB' : 'HB',
            sni,
            street,
            postNr,
            postOrt,
            reklamsparr
          });

          if (abCompanies.length <= 10) {
            console.log(`Found: [${isAB ? 'AB' : 'HB'}] ${name} | Org.nr: ${cleanOrg} | Ort: ${postOrt} | SNI: ${sni} | Reklamspärr: ${reklamsparr}`);
          }
        }
      }
    }
  });

  inflate.on('error', () => {
    console.log(`Finished chunk. Total companies parsed: ${abCompanies.length}`);
  });

  inflate.write(compressed);
}

sampleScbAb().catch(console.error);
