import { EmailValidationStage } from '../types';

export const COUNTRY_DIAL_CODES: Record<string, string> = {
  'afghanistan': '+93',
  'albania': '+355',
  'algeria': '+213',
  'andorra': '+376',
  'angola': '+244',
  'antigua and barbuda': '+1',
  'argentina': '+54',
  'armenia': '+374',
  'australia': '+61',
  'austria': '+43',
  'azerbaijan': '+994',

  'bahamas': '+1',
  'bahrain': '+973',
  'bangladesh': '+880',
  'barbados': '+1',
  'belarus': '+375',
  'belgium': '+32',
  'belize': '+501',
  'benin': '+229',
  'bhutan': '+975',
  'bolivia': '+591',
  'bosnia and herzegovina': '+387',
  'botswana': '+267',
  'brazil': '+55',
  'brunei': '+673',
  'bulgaria': '+359',
  'burkina faso': '+226',
  'burundi': '+257',

  'cabo verde': '+238',
  'cambodia': '+855',
  'cameroon': '+237',
  'canada': '+1',
  'central african republic': '+236',
  'chad': '+235',
  'chile': '+56',
  'china': '+86',
  'colombia': '+57',
  'comoros': '+269',
  'congo': '+242',
  'democratic republic of the congo': '+243',
  'costa rica': '+506',
  'croatia': '+385',
  'cuba': '+53',
  'cyprus': '+357',
  'czech republic': '+420',
  'czechia': '+420',

  'denmark': '+45',
  'djibouti': '+253',
  'dominica': '+1',
  'dominican republic': '+1',

  'ecuador': '+593',
  'egypt': '+20',
  'el salvador': '+503',
  'equatorial guinea': '+240',
  'eritrea': '+291',
  'estonia': '+372',
  'eswatini': '+268',
  'ethiopia': '+251',

  'fiji': '+679',
  'finland': '+358',
  'france': '+33',

  'gabon': '+241',
  'gambia': '+220',
  'georgia': '+995',
  'germany': '+49',
  'ghana': '+233',
  'greece': '+30',
  'grenada': '+1',
  'guatemala': '+502',
  'guinea': '+224',
  'guinea-bissau': '+245',
  'guyana': '+592',

  'haiti': '+509',
  'honduras': '+504',
  'hungary': '+36',

  'iceland': '+354',
  'india': '+91',
  'indonesia': '+62',
  'iran': '+98',
  'iraq': '+964',
  'ireland': '+353',
  'israel': '+972',
  'italy': '+39',

  'jamaica': '+1',
  'japan': '+81',
  'jordan': '+962',

  'kazakhstan': '+7',
  'kenya': '+254',
  'kiribati': '+686',
  'north korea': '+850',
  'south korea': '+82',
  'kuwait': '+965',
  'kyrgyzstan': '+996',

  'laos': '+856',
  'latvia': '+371',
  'lebanon': '+961',
  'lesotho': '+266',
  'liberia': '+231',
  'libya': '+218',
  'liechtenstein': '+423',
  'lithuania': '+370',
  'luxembourg': '+352',

  'madagascar': '+261',
  'malawi': '+265',
  'malaysia': '+60',
  'maldives': '+960',
  'mali': '+223',
  'malta': '+356',
  'marshall islands': '+692',
  'mauritania': '+222',
  'mauritius': '+230',
  'mexico': '+52',
  'micronesia': '+691',
  'moldova': '+373',
  'monaco': '+377',
  'mongolia': '+976',
  'montenegro': '+382',
  'morocco': '+212',
  'mozambique': '+258',
  'myanmar': '+95',

  'namibia': '+264',
  'nauru': '+674',
  'nepal': '+977',
  'netherlands': '+31',
  'new zealand': '+64',
  'nicaragua': '+505',
  'niger': '+227',
  'nigeria': '+234',
  'north macedonia': '+389',
  'norway': '+47',

  'oman': '+968',

  'pakistan': '+92',
  'palau': '+680',
  'palestine': '+970',
  'panama': '+507',
  'papua new guinea': '+675',
  'paraguay': '+595',
  'peru': '+51',
  'philippines': '+63',
  'poland': '+48',
  'portugal': '+351',

  'qatar': '+974',

  'romania': '+40',
  'russia': '+7',
  'rwanda': '+250',

  'saint kitts and nevis': '+1',
  'saint lucia': '+1',
  'saint vincent and the grenadines': '+1',
  'samoa': '+685',
  'san marino': '+378',
  'sao tome and principe': '+239',
  'saudi arabia': '+966',
  'senegal': '+221',
  'serbia': '+381',
  'seychelles': '+248',
  'sierra leone': '+232',
  'singapore': '+65',
  'slovakia': '+421',
  'slovenia': '+386',
  'solomon islands': '+677',
  'somalia': '+252',
  'south africa': '+27',
  'south sudan': '+211',
  'spain': '+34',
  'sri lanka': '+94',
  'sudan': '+249',
  'suriname': '+597',
  'sweden': '+46',
  'switzerland': '+41',
  'syria': '+963',

  'taiwan': '+886',
  'tajikistan': '+992',
  'tanzania': '+255',
  'thailand': '+66',
  'timor-leste': '+670',
  'togo': '+228',
  'tonga': '+676',
  'trinidad and tobago': '+1',
  'tunisia': '+216',
  'turkey': '+90',
  'turkmenistan': '+993',
  'tuvalu': '+688',

  'uganda': '+256',
  'ukraine': '+380',
  'united arab emirates': '+971',
  'united kingdom': '+44',
  'united states': '+1',
  'uruguay': '+598',
  'uzbekistan': '+998',

  'vanuatu': '+678',
  'vatican city': '+39',
  'venezuela': '+58',
  'vietnam': '+84',

  'yemen': '+967',

  'zambia': '+260',
  'zimbabwe': '+263',

  'usa': '+1',
  'us': '+1',
  'uk': '+44',
  'uae': '+971',
  'korea': '+82',
};

export function getCountryDialCode(countryName: string): string {
  if (!countryName) return '+1';
  const clean = countryName.trim().toLowerCase();
  for (const [key, code] of Object.entries(COUNTRY_DIAL_CODES)) {
    if (clean.includes(key)) return code;
  }
  return '+1';
}

export function getCountryTld(countryName: string): string {
  if (!countryName) return '.com';
  const clean = countryName.trim().toLowerCase();
  if (clean.includes('sweden')) return '.se';
  if (clean.includes('united kingdom') || clean === 'uk') return '.co.uk';
  if (clean.includes('germany')) return '.de';
  if (clean.includes('france')) return '.fr';
  if (clean.includes('pakistan')) return '.pk';
  if (clean.includes('united arab emirates') || clean === 'uae') return '.ae';
  if (clean.includes('saudi')) return '.sa';
  if (clean.includes('canada')) return '.ca';
  if (clean.includes('australia')) return '.com.au';
  if (clean.includes('italy')) return '.it';
  if (clean.includes('spain')) return '.es';
  if (clean.includes('netherlands')) return '.nl';
  if (clean.includes('norway')) return '.no';
  if (clean.includes('denmark')) return '.dk';
  if (clean.includes('finland')) return '.fi';
  if (clean.includes('switzerland')) return '.ch';
  if (clean.includes('austria')) return '.at';
  if (clean.includes('ireland')) return '.ie';
  if (clean.includes('poland')) return '.pl';
  if (clean.includes('portugal')) return '.pt';
  if (clean.includes('turkey')) return '.com.tr';
  if (clean.includes('brazil')) return '.com.br';
  if (clean.includes('india')) return '.in';
  if (clean.includes('qatar')) return '.qa';
  if (clean.includes('kuwait')) return '.kw';
  if (clean.includes('singapore')) return '.sg';
  if (clean.includes('malaysia')) return '.my';
  if (clean.includes('japan')) return '.jp';
  if (clean.includes('south korea') || clean.includes('korea')) return '.kr';
  return '.com';
}

/**
 * Multi-stage Email Validation Engine
 */
export function validateEmailStage(email?: string): EmailValidationStage {
  if (!email || email.trim().length === 0) return 'FOUND';

  const clean = email.trim().toLowerCase();

  // 1. Format check
  const formatRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!formatRegex.test(clean)) {
    return 'FOUND';
  }

  // 2. Domain check
  const parts = clean.split('@');
  if (parts.length !== 2) return 'FORMAT_VALID';
  const domain = parts[1];

  const validTlds = ['.com', '.org', '.net', '.edu', '.gov', '.io', '.se', '.uk', '.de', '.fr', '.us', '.co', '.pk', '.ae', '.sa', '.ca', '.au'];
  const hasValidTld = validTlds.some(tld => domain.endsWith(tld));
  if (!hasValidTld) return 'FORMAT_VALID';

  // 3. Disposable Email check
  const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'trashmail.com'];
  if (disposableDomains.includes(domain)) return 'DOMAIN_VALID';

  // 4. Known reliable mail providers or business domains
  if (
    domain.includes('google') || 
    domain.includes('gmail') || 
    domain.includes('outlook') || 
    domain.includes('hotmail') || 
    domain.includes('yahoo') ||
    domain.includes('proton') ||
    domain.includes('icloud')
  ) {
    return 'VERIFIED';
  }

  return 'MX_VALID';
}

/**
 * Phone Number Normalization & Country Code Formatter
 * Returns undefined if no real phone number exists (no fake 555 numbers)
 */
export function normalizePhoneNumber(rawPhone?: string, defaultCountryCode: string = '+1'): string | undefined {
  if (!rawPhone || rawPhone.trim().length === 0) {
    return undefined;
  }

  const trimmed = rawPhone.trim();

  // Remove non-digit characters except leading '+'
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (!digitsOnly || digitsOnly.length < 5) {
    return undefined;
  }

  if (hasPlus) {
    return `+${digitsOnly}`;
  }

  const cleanCode = defaultCountryCode.startsWith('+') ? defaultCountryCode : `+${defaultCountryCode}`;

  // If already starts with the country dial code digits without plus
  const codeDigits = cleanCode.replace(/\D/g, '');
  if (digitsOnly.startsWith(codeDigits) && digitsOnly.length > codeDigits.length + 6) {
    return `+${digitsOnly}`;
  }

  // If local number starts with leading 0 (e.g. 0300 in Pakistan or 020 in UK)
  const localDigits = digitsOnly.startsWith('0') ? digitsOnly.slice(1) : digitsOnly;

  return `${cleanCode} ${localDigits}`;
}

/**
 * Real Live DNS MX Record check via Google DNS-over-HTTPS (DoH)
 * Checks live global DNS servers for real Mail Exchange records in real time
 */
export async function checkDomainMxRecord(domain: string): Promise<boolean> {
  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '').trim();
    if (!cleanDomain || cleanDomain.length < 3 || cleanDomain.includes('localhost') || cleanDomain === 'none') {
      return false;
    }
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(cleanDomain)}&type=MX`);
    if (res.ok) {
      const data = await res.json();
      return Boolean(data && data.Answer && data.Answer.length > 0);
    }
  } catch {
    // Network or silent fallback
  }
  return false;
}

