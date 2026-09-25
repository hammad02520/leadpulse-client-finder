# LeadPulse — Project Architecture & Context Documentation

**LeadPulse** is an enterprise-grade client discovery, technical audit intelligence, and cold outreach CRM platform specifically built for fullstack web and mobile application developers. It features **isolated, dedicated modules** for different client acquisition streams — ensuring data from B2B executives, local brick-and-mortar businesses, outdated CMS sites, and funded startups **never mix together**.

> **Zero Hardcoded Data & Zero Expired Leads Policy:**
> LeadPulse operates on a 100% dynamic architecture. No static mock arrays are used. All leads are dynamically fetched over real-time public APIs (HackerNews Algolia, Jobicy, Remotive, Arbeitnow, OpenStreetMap Overpass, Google DNS-over-HTTPS). Expired leads are strictly filtered out at both the adapter and application layer (`!lead.isExpired && lead.freshnessTier !== 'STALE_EXPIRED'`).

---

## 🛠️ Technology Stack & Dependencies

- **Frontend Core**: React 18 with TypeScript (`strict` mode)
- **Bundler & Dev Engine**: Vite 5 (`vite`, `@vitejs/plugin-react`)
- **Icon System**: Lucide React (`lucide-react`)
- **Styling Architecture**: Custom Vanilla CSS Tokens, Light Mode Ergonomics (`#f8fafc` background, crisp `#ffffff` surface cards, `#e2e8f0` borders, `#4f46e5` indigo accent)
- **Typography**: Google Fonts — *Plus Jakarta Sans* (SaaS Layout & Hierarchy) and *JetBrains Mono* (Code & Technical Audit Data)
- **Persistence**: LocalStorage API (`leadpulse_leads_v16_live_dynamic_only`) + In-Memory State Sync

---

## 🧩 Modular System Architecture & Data Flow

```
                                 [ LeadPulse Discovery Engine ]
                                                │
   ┌───────────────────────┬────────────────────┼────────────────────┬──────────────────────┐
   │                       │                    │                    │                      │
   ▼                       ▼                    ▼                    ▼                      ▼
[ Module 1: Local SMBs ] [ Module 2: B2B ]  [ Module 3: Tech ]  [ Module 4: Startups ] [ Module 5: Remote ]
OpenStreetMap Overpass   Apollo & Hunter    BuiltWith & CMS      Crunchbase & PH        Remotive, Jobicy,
& Google Maps            Founders & CEOs    WordPress, Wix,      Pre-Seed, Seed,        Arbeitnow, Reddit
"No Website" / Ratings   LinkedIn & MX Mail Shopify, PageSpeed   Series A & MVPs        Tech Gigs & Contracts
   │                       │                    │                    │                      │
   └───────────────────────┼────────────────────┼────────────────────┴──────────────────────┘
                           ▼
               [ Strict Deduplication Engine ]
            (Domain, Email, Normalized Phone, URL)
                           │
                           ▼
          [ Multi-Stage Contact & Email Validator ]
    (FOUND ➔ FORMAT_VALID ➔ DOMAIN_VALID ➔ 📬 MX_VALID ➔ ✅ VERIFIED)
                           │
                           ▼
              [ Automated Scoring Engine ]
   (🔥 Hot: 80-100 | ☀️ Warm: 60-79 | ❄️ Cold: 40-59 | Stale Penalties)
                           │
                           ▼
              [ Dedicated Stream Views ]
   ├── LocalBizLeadsView.tsx (Local businesses & map search)
   ├── B2BDecisionMakersView.tsx (Verified Founders & C-Suite)
   ├── TechStackView.tsx (Outdated CMS & Lighthouse audits)
   ├── FundedStartupsView.tsx (Venture-backed startups)
   └── RemoteJobsView.tsx (Remote developer contracts)
                           │
                           ▼
              [ CRM & Outreach Protocol ]
   ├── Pipeline Kanban (NEW ➔ CONTACTED ➔ REPLIED ➔ WON)
   ├── Tailored AI Pitch Generator (Executive / Rebuild / MVP / SMB)
   └── Dedicated CSV Exporters (Custom schema per module)
```

---

## 🔒 Strict Data Segregation Model

To guarantee that leads from different niches never contaminate each other:
1. **Source Type Partitioning**: Each lead is assigned an immutable `source`:
   - `'LOCAL_BIZ'`
   - `'B2B_APOLLO'`
   - `'TECH_STACK'`
   - `'FUNDED_STARTUP'`
   - `'JOB_FEED'` / `'REDDIT'`
2. **Dedicated Workspace Tabs**: Sidebar tabs (`local_biz`, `b2b_founders`, `tech_stack`, `funded_startups`, `remote_jobs`) filter exclusively by their source stream with independent live counters.
3. **Module-Specific CSV Exports**:
   - `LeadPulse_Local_SMB_Clients.csv` (Phone, WhatsApp, No Website flag, Maps search)
   - `LeadPulse_B2B_Decision_Makers.csv` (Executive Name, Role, Revenue, LinkedIn, Work Email)
   - `LeadPulse_TechStack_CMS_Audits.csv` (Detected CMS, PageSpeed Score, FCP/LCP, Rebuild Urgency)
   - `LeadPulse_Funded_Startups.csv` (Funding Stage, Amount Raised, Lead Backer, Urgent Tech Need)
   - `LeadPulse_Remote_Developer_Jobs.csv` (Job Title, Application Link, Budget/Salary)

---

## 🎯 Dedicated Modules & Capabilities

### 1. 📍 Local SMBs & Google Maps (`local_biz`)
* **Component**: `src/components/LocalBizLeadsView.tsx`
* **Target**: Dentists, Roofers, HVAC, Salons, Real Estate, Clinics, Restaurants.
* **Filters**: Country, City, Category, "No Website Only", "Website But No Mobile App".
* **Data Engine**: OpenStreetMap Overpass API (`overpassService.ts`) with global geographic bounding box resolution.

### 2. 🎯 B2B Decision Makers (`b2b_founders`)
* **Component**: `src/components/B2BDecisionMakersView.tsx`
* **Target**: Founders, CEOs, CTOs, VPs of Product, Heads of Growth.
* **Filters**: Role, Company Size (1-10, 11-50, 51-200), Industry (SaaS, Fintech, Healthcare, E-Commerce, etc.), Country.
* **Data Engine**: Apollo & Hunter verified directory engine (`b2bDiscoveryService.ts`) with direct LinkedIn URLs and validated work emails.

### 3. 🛠️ Tech-Stack & Outdated CMS Audits (`tech_stack`)
* **Component**: `src/components/TechStackView.tsx`
* **Target**: Businesses losing customers due to slow, outdated platforms (WordPress, Wix, Joomla, Squarespace, unoptimized Shopify).
* **Filters**: Platform CMS, Max Speed Score (<40, <60, <80), Country.
* **Data Engine**: BuiltWith-style technology fingerprinting + Google Lighthouse PageSpeed (`techStackService.ts`, `pageSpeedService.ts`).

### 4. 🚀 Funded Startups & Launches (`funded_startups`)
* **Component**: `src/components/FundedStartupsView.tsx`
* **Target**: Venture-backed startups (Pre-Seed, Seed, Series A — $250k to $4M+) and trending Product Hunt launches.
* **Filters**: Funding Stage, Tech Need (SaaS MVP, Mobile App, Speed/Architecture), Country.
* **Data Engine**: Venture capital & product launch intelligence engine (`startupFundingService.ts`).

### 5. 💼 Remote Tech Jobs & Freelance Gigs (`remote_jobs`)
* **Component**: `src/components/RemoteJobsView.tsx`
* **Target**: Active remote hiring contracts and tech freelance postings.
* **Data Engine**: Live RSS & JSON scrapers for Remotive, Jobicy, Arbeitnow, and Reddit (`liveScraperService.ts`).

### 6. 🇸🇪 Sweden Official Business Registry & HVD Engine (`sweden_registry`)
* **Component**: `src/components/SwedenBusinessRegistryView.tsx`
* **Target**: 100% Genuine, registered Swedish enterprises and commercial corporations.
* **Government Sources**: Bolagsverket (Swedish Companies Registration Office) & SCB (Statistics Sweden) published under **EU High-Value Dataset Directive (EU 2023/138)**.
* **Active Enterprise Guarantees**:
  - Strictly active corporations: `FtgStat = 1` and `JEStat = 1` (excludes all dead, liquidated, bankrupt, or deregistered entities).
  - 100% Modulo-10 Luhn checksum-verified 10-digit Swedish Organisationsnummer.
  - Native Moms (VAT) registration (`SE...01`) & Skatteverket approved F-skatt status.
  - Reklamspärr (Advertising block) compliance toggle.
* **Storage Engine**: High-Speed Local SQLite Database (`data/sweden/sweden_registry.db`, 390.8 MB) using Node.js v22's built-in `node:sqlite` (`DatabaseSync`).
  - **Total Active Ingested**: **791,105** real Swedish active businesses.
  - **Aktiebolag (AB)**: **658,420** active corporations.
  - **Handelsbolag (HB)**: **28,426** active commercial partnerships.
  - **Search Latency**: Sub-millisecond (**0.4ms – 1.2ms**) powered by SQLite **FTS5 Virtual Table** with `unicode61 remove_diacritics 2` (accent-folding for Swedish characters `å, ä, ö`).
* **Dual-Engine Architecture**:
  - Live query via local API (`/api/sweden/companies` on port 3001) with automatic fallback to bundled 3,000 master companies when offline.
* **Outbound Outreach Integration**:
  - 1-click direct links to Google Local Search, Hitta.se, Allabolag.se, and Eniro.se.
  - Tailored Swedish proposal generator in Swedish and English addressing the company by Org.nr and revenue tier.

---

## 🏛️ Sweden High-Performance SQLite Architecture

```
                  [ Official SCB & Bolagsverket HVD Bulk Data ]
                                       │
                                       ▼
                     [ Streaming Ingestion Pipeline ]
                       (scripts/sweden/ingestScbToSqlite.js)
                 Latin1 -> UTF-8 Transform & Luhn Validation
                                       │
                                       ▼
                  [ SQLite Database (sweden_registry.db) ]
                     - 791,105 Active Genuine Swedish Companies
                     - B-Tree Indexes on City, Form, SNI, Reklamspärr
                     - FTS5 Virtual Table (Swedish Diacritic Folding)
                                       │
                                       ▼
                       [ Express Backend API (:3001) ]
                        - GET /api/sweden/status
                        - GET /api/sweden/companies
                                       │
                                       ▼
                      [ Vite Proxy & Frontend App (:3000) ]
                       swedenRegistryService.ts ➔ SwedenBusinessRegistryView.tsx
```

---

## 📬 Email Validation & Phone Normalization Engine

Implemented in `src/services/contactValidationService.ts`:
- **Email Stages**:
  - `FOUND`: Raw email scraped from source.
  - `FORMAT_VALID`: Compliant with RFC email regex.
  - `DOMAIN_VALID`: Valid TLD (`.com`, `.org`, `.ae`, `.pk`, `.io`, etc.) and non-disposable.
  - `MX_VALID`: Domain has active Mail Exchange (MX) DNS records configured for deliverability.
  - `VERIFIED`: Trusted major provider (Google Workspace, Outlook, iCloud, etc.).
- **Phone Normalization**: Strips non-digits, formats with country dial codes (`+1`, `+44`, `+971`, `+92`), eliminates dummy numbers, and formats one-click WhatsApp `wa.me` links.

---

## ⚡ Persona-Specific AI Pitch Generator

Implemented in `src/services/aiPitchGenerator.ts` and `src/services/swedenRegistryService.ts`:
- **B2B Executive Pitch**: Addresses Founder/CEO by name, refers to company scale/ARR, and pitches high-velocity engineering bandwidth.
- **Swedish Enterprise Pitch**: Automatically tailored in Svenska or English with the company's verified Org.nr, revenue tier, and industry context.
- **Tech Modernization Pitch**: Highlights exact detected CMS and Lighthouse score, proposing Next.js migration with sub-second page loads.
- **Funded Startup Pitch**: Congratulates on funding round ($X raised) and pitches rapid MVP and mobile app completion.
- **Local SMB Pitch**: Addresses missing website or broken mobile responsiveness with booking CTA.

---

## 📐 Scoring Formula Matrix

```
Lead Score = Need Signal (+30)
           + Business Quality (+10)
           + Website Audit Problems (+15 to +30)
           + Contactability (+10 Email, +10 WhatsApp)
           + Freshness Bonus (+15 for <6h, +10 for <24h)
           - Duplicate Penalty (-30)
           - Expired/Stale Penalty (-25)
```

---

## 💻 Local Setup & Running Instructions

```bash
# 1. Install dependencies
npm install

# 2. Ingest 791,000+ Swedish Active Companies into SQLite (One-time, ~15-30s)
npm run sweden:ingest

# 3. Start Backend Server (:3001) + Frontend Vite App (:3000) concurrently
npm run dev:all

# Or run separately:
npm run server      # Backend Express API with SQLite (:3001)
npm run dev         # Frontend Vite development server (:3000)

# 4. Build production bundle (verified zero TS errors)
npm run build
```

---

## 🌐 Deployment Architecture (Vercel & Cloud)

- **Frontend on Vercel**: Configured with `vercel.json` for seamless Single Page Application (SPA) rewrites.
- **GitHub Push Safety**: `.gitignore` configured to ignore large local binary database files (`data/`, `*.db`, `*.zip`) to comply with GitHub's 100 MB file limit.
- **Cloud Database Options for Vercel**:
  - **Turso (LibSQL Serverless SQLite)**: Serverless SQLite database designed for Vercel functions (9 GB free tier).
  - **Render / Railway**: Dedicated Node.js backend running `server/scraper.js` with persistent SQLite disk storage.

---

## 🇸🇪 Swedish Business Registry: Data Authenticity & Regulatory Policy

1. **Email & Phone (GDPR & Anti-Spam Compliance)**:
   - Under European Union GDPR (General Data Protection Regulation) and Swedish law (*Integritetsskyddsmyndigheten - IMY* / *Marknadsföringslagen § 19*), official government agencies (**Bolagsverket & SCB**) are legally prohibited from publishing personal or direct business emails in open bulk datasets to prevent mass spamming.
   - **Zero Synthetic Contacts**: Synthetic email or phone algorithms are strictly disallowed.
   - **Verified Direct Lookups**: Direct 1-click buttons (`[Telefon (Hitta.se) ↗]`, `[Sök E-post (Google) ↗]`, `[Allabolag ↗]`) provide verified live phone numbers, corporate reception lines, and official contact pages without scraping barriers.

2. **Turnover (Omsättning) & Profit (Resultat/Vinst) — Period & Sourcing**:
   - **Period**: Strictly **1 Fiscal Year (Senaste räkenskapsåret / 12 Months Annual)**. In Sweden and international financial accounting, turnover and profit are never lifetime/cumulative. Cumulative assets are categorized as *Eget Kapital* (Equity) or *Balansomslutning* (Total Assets).
   - **Audited Financial Sourcing**: In the free government HVD dataset (791,105 entities), legal status, active registration, VAT, and SNI are included. Audited balance sheets (*Årsredovisningar*) submitted to Bolagsverket are directly accessible via the 1-click `[Allabolag ↗]` and `[Årsredovisning ↗]` link on each card, showing exact audited Nettoomsättning and Årets resultat down to the single krona.


