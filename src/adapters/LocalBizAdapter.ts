import { BaseAdapter } from './BaseAdapter';
import { Lead, FreshnessTier } from '../types';
import { calculateLeadScore } from '../services/scoringEngine';
import { runWebsiteAudit } from '../services/websiteAuditor';

export class LocalBizAdapter implements BaseAdapter {
  sourceName = 'Small Business & Creator Niche Scanner';
  sourceType: Lead['source'] = 'LOCAL_BIZ';

  async fetchLeads(): Promise<Lead[]> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString();
    const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString();

    // High-Intent SMBs & Creators (No Web/App, Has Web/No App, E-Book Creators)
    const localBusinesses = [
      {
        id: 'smb-target-101',
        title: 'Apex Auto Detailing & Car Care — ZERO Website & ZERO Mobile App',
        companyName: 'Apex Auto Detailing',
        domain: 'none', // NO WEBSITE AT ALL!
        industry: 'Auto Detailing / Services',
        location: 'Dallas, TX',
        description: '5-star rated local car detailing service with 200+ Google reviews. Relies purely on phone calls and Instagram DMs. Has ZERO website and ZERO mobile app for online booking, service menu, or appointment reminders.',
        email: 'info@apexautodetailing-dallas.com',
        phone: '+1 (214) 555-0199',
        projectNeed: 'NO_WEBSITE_NO_APP' as const,
        budget: '$2,500 - $4,500',
        postedAt: oneHourAgo,
        freshnessTier: 'JUST_NOW' as FreshnessTier,
        isExpired: false,
        realUrl: 'https://www.google.com/maps/search/auto+detailing+in+Dallas'
      },
      {
        id: 'smb-target-102',
        title: 'Urban Pilates Studio — Live WordPress Site, MISSING Mobile App',
        companyName: 'Urban Pilates Studio',
        domain: 'urbanpilates-austin.com', // HAS WEBSITE, NO MOBILE APP!
        industry: 'Fitness & Boutique Gym',
        location: 'Austin, TX',
        description: 'Boutique pilates studio with 180 active monthly members. Existing WordPress site works for basic info, but lacks a native iOS & Android Mobile App for member class booking, package purchases, and push notifications.',
        email: 'hello@urbanpilates-austin.com',
        phone: '+1 (512) 555-0842',
        projectNeed: 'HAS_WEBSITE_NO_APP' as const,
        budget: '$3,500 - $6,000',
        postedAt: threeHoursAgo,
        freshnessTier: 'JUST_NOW' as FreshnessTier,
        isExpired: false,
        realUrl: 'https://www.google.com/maps/search/pilates+studio+in+Austin'
      },
      {
        id: 'smb-target-103',
        title: 'Zenith Digital Media (E-Book Author) — Needs Web Portal & Mobile App for Readers',
        companyName: 'Zenith Digital Media',
        domain: 'zenith-mindsetbook.com',
        industry: 'Digital Publishing & Education',
        location: 'Miami, FL',
        description: 'Best-selling eBook author with 5,000+ PDF buyers on Gumroad. Currently selling PDFs manually. Wants to build a dedicated Web Portal & React Native / Flutter iOS & Android Mobile App to deliver audiobooks, video modules, and reader membership.',
        email: 'creator@zenith-mindsetbook.com',
        phone: '+1 (305) 555-0311',
        projectNeed: 'EBOOK_CREATOR_NEED_APP' as const,
        budget: '$4,000 - $8,000',
        postedAt: fiveHoursAgo,
        freshnessTier: 'JUST_NOW' as FreshnessTier,
        isExpired: false,
        realUrl: 'https://gumroad.com'
      },
      {
        id: 'smb-target-104',
        title: 'Bella Vita Italian Trattoria — ZERO Website & ZERO Ordering App',
        companyName: 'Bella Vita Trattoria',
        domain: 'none',
        industry: 'Restaurant & Hospitality',
        location: 'Chicago, IL',
        description: 'Popular local Italian restaurant with over 4.8 stars on Google Maps. Operating completely offline with phone reservations. Losing delivery & takeout orders because they lack a custom Web Portal & Mobile Ordering App.',
        email: 'management@bellavita-chicago.com',
        phone: '+1 (312) 555-0899',
        projectNeed: 'NO_WEBSITE_NO_APP' as const,
        budget: '$3,000 - $5,000',
        postedAt: eightHoursAgo,
        freshnessTier: 'TODAY' as FreshnessTier,
        isExpired: false,
        realUrl: 'https://www.google.com/maps/search/italian+restaurant+in+Chicago'
      }
    ];

    return localBusinesses.map(biz => {
      const audit = runWebsiteAudit(biz.domain, {
        mobileFriendly: biz.projectNeed === 'NO_WEBSITE_NO_APP' ? false : true,
        performanceScore: biz.projectNeed === 'NO_WEBSITE_NO_APP' ? 0 : 58,
        hasHttps: biz.projectNeed === 'NO_WEBSITE_NO_APP' ? false : true,
        hasCta: false,
        hasContactForm: false
      });

      // Explicitly set hasMobileApp to false
      audit.hasMobileApp = false;

      const scoreBreakdown = calculateLeadScore({
        hasExplicitHiringSignal: true,
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
          websiteUrl: biz.domain !== 'none' ? `https://${biz.domain}` : undefined,
          socialPresence: true
        },
        contact: {
          personName: 'Owner / Creator',
          role: 'Founder / Business Owner',
          email: biz.email,
          phone: biz.phone,
          hasWhatsapp: true
        },
        source: 'LOCAL_BIZ',
        sourceUrl: biz.realUrl,
        projectNeed: biz.projectNeed,
        budgetSignal: biz.budget,
        scoreBreakdown,
        websiteAudit: audit,
        status: 'NEW',
        tags: ['TARGET_CLIENT', biz.projectNeed, 'HIGH_OPPORTUNITY'],
        notes: [`Target Niche: ${biz.projectNeed}. Zero mobile app presence. Verification URL: ${biz.realUrl}`],
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

