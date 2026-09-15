# ⚡ LeadPulse — Enterprise Developer Client & Business Lead Discovery Platform

> High-Intent Client Lead Aggregator, Technical Website Auditor, and Multi-Module Outreach Platform for Fullstack Web & App Developers, Agencies, and Freelancers.

---

## 📋 Project Summary & Core Mission

**LeadPulse** is an enterprise-grade, full-stack B2B Lead Finding & Sales CRM web application designed to eliminate manual client prospecting for software agencies, freelance developers, and sales outreach teams.

The platform automatically discovers active business leads worldwide across 10 specialized lead streams, audits their digital presence (detecting missing websites, legacy CMS platforms, missing mobile apps, and uncaptured direct reader margins), validates contact information, and generates tailored AI proposal pitches.

---

## 🌟 10 Modular Lead Discovery Engines

LeadPulse isolates client discovery into **10 dedicated, non-contaminated lead streams**:

1. 📍 **Local SMBs & Maps Engine (`local_biz`)**: Powered by OpenStreetMap (Overpass QL API) + Komoot Photon Geocoding Engine. Discovers physical local businesses (restaurants, clinics, law firms, real estate, automotive, HVAC) worldwide by city & country with address, phone numbers, WhatsApp direct links, and website status.
2. 👔 **B2B Decision Makers Engine (`b2b_founders`)**: Discovers verified C-Suite executives, Founders, CEOs, CMOs, and VP-level decision makers from Apollo.io, LinkedIn, and Wikidata.
3. 📚 **eBook Authors & Digital Creators Engine (`ebook_authors`)**: Queries Google Books API & OpenLibrary API. Features **OpenLibrary Author Bio Deep-Parsing** (`/authors/{id}.json`) to extract verified author emails and domain URLs. Includes numeric publication year date filtering, year-wise newest-first sorting, and a full 12/25/50/100 item pagination bar.
4. 🏬 **Meta & PPC Ad Hunter (`ad_hunter`)**: Targets active businesses spending paid advertising dollars on Facebook, Instagram, and Google Search that need high-converting landing pages and mobile apps.
5. 💻 **Tech-Stack & CMS Auditor (`tech_stack`)**: Audits domain technology stacks (WordPress, Joomla, Drupal, Wix, Squarespace) for performance bottlenecks, slow load speeds, and legacy CMS migration opportunities.
6. 🚀 **Venture-Backed & Funded Startups (`funded_startups`)**: Scans funded tech startups (Y-Combinator, Betalist, Seed/Series A rounds) seeking freelance fullstack engineering bandwidth (React, Next.js, React Native, Flutter).
7. 💼 **Remote Jobs & Hiring Feed (`remote_jobs`)**: Aggregates real-time hiring posts from companies actively looking for web developers, mobile app engineers, and UI/UX designers from HackerNews "Who is Hiring", Remotive, Jobicy, and Reddit (`r/forhire`).
8. 🏛️ **Global Business Registries (`global_registries`)**: Scans official government legal incorporation registries (OpenCorporates, UK Companies House) for brand-new LLCs registered in the last 30–60 days that need their first digital presence.
9. 🎪 **Trade Expos & Booth Exhibitors (`trade_expos`)**: Tracks corporate trade show exhibitors and booth sponsors participating in major global trade Expos.
10. 📊 **Executive Overview & Sales Pipeline (`dashboard` & `kanban`)**: Features a high-level metrics dashboard, lead score distribution charts, temperature heatmaps, and a full drag-and-drop Kanban pipeline board (`NEW`, `QUALIFIED`, `CONTACTED`, `PROPOSAL`, `WON`).

---

## ⚡ Key Architecture & Features

- **Zero Fake Data Policy**: Strictly refrains from synthetic email generation, displaying verified contact badges or official corporate pending statuses.
- **AI Proposal & Pitch Studio**: Generates tailored email subjects, custom pitch proposals, and 1-click WhatsApp scripts for each specific lead category.
- **1-Click Outreach Launchers**: Direct Google Email Search, LinkedIn Profile Search, and Twitter/X DM shortcuts on every lead card.
- **Multi-Stage Email Validation**: Real-time validation badges (`FOUND` ➔ `FORMAT_VALID` ➔ `DOMAIN_VALID` ➔ `📬 MX_VALID` ➔ `✅ VERIFIED`).
- **Phone Normalization & WhatsApp Direct**: Automatic country code resolution (`+1`, `+44`, `+971`, `+92`) and instant 1-click pre-filled WhatsApp chat links.
- **Universal Export Engine**: Export filtered lead lists to CSV / Excel with custom module-specific column structures.
- **Full Client-Side Speed & Zero Latency**: Instant search filtering, category switching, and real-time pagination with zero server latency.

---

## 🛠️ Tech Stack

- **Core**: React 18, TypeScript, Vite
- **Styling**: Vanilla CSS with custom glassmorphism design tokens & micro-animations
- **Icons**: Lucide React
- **Geocoding & Maps**: OpenStreetMap Overpass QL & Komoot Photon Engine
- **Persistence**: LocalStorage reactive schema state

---

## 💻 Local Setup & Running Instructions

```bash
# 1. Clone repository
git clone https://github.com/hammad02520/leadpulse-client-finder.git

# 2. Install dependencies
npm install

# 3. Start local dev server
npm run dev

# 4. Build for production (TypeScript verified)
npm run build
```

---

## 📄 License

MIT © [hammad02520](https://github.com/hammad02520)
