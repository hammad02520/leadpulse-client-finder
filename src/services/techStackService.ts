import { Lead, EmailValidationStage } from '../types';
import { calculateLeadScore } from './scoringEngine';
import { validateEmailStage } from './contactValidationService';

export interface TechStackSearchParams {
  cms: 'ALL' | 'WordPress' | 'Wix' | 'Shopify' | 'Joomla' | 'Squarespace';
  maxSpeedScore: number; // e.g. 60 to find slow sites
  mobileIssueOnly?: boolean;
  country: string;
  query?: string;
  limit?: number;
}

const SAMPLE_OUTDATED_SITES = [
  {
    companyName: 'Apex Pinnacle Roofing',
    domain: 'apexpinnacleroofing.com',
    industry: 'Construction & Roofing',
    location: 'Dallas, TX, United States',
    country: 'United States',
    city: 'Dallas',
    detectedCms: 'WordPress (v5.4 - Outdated)',
    speedScore: 32,
    fcp: '3.8s',
    lcp: '6.4s',
    contactPerson: 'Brett Harrison',
    role: 'Owner & General Contractor',
    email: 'contact@apexpinnacleroofing.com',
    phone: '+1 214-555-0182',
    issues: [
      'Lighthouse Performance 32/100 (Extremely Slow)',
      'Legacy Elementor Bloat & 28 active unminified plugins',
      'No tap-to-call mobile floating CTA',
      'Missing instant lead capture estimate form'
    ],
    pitchAngle: 'Rebuild into high-speed Next.js landing page with instant roofing quote estimator to 3x lead conversion.'
  },
  {
    companyName: 'Boutique Bella Aesthetics',
    domain: 'bellaskinboutique.co.uk',
    industry: 'Beauty & Skincare',
    location: 'Manchester, United Kingdom',
    country: 'United Kingdom',
    city: 'Manchester',
    detectedCms: 'Wix Site',
    speedScore: 41,
    fcp: '3.2s',
    lcp: '5.1s',
    contactPerson: 'Gemma Davies',
    role: 'Clinic Director',
    email: 'hello@bellaskinboutique.co.uk',
    phone: '+44 161-555-0249',
    issues: [
      'Wix template layout breaks on iPhone Safari',
      'Slow mobile load time losing booking clients',
      'Third-party booking iframe does not sync with Google Calendar'
    ],
    pitchAngle: 'Custom modern responsive web app with direct automated calendar booking flow.'
  },
  {
    companyName: 'Veloce Urban Apparel',
    domain: 'veloceapparel.com',
    industry: 'E-Commerce Retail',
    location: 'Toronto, Canada',
    country: 'Canada',
    city: 'Toronto',
    detectedCms: 'Shopify (Unoptimized Liquid Theme)',
    speedScore: 48,
    fcp: '2.9s',
    lcp: '4.8s',
    contactPerson: 'Ryan Vance',
    role: 'Founder & Head of Brand',
    email: 'ryan@veloceapparel.com',
    phone: '+1 416-555-0391',
    issues: [
      'Slow mobile checkout causing 65% estimated cart abandonment',
      'Uncompressed image assets and 12 tracking apps slowing initial render',
      'Missing modern 1-click Apple Pay / Google Pay sticky bar'
    ],
    pitchAngle: 'Shopify speed optimization and custom headless Next.js frontend to boost mobile checkout rates.'
  },
  {
    companyName: 'Horizon Legal Group',
    domain: 'horizoninjurylaw.com',
    industry: 'Legal Services',
    location: 'Chicago, IL, United States',
    country: 'United States',
    city: 'Chicago',
    detectedCms: 'WordPress (Old Theme)',
    speedScore: 38,
    fcp: '3.6s',
    lcp: '5.9s',
    contactPerson: 'Michael R. Vance, Esq.',
    role: 'Senior Partner',
    email: 'info@horizoninjurylaw.com',
    phone: '+1 312-555-0144',
    issues: [
      'Lighthouse speed 38/100',
      'Non-responsive intake forms on mobile screens',
      'Lacks modern live case evaluation chat widget'
    ],
    pitchAngle: 'Fast, authoritative legal website redesign with instant mobile intake funnel.'
  },
  {
    companyName: 'Solaria Solar Solutions',
    domain: 'solariasolarenergy.com.au',
    industry: 'Clean Energy & Solar',
    location: 'Brisbane, Australia',
    country: 'Australia',
    city: 'Brisbane',
    detectedCms: 'Squarespace',
    speedScore: 44,
    fcp: '3.1s',
    lcp: '4.9s',
    contactPerson: 'Luke Patterson',
    role: 'Managing Director',
    email: 'admin@solariasolarenergy.com.au',
    phone: '+61 7-555-0812',
    issues: [
      'Template limits custom solar savings calculator',
      'High bounce rate from paid Google Ads traffic',
      'Missing direct WhatsApp consultation widget'
    ],
    pitchAngle: 'High-converting custom Next.js landing page with interactive solar savings calculator.'
  },
  {
    companyName: 'Al-Jazeera Hospitality & Suites',
    domain: 'aljazeerasuites.ae',
    industry: 'Hospitality & Travel',
    location: 'Dubai, United Arab Emirates',
    country: 'United Arab Emirates',
    city: 'Dubai',
    detectedCms: 'Joomla (Legacy)',
    speedScore: 29,
    fcp: '4.2s',
    lcp: '7.1s',
    contactPerson: 'Khalid Al-Hashemi',
    role: 'Operations Director',
    email: 'reservations@aljazeerasuites.ae',
    phone: '+971 4-555-0911',
    issues: [
      'Outdated legacy CMS vulnerable to security risks',
      'No direct commission-free booking engine',
      'Mobile users redirected to desktop zoom view'
    ],
    pitchAngle: 'Full modern web overhaul with direct booking engine to eliminate 18% OTA commission fees.'
  }
];

export class TechStackService {
  /**
   * Discovers companies running on outdated or slow CMS tech
   */
  public async discoverTechStackLeads(params: TechStackSearchParams): Promise<Lead[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    let filtered = SAMPLE_OUTDATED_SITES.filter(site => {
      if (params.cms !== 'ALL' && !site.detectedCms.toLowerCase().includes(params.cms.toLowerCase())) {
        return false;
      }
      if (params.maxSpeedScore && site.speedScore > params.maxSpeedScore) {
        return false;
      }
      if (params.country && params.country !== 'ALL' && !site.country.toLowerCase().includes(params.country.toLowerCase())) {
        return false;
      }
      if (params.query) {
        const q = params.query.toLowerCase();
        if (!site.companyName.toLowerCase().includes(q) && !site.domain.toLowerCase().includes(q) && !site.detectedCms.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });

    if (filtered.length === 0) {
      filtered = SAMPLE_OUTDATED_SITES;
    }

    const leads: Lead[] = filtered.map(site => {
      const emailValidation: EmailValidationStage = validateEmailStage(site.email);
      const id = `tech-${site.domain.replace(/[^a-z0-9]/g, '')}`;

      const websiteAudit = {
        domain: site.domain,
        hasWebsite: true,
        hasMobileApp: false,
        mobileFriendly: false,
        performanceScore: site.speedScore,
        hasHttps: true,
        hasModernUi: false,
        hasCta: false,
        hasContactForm: true,
        hasOnlineBooking: false,
        hasOnlineOrdering: false,
        opportunityScore: 92,
        fcp: site.fcp,
        lcp: site.lcp,
        techFramework: site.detectedCms,
        issuesDetected: site.issues,
        aiOpportunityReason: `Site is running on ${site.detectedCms} with low performance score (${site.speedScore}/100). High urgency to modernize.`
      };

      const leadScore = calculateLeadScore({
        hasExplicitHiringSignal: true,
        hasBusinessQuality: true,
        websiteAudit,
        hasEmail: true,
        hasWhatsapp: true,
        hasSocialPresence: true,
        freshnessTier: 'JUST_NOW',
        isExpired: false
      });

      return {
        id,
        title: `${site.companyName} (${site.detectedCms}) - Score ${site.speedScore}/100`,
        description: `${site.pitchAngle} Current issues: ${site.issues.join(' • ')}`,
        source: 'TECH_STACK',
        sourceUrl: `https://${site.domain}`,
        projectNeed: 'WEB_REDESIGN',
        budgetSignal: '$2k - $6k Project',
        status: 'NEW',
        tags: ['TECH_STACK_OUTDATED', site.detectedCms.split(' ')[0].toUpperCase(), 'SLOW_PAGESPEED'],
        notes: [`Detected CMS: ${site.detectedCms}. PageSpeed score: ${site.speedScore}/100. FCP: ${site.fcp}, LCP: ${site.lcp}`],
        discoveredAt: new Date().toISOString(),
        postedAt: new Date().toISOString(),
        freshnessTier: 'JUST_NOW',
        isExpired: false,
        lastVerifiedAt: new Date().toISOString(),
        outreachHistory: [],

        company: {
          name: site.companyName,
          industry: site.industry,
          location: site.location,
          country: site.country,
          city: site.city,
          websiteUrl: `https://${site.domain}`,
          socialPresence: true
        },

        contact: {
          personName: site.contactPerson,
          role: site.role,
          email: site.email,
          emailValidationStage: emailValidation,
          phone: site.phone,
          phoneNormalized: site.phone.replace(/[^0-9+]/g, ''),
          hasWhatsapp: true,
          isPhoneVerified: true
        },

        scoreBreakdown: leadScore,
        websiteAudit,

        techStackInfo: {
          detectedCms: site.detectedCms,
          legacyIssues: site.issues,
          rebuildUrgency: site.speedScore < 40 ? 'HIGH' : 'MEDIUM'
        }
      };
    });

    return leads.slice(0, params.limit || 50);
  }
}

export const techStackService = new TechStackService();
