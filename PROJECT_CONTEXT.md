# LeadPulse — Project Architecture & Context Documentation

**LeadPulse** is an enterprise-grade client discovery, technical audit intelligence, and cold outreach CRM platform specifically built for fullstack web and mobile application developers to locate high-intent client opportunities across multiple platforms, run automated website audits, calculate weighted lead qualification scores, generate truthful proposals, and execute safe human-in-the-loop outreach.

---

## 🛠️ Technology Stack & Dependencies

- **Frontend Core**: React 18 with TypeScript (`strict` mode)
- **Bundler & Dev Engine**: Vite 5 (`vite`, `@vitejs/plugin-react`)
- **Icon System**: Lucide React (`lucide-react`)
- **Styling Architecture**: Custom Vanilla CSS Tokens, Light Mode Ergonomics (`#f8fafc` background, crisp `#ffffff` surface cards, `#e2e8f0` borders, `#4f46e5` indigo accent)
- **Typography**: Google Fonts — *Plus Jakarta Sans* (SaaS Layout & Hierarchy) and *JetBrains Mono* (Code & Technical Audit Data)
- **Persistence**: LocalStorage API (`leadpulse_leads_data_v1`) + In-Memory State Sync

---

## 🧩 Architectural Design & Data Flow

```
                           [ Multi-Source Adapters ]
   ├── RedditAdapter (Reddit JSON API for r/forhire, r/freelance_forhire, r/smallbusiness)
   ├── JobFeedAdapter (HackerNews Who's Hiring, RemoteOK, WeWorkRemotely feeds)
   ├── LocalBizAdapter (Google Maps Directory & Local Niche Scanner)
   └── ManualImportAdapter (Custom Lead Generator)
                                      │
                                      ▼
                             [ Data Normalization ]
                                      │
                                      ▼
                            [ Deduplication Engine ]
                      (Checks Domain, Email, Source URL)
                                      │
                                      ▼
                        [ Website Technical Auditor ]
              (Checks Mobile View, Speed Index, HTTPS SSL, CTA)
                                      │
                                      ▼
                        [ Automated Scoring Matrix ]
         (🔥 Hot: 80-100 | ☀️ Warm: 60-79 | ❄️ Cold: 40-59 | Ignore <40)
                                      │
                                      ▼
                        [ Enterprise CRM Layout ]
         (Sidebar Nav + Top Toolbar + Overview / Pipeline / Data Grid)
                                      │
                                      ▼
                    [ Truthful AI Pitch & Safe Outreach ]
                  (wa.me link generator + mailto protocol)
```

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

## 🚀 Key Features

1. **Multi-Source Adapter Engine**: Dynamic data extraction with fallback live search links.
2. **Freshness & Expired Post Protection**: Automatic scoring penalty for posts older than 14 days or closed threads.
3. **Factual AI Proposal Generator**: Creates tailored pitches strictly matching website audit findings (zero fake claims).
4. **Safe WhatsApp & Email Protocol**: Generates `wa.me/<phone>?text=<encoded_pitch>` for user review before sending.
5. **8-Stage Sales Pipeline**: `NEW ➔ QUALIFIED ➔ CONTACTED ➔ FOLLOW-UP ➔ REPLIED ➔ MEETING ➔ PROPOSAL ➔ WON`.
6. **CSV Export Engine**: 1-click export of qualified lead lists for bulk outreach tools.

---

## 💻 Local Setup & Running Instructions

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build production bundle
npm run build
```
