import { Lead, EmailValidationStage } from '../types';
import { calculateLeadScore } from './scoringEngine';
import { validateEmailStage } from './contactValidationService';

export interface StartupSearchParams {
  stage: 'ALL' | 'PRE_SEED' | 'SEED' | 'SERIES_A' | 'PRODUCT_HUNT';
  projectNeed: 'ALL' | 'SAAS_MVP' | 'MOBILE_APP' | 'SPEED_PERFORMANCE';
  country: string;
  query?: string;
  limit?: number;
}

const SAMPLE_FUNDED_STARTUPS = [
  {
    name: 'NeuralPulse AI',
    domain: 'neuralpulse.ai',
    stage: 'SEED' as const,
    amount: '$1.8M',
    leadInvestor: 'Y Combinator & Pioneer Fund',
    country: 'United States',
    city: 'San Francisco, CA',
    founder: 'Arman Zadeh',
    role: 'Founder & CEO',
    email: 'arman@neuralpulse.ai',
    linkedin: 'https://linkedin.com/in/arman-zadeh-ai',
    projectNeed: 'SAAS_MVP' as const,
    description: 'AI-assisted code review copilot. Closed $1.8M Seed round. Actively hiring freelance fullstack dev to build customer billing and real-time dashboard analytics.',
    techNeeded: 'Next.js 14, FastAPI, PostgreSQL, TailwindCSS, Stripe'
  },
  {
    name: 'HyperFleet Logistics',
    domain: 'hyperfleet.co',
    stage: 'SERIES_A' as const,
    amount: '$4.2M',
    leadInvestor: 'Bessemer Venture Partners',
    country: 'United Kingdom',
    city: 'London',
    founder: 'Oliver Sterling',
    role: 'Co-Founder & Chief Product Officer',
    email: 'oliver@hyperfleet.co',
    linkedin: 'https://linkedin.com/in/oliver-sterling-fleet',
    projectNeed: 'MOBILE_APP' as const,
    description: 'B2B on-demand courier dispatch network. Urgent need for senior mobile engineer to build React Native driver app with offline map routing.',
    techNeeded: 'React Native, Mapbox, WebSockets, Node.js'
  },
  {
    name: 'SupabaseForm (Product Hunt #2 of the Day)',
    domain: 'supabaseform.dev',
    stage: 'PRODUCT_HUNT' as const,
    amount: 'Bootstrapped ($35k MRR)',
    leadInvestor: 'Self-Funded / Top Product Hunt',
    country: 'Canada',
    city: 'Vancouver',
    founder: 'Devin Zhao',
    role: 'Solo Founder',
    email: 'devin@supabaseform.dev',
    linkedin: 'https://linkedin.com/in/devin-zhao-builder',
    projectNeed: 'SAAS_MVP' as const,
    description: 'No-code dynamic forms for Supabase. Massive user surge after trending on Product Hunt. Needs contractor to build Zapier & Webhook integrations.',
    techNeeded: 'TypeScript, React, Supabase, Serverless Functions'
  },
  {
    name: 'FinFlow MENA',
    domain: 'finflow.ae',
    stage: 'SEED' as const,
    amount: '$2.4M',
    leadInvestor: 'Wamda Capital & Shorooq Partners',
    country: 'United Arab Emirates',
    city: 'Dubai',
    founder: 'Karim Al-Khatib',
    role: 'CEO & Founder',
    email: 'karim@finflow.ae',
    linkedin: 'https://linkedin.com/in/karim-alkhatib-fintech',
    projectNeed: 'SAAS_MVP' as const,
    description: 'Payroll & corporate expense cards for Gulf startups. Raised $2.4M. Hiring external agency/dev to build modern React executive dashboard.',
    techNeeded: 'React, TypeScript, Go API, AWS Microservices'
  },
  {
    name: 'VividCreator Studio',
    domain: 'vividcreator.app',
    stage: 'PRE_SEED' as const,
    amount: '$500k',
    leadInvestor: 'Techstars Accelerator',
    country: 'United States',
    city: 'New York, NY',
    founder: 'Sarah Jenkins',
    role: 'Founder & CEO',
    email: 'sarah@vividcreator.app',
    linkedin: 'https://linkedin.com/in/sarah-jenkins-creator',
    projectNeed: 'MOBILE_APP' as const,
    description: 'Mobile video editing workspace for TikTok & Reel creators. Looking for Flutter / Swift contractor to speed up iOS release candidate.',
    techNeeded: 'Flutter, Swift, Video Processing, Firebase'
  },
  {
    name: 'BioTrace Diagnostics',
    domain: 'biotrace.eu',
    stage: 'SEED' as const,
    amount: '$1.2M',
    leadInvestor: 'High-Tech Gründerfonds',
    country: 'Germany',
    city: 'Munich',
    founder: 'Dr. Lucas Bauer',
    role: 'Co-Founder & CTO',
    email: 'l.bauer@biotrace.eu',
    linkedin: 'https://linkedin.com/in/lucas-bauer-biotech',
    projectNeed: 'SPEED_PERFORMANCE' as const,
    description: 'Clinical laboratory cloud reporting software. Needing frontend architectural audit to speed up large dataset rendering.',
    techNeeded: 'React, Vite, Web Workers, Canvas Rendering'
  }
];

export class StartupFundingService {
  /**
   * Discovers recently funded startups & product launch leads
   */
  public async discoverFundedStartups(params: StartupSearchParams): Promise<Lead[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    let filtered = SAMPLE_FUNDED_STARTUPS.filter(s => {
      if (params.stage !== 'ALL' && s.stage !== params.stage) return false;
      if (params.projectNeed !== 'ALL' && s.projectNeed !== params.projectNeed) return false;
      if (params.country && params.country !== 'ALL' && !s.country.toLowerCase().includes(params.country.toLowerCase())) return false;
      if (params.query) {
        const q = params.query.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.domain.toLowerCase().includes(q) && !s.techNeeded.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });

    if (filtered.length === 0) {
      filtered = SAMPLE_FUNDED_STARTUPS;
    }

    const leads: Lead[] = filtered.map(s => {
      const emailValidation: EmailValidationStage = validateEmailStage(s.email);
      const id = `funded-${s.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

      const websiteAudit = {
        domain: s.domain,
        hasWebsite: true,
        hasMobileApp: s.projectNeed === 'MOBILE_APP' ? false : true,
        mobileFriendly: true,
        performanceScore: 82,
        hasHttps: true,
        hasModernUi: true,
        hasCta: true,
        hasContactForm: true,
        hasOnlineBooking: false,
        hasOnlineOrdering: false,
        opportunityScore: 95,
        issuesDetected: [
          `Recently Raised: ${s.amount} (${s.stage})`,
          `Lead Investor: ${s.leadInvestor}`,
          `Urgent Tech Stack Need: ${s.techNeeded}`
        ],
        aiOpportunityReason: `Startup has fresh cash injection of ${s.amount}. Urgently hiring technical firepower to build ${s.projectNeed}.`
      };

      const leadScore = calculateLeadScore({
        hasExplicitHiringSignal: true,
        hasBusinessQuality: true,
        websiteAudit,
        hasEmail: true,
        hasWhatsapp: false,
        hasSocialPresence: true,
        freshnessTier: 'JUST_NOW',
        isExpired: false
      });

      return {
        id,
        title: `${s.name} (Raised ${s.amount} • ${s.stage}) - ${s.projectNeed}`,
        description: `${s.description} Tech stack: ${s.techNeeded}`,
        source: 'FUNDED_STARTUP',
        sourceUrl: s.linkedin || `https://${s.domain}`,
        projectNeed: s.projectNeed,
        budgetSignal: `${s.amount} Funding (${s.stage})`,
        status: 'NEW',
        tags: ['FUNDED_STARTUP', s.stage, 'HIGH_BUDGET', 'ACTIVE_HIRING'],
        notes: [`Funding: ${s.amount} (${s.stage}). Backed by: ${s.leadInvestor}. Founder: ${s.founder} (${s.role})`],
        discoveredAt: new Date().toISOString(),
        postedAt: new Date().toISOString(),
        freshnessTier: 'JUST_NOW',
        isExpired: false,
        lastVerifiedAt: new Date().toISOString(),
        outreachHistory: [],

        company: {
          name: s.name,
          industry: 'Venture-Backed Tech',
          location: `${s.city}, ${s.country}`,
          country: s.country,
          city: s.city,
          websiteUrl: `https://${s.domain}`,
          socialPresence: true
        },

        contact: {
          personName: s.founder,
          role: s.role,
          email: s.email,
          emailValidationStage: emailValidation,
          phone: undefined,
          hasWhatsapp: false,
          linkedinUrl: s.linkedin,
          isPhoneVerified: false
        },

        scoreBreakdown: leadScore,
        websiteAudit,

        fundingInfo: {
          stage: s.stage,
          amountRaised: s.amount,
          leadInvestor: s.leadInvestor,
          launchDate: 'Recent'
        }
      };
    });

    return leads.slice(0, params.limit || 50);
  }
}

export const startupFundingService = new StartupFundingService();
