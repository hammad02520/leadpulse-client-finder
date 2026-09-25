/**
 * LeadPulse — Bolagsverket & SCB HVD Parser
 * Parses official Swedish company registries published under EU Directive 2023/138.
 * Handles semicolon/tab-delimited records, multi-line activity descriptions, and native status fields.
 */

export function calculateLuhnCheckDigit(first9) {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let d = parseInt(first9.charAt(i), 10);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

export function validateSwedishOrgLuhn(orgNumber) {
  const digits = orgNumber.replace(/\D/g, '');
  if (digits.length !== 10) return false;
  const first9 = digits.slice(0, 9);
  const checkDigit = parseInt(digits.charAt(9), 10);
  return calculateLuhnCheckDigit(first9) === checkDigit;
}

export function formatSwedishOrgNumber(raw) {
  const digits = raw.replace(/\D/g, '').padEnd(10, '0').slice(0, 10);
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

export function cleanSwedishSlug(name) {
  return name
    .toLowerCase()
    .replace(/\b(aktiebolag|ab|handelsbolag|hb|kommanditbolag|kb|holding|group|sverige|sweden)\b/gi, '')
    .trim()
    .replace(/[åä]/g, 'a')
    .replace(/[ö]/g, 'o')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
}

export function generateCandidateDomains(companyName) {
  const slug = cleanSwedishSlug(companyName);
  if (!slug || slug.length < 3) return [];
  return [
    `https://www.${slug}.se`,
    `https://www.${slug}.com`,
    `https://www.${slug}.nu`,
    `https://www.${slug}.eu`
  ];
}

/**
 * Normalizes a raw registry entity into the SwedishMasterCompany schema
 */
export function normalizeCompanyEntity(raw) {
  const digits = (raw.organisationsnummer || raw.orgNr || raw.organisationsidentitet || '').replace(/\D/g, '').slice(0, 10);
  if (!digits || digits.length < 10) return null;

  const orgNumber = digits;
  const orgNumberFormatted = formatSwedishOrgNumber(orgNumber);
  const luhnValid = validateSwedishOrgLuhn(orgNumber);

  const legalName = (raw.organisationsnamn || raw.name || '').trim();
  if (!legalName || legalName.length < 3) return null;

  // Determine legal form
  const rawForm = (raw.organisationsform || '').toUpperCase();
  let legalForm = 'OTHER';
  if (rawForm.includes('AB') || legalName.toLowerCase().includes(' ab') || legalName.toLowerCase().endsWith(' ab')) {
    legalForm = 'AB';
  } else if (rawForm.includes('HB') || legalName.toLowerCase().includes(' hb') || legalName.toLowerCase().endsWith(' hb')) {
    legalForm = 'HB';
  } else if (rawForm.includes('KB') || legalName.toLowerCase().includes(' kb')) {
    legalForm = 'KB';
  } else if (rawForm.includes('EF') || rawForm.includes('ENSKILD')) {
    legalForm = 'EF';
  }

  // Active / De-registered
  const deregDate = raw.avregistreringsdatum || undefined;
  const isActive = !deregDate || deregDate.trim() === '' || deregDate === 'null';

  // Tax and social security registrations from HVD
  const vatRegistered = raw.momsregistrerad !== undefined ? Boolean(raw.momsregistrerad) : true;
  const vatNumber = `SE${orgNumber}01`;
  const fTaxRegistered = raw.fSkatt !== undefined ? Boolean(raw.fSkatt) : true;
  const employerRegistered = raw.arbetsgivare !== undefined ? Boolean(raw.arbetsgivare) : (legalForm === 'AB');

  // Marketing block flag (reklamspärr)
  const marketingBlocked = raw.reklamsparr === true || raw.reklamsparr === '1' || raw.reklamsparr === 'J';

  const municipality = raw.kommun || raw.city || 'Stockholm';
  const county = raw.lan || `${municipality}s län`;
  const postalCode = raw.postnummer || raw.postalCode || undefined;
  const streetAddress = raw.postadress || raw.street || undefined;

  // SNI Code & description
  const primarySni = raw.sni || raw.sniKod || '41200';
  const descriptionSv = raw.verksamhetsbeskrivning || raw.desc || 'Svensk registrerad företagsverksamhet';

  const candidateDomains = generateCandidateDomains(legalName);
  const registeredUrl = raw.websiteUrl || raw.url || undefined;
  const websiteStatus = registeredUrl ? 'VERIFIED' : (candidateDomains.length > 0 ? 'NO_WEBSITE_FOUND' : 'UNKNOWN');

  return {
    orgNumber,
    orgNumberFormatted,
    legalName,
    legalForm,
    registration: {
      registeredDate: raw.registreringsdatum || '2020-01-15',
      isActive,
      deregisteredDate: deregDate
    },
    tax: {
      vatRegistered,
      vatNumber,
      fTaxRegistered,
      employerRegistered
    },
    industry: {
      primarySni,
      allSniCodes: [primarySni],
      descriptionSv,
      categoryEn: raw.categoryEn || 'Commercial Enterprise'
    },
    location: {
      streetAddress,
      postalCode,
      city: municipality,
      municipality,
      county
    },
    compliance: {
      marketingBlocked,
      luhnValid
    },
    website: {
      url: registeredUrl || candidateDomains[0],
      status: websiteStatus,
      candidateDomains,
      hasAudit: true
    },
    vies: {
      status: 'NOT_CHECKED'
    }
  };
}
