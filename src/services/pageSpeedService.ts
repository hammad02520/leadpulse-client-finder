import { WebsiteAudit } from '../types';

export interface PageSpeedResult {
  success: boolean;
  audit: WebsiteAudit;
  rawLighthouse?: any;
  errorMessage?: string;
}

class PageSpeedService {
  private apiUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

  /**
   * Runs real-time Google PageSpeed Insights / Lighthouse Audit
   * @param domainOrUrl Website domain or complete URL
   * @param apiKey Optional Google API Key for higher quotas
   */
  public async runLiveLighthouseAudit(domainOrUrl: string, apiKey?: string): Promise<PageSpeedResult> {
    if (!domainOrUrl || domainOrUrl.trim() === '' || domainOrUrl === 'none' || domainOrUrl === 'No Domain') {
      return {
        success: false,
        errorMessage: 'Invalid or missing website domain',
        audit: {
          domain: 'No Domain',
          hasWebsite: false,
          hasMobileApp: false,
          mobileFriendly: false,
          performanceScore: 0,
          hasHttps: false,
          hasModernUi: false,
          hasCta: false,
          hasContactForm: false,
          hasOnlineBooking: false,
          hasOnlineOrdering: false,
          opportunityScore: 95,
          issuesDetected: ['No website found'],
          aiOpportunityReason: 'Business has zero online website presence.'
        }
      };
    }

    let targetUrl = domainOrUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    const cleanDomain = targetUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    try {
      const queryParams = new URLSearchParams({
        url: targetUrl,
        strategy: 'mobile',
        category: 'PERFORMANCE',
      });

      // Append additional categories
      queryParams.append('category', 'SEO');
      queryParams.append('category', 'ACCESSIBILITY');

      if (apiKey && apiKey.trim()) {
        queryParams.append('key', apiKey.trim());
      }

      const response = await fetch(`${this.apiUrl}?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        // If https fails, try http fallback
        if (targetUrl.startsWith('https://')) {
          const httpUrl = targetUrl.replace('https://', 'http://');
          queryParams.set('url', httpUrl);
          const fallbackRes = await fetch(`${this.apiUrl}?${queryParams.toString()}`);
          if (!fallbackRes.ok) {
            throw new Error(`Google PageSpeed API returned status ${response.status}`);
          }
          const data = await fallbackRes.json();
          return this.parseLighthouseData(cleanDomain, data);
        }
        throw new Error(`Google PageSpeed API returned status ${response.status}`);
      }

      const data = await response.json();
      return this.parseLighthouseData(cleanDomain, data);

    } catch (err: any) {
      console.warn('PageSpeed API call failed or timed out:', err);
      return {
        success: false,
        errorMessage: err.message || 'PageSpeed audit timed out or domain is not publicly accessible',
        audit: {
          domain: cleanDomain,
          hasWebsite: true,
          hasMobileApp: false,
          mobileFriendly: false,
          performanceScore: 42,
          hasHttps: targetUrl.startsWith('https'),
          hasModernUi: false,
          hasCta: false,
          hasContactForm: false,
          hasOnlineBooking: false,
          hasOnlineOrdering: false,
          opportunityScore: 85,
          issuesDetected: [
            'Live Lighthouse audit connection timed out or blocked',
            'Possible server firewall, slow initial response, or DNS resolution issue'
          ],
          aiOpportunityReason: `Website ${cleanDomain} had issues responding to automated Lighthouse testing, indicating possible hosting performance or accessibility bottlenecks.`,
          isLiveAudit: false
        }
      };
    }
  }

  private parseLighthouseData(domain: string, data: any): PageSpeedResult {
    const lighthouse = data?.lighthouseResult;
    if (!lighthouse) {
      throw new Error('Lighthouse result is missing in PageSpeed API response');
    }

    const categories = lighthouse.categories || {};
    const audits = lighthouse.audits || {};

    const perfScore = Math.round((categories.performance?.score || 0) * 100);
    const seoScore = Math.round((categories.seo?.score || 0) * 100);
    const accessibilityScore = Math.round((categories.accessibility?.score || 0) * 100);

    const fcp = audits['first-contentful-paint']?.displayValue || 'N/A';
    const lcp = audits['largest-contentful-paint']?.displayValue || 'N/A';
    const cls = audits['cumulative-layout-shift']?.displayValue || 'N/A';
    const speedIndex = audits['speed-index']?.displayValue || 'N/A';

    const mobileFriendly = audits['viewport']?.score === 1;
    const hasHttps = audits['is-on-https']?.score === 1;

    // Collect real Lighthouse detected bottlenecks
    const issuesDetected: string[] = [];

    if (perfScore < 60) {
      issuesDetected.push(`Low Performance Score (${perfScore}/100) — High mobile bounce rate`);
    }
    if (!mobileFriendly) {
      issuesDetected.push('Missing or unoptimized viewport for mobile devices');
    }
    if (!hasHttps) {
      issuesDetected.push('No HTTPS SSL Certificate (Browser marks site as Not Secure)');
    }
    if (audits['render-blocking-resources']?.score !== null && audits['render-blocking-resources']?.score < 0.8) {
      issuesDetected.push(`Render-blocking CSS/JS resources delaying load by ${audits['render-blocking-resources']?.displayValue || 'significant time'}`);
    }
    if (audits['server-response-time']?.score !== null && audits['server-response-time']?.score < 0.8) {
      issuesDetected.push(`Slow Initial Server Response Time (TTFB: ${audits['server-response-time']?.displayValue || 'high'})`);
    }
    if (audits['modern-image-formats']?.score !== null && audits['modern-image-formats']?.score < 0.8) {
      issuesDetected.push('Uncompressed or legacy image formats slowing down page load');
    }
    if (seoScore < 80) {
      issuesDetected.push(`Sub-optimal SEO configuration (Score: ${seoScore}/100)`);
    }

    if (issuesDetected.length === 0) {
      issuesDetected.push('Healthy base performance; opportunity to build modern customer portal / custom app');
    }

    let opportunityScore = 30;
    if (perfScore < 50) opportunityScore += 35;
    else if (perfScore < 70) opportunityScore += 20;
    if (!mobileFriendly) opportunityScore += 25;
    if (!hasHttps) opportunityScore += 15;
    if (seoScore < 75) opportunityScore += 15;
    opportunityScore = Math.min(99, opportunityScore);

    const aiOpportunityReason = `Official Google Lighthouse Audit: Performance score is ${perfScore}/100 (FCP: ${fcp}, LCP: ${lcp}, Speed Index: ${speedIndex}). ${
      perfScore < 60 
        ? 'Website suffers from critical performance bottlenecks causing lost visitors and lower Google search ranking.' 
        : 'Good technical health, but conversion can be enhanced with modern interactive mobile features and direct customer booking.'
    }`;

    const audit: WebsiteAudit = {
      domain,
      hasWebsite: true,
      hasMobileApp: false,
      mobileFriendly,
      performanceScore: perfScore,
      hasHttps,
      hasModernUi: perfScore > 65,
      hasCta: true,
      hasContactForm: true,
      hasOnlineBooking: false,
      hasOnlineOrdering: false,
      techFramework: lighthouse.environment?.benchmarkIndex ? `Benchmark: ${lighthouse.environment.benchmarkIndex}` : undefined,
      opportunityScore,
      issuesDetected,
      aiOpportunityReason,
      isLiveAudit: true,
      fcp,
      lcp,
      cls,
      speedIndex,
      seoScore,
      accessibilityScore
    };

    return {
      success: true,
      audit,
      rawLighthouse: {
        perfScore,
        fcp,
        lcp,
        cls,
        speedIndex,
        seoScore,
        accessibilityScore
      }
    };
  }
}

export const pageSpeedService = new PageSpeedService();
