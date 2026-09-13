import { EmailValidationStage } from '../types';

export const COUNTRY_DIAL_CODES: Record<string, string> = {
  'pakistan': '+92',
  'united states': '+1',
  'usa': '+1',
  'united kingdom': '+44',
  'uk': '+44',
  'united arab emirates': '+971',
  'uae': '+971',
  'saudi arabia': '+966',
  'canada': '+1',
  'germany': '+49',
  'australia': '+61',
  'sweden': '+46',
  'france': '+33',
  'india': '+91',
  'turkey': '+90',
  'italy': '+39',
  'spain': '+34',
  'netherlands': '+31',
  'brazil': '+55'
};

export function getCountryDialCode(countryName: string): string {
  if (!countryName) return '+1';
  const clean = countryName.trim().toLowerCase();
  for (const [key, code] of Object.entries(COUNTRY_DIAL_CODES)) {
    if (clean.includes(key)) return code;
  }
  return '+1';
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

