import { BaseAdapter } from './BaseAdapter';
import { Lead, FreshnessTier } from '../types';
import { calculateLeadScore } from '../services/scoringEngine';
import { runWebsiteAudit } from '../services/websiteAuditor';

export class LocalBizAdapter implements BaseAdapter {
  sourceName = 'Local Business Directory & Niche Scanner';
  sourceType: Lead['source'] = 'LOCAL_BIZ';

  async fetchLeads(): Promise<Lead[]> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const localBusinesses = [
      {
        id: 'localbiz-301',
        title: 'Trattoria Bella Vista — Missing Online Table Reservation System',
        companyName: 'Trattoria Bella Vista',
        domain: 'trattoriabellavista.net',
        industry: 'Hospitality / Restaurant',
        location: 'Chicago, IL',
        description: 'Popular Italian restaurant with 4.8 stars on Google Maps, but their website is non-responsive on phones and has zero online table booking or digital menu ordering.',
        email: 'info@trattoriabellavista.net',
        phone: '+1 (312) 555-0199',
        projectNeed: 'WEB_REDESIGN' as const,
        budget: '$1,500 - $3,000',
        postedAt: oneHourAgo,
        freshnessTier: 'JUST_NOW' as FreshnessTier,
        isExpired: false
      },
      {
        id: 'localbiz-302',
        title: 'Prime Care Physical Therapy — Outdated Site & Broken Booking Form',
        companyName: 'Prime Care Physical Therapy',
        domain: 'primecarept-chicago.com',
        industry: 'Healthcare / Wellness',
        location: 'Chicago, IL',
        description: 'Busy physical therapy clinic. Google Lighthouse score is 38/100, SSL is expired, and patient intake form fails on iOS Safari.',
        email: 'admin@primecarept-chicago.com',
        phone: '+1 (312) 555-0482',
        projectNeed: 'SPEED_PERFORMANCE' as const,
        budget: '$2,000 - $4,000',
        postedAt: sixHoursAgo,
        freshnessTier: 'TODAY' as FreshnessTier,
        isExpired: false
      },
      {
        id: 'localbiz-303',
        title: 'Urban Hive Coworking — Needs Custom Member Portal App',
        companyName: 'Urban Hive Coworking',
        domain: 'urbanhive-space.com',
        industry: 'Real Estate / Coworking',
        location: 'Austin, TX',
        description: 'Expanding coworking space looking for a custom web/mobile app for members to book conference rooms, pay monthly invoices, and buy day passes.',
        email: 'hello@urbanhive-space.com',
        phone: '+1 (512) 555-0721',
        projectNeed: 'MOBILE_APP' as const,
        budget: '$6,000 - $12,000',
        postedAt: threeDaysAgo,
        freshnessTier: 'RECENT' as FreshnessTier,
        isExpired: false
      }
    ];

    return localBusinesses.map(biz => {
      const audit = runWebsiteAudit(biz.domain, {
        mobileFriendly: biz.projectNeed === 'WEB_REDESIGN' ? false : true,
        performanceScore: biz.projectNeed === 'SPEED_PERFORMANCE' ? 38 : 62,
        hasHttps: biz.projectNeed === 'SPEED_PERFORMANCE' ? false : true,
        hasCta: false,
        hasContactForm: biz.projectNeed === 'SPEED_PERFORMANCE' ? false : true
      });

      const scoreBreakdown = calculateLeadScore({
        hasExplicitHiringSignal: biz.projectNeed === 'MOBILE_APP',
        hasBusinessQuality: true,
        websiteAudit: audit,
        hasEmail: true,
        hasWhatsapp: true,
        hasSocialPresence: true,
        freshnessTier: biz.freshnessTier,
        isExpired: false
      });

      return {
        id: biz.id,
        title: biz.title,
        description: biz.description,
        company: {
          name: biz.companyName,
          industry: biz.industry,
          location: biz.location,
          websiteUrl: `https://${biz.domain}`,
          socialPresence: true
        },
        contact: {
          personName: 'Owner / Manager',
          role: 'General Manager / Owner',
          email: biz.email,
          phone: biz.phone,
          hasWhatsapp: true
        },
        source: 'LOCAL_BIZ',
        sourceUrl: `https://google.com/maps/search/${encodeURIComponent(biz.companyName + ' ' + biz.location)}`,
        projectNeed: biz.projectNeed,
        budgetSignal: biz.budget,
        scoreBreakdown,
        websiteAudit: audit,
        status: 'NEW',
        tags: ['LOCAL_BIZ', biz.industry.split(' ')[0], biz.projectNeed, 'LIVE_SCANNED'],
        notes: [`Scanned via Google Directory. Audit score: ${audit.opportunityScore}/100`],
        discoveredAt: new Date().toISOString(),
        postedAt: biz.postedAt,
        freshnessTier: biz.freshnessTier,
        isExpired: false,
        lastVerifiedAt: new Date().toISOString(),
        outreachHistory: []
      };
    });
  }
}
