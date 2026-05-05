# DigiGram — Project Handoff & Architecture Document
> **For AI Assistants & New Developers**: Read this entire document before writing any code. This is a live, evolving platform — do not make assumptions, always verify against this document first.

---

## 1. What is DigiGram?

DigiGram is a **rural digital governance platform** for Bangladesh. Think of it as a "Union Parishad OS" — a single web app that any Bengali village/union can use to manage local government services digitally.

It is a **multi-tenant SaaS** platform where:
- Each Union (local govt unit) gets its own branded experience
- The Chairman/admin can activate "plugins" (modules) for their union
- Citizens access services by selecting their local area first

**Core Philosophy:** Every feature must work without reliable internet. Mobile-first, Bangla-first.

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | **Next.js 15** (App Router, React Server Components) |
| Styling | **Tailwind CSS v4** |
| Database | **Supabase** (PostgreSQL + Row Level Security) |
| AI | **Google Gemini API** (document analysis, vision) |
| Auth | **Supabase Auth** (JWT-based) |
| Animations | **Framer Motion** |
| Icons | **Lucide React** |
| Hosting | **Vercel** (planned) |

---

## 3. Environment Variables

Create a `.env.local` file in the root with these keys:

```env
GEMINI_API_KEY=<your-gemini-api-key>
NEXT_PUBLIC_SUPABASE_URL=https://ycuaranwplqqdcutevrj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

> ⚠️ **IMPORTANT**: The Gemini API model currently used is `gemini-1.5-flash`. If you get 404 errors, check `app/api/analyze-deed/route.js` and update the model name.

---

## 4. Project Folder Structure

```
digigram-script/
├── app/
│   ├── (site)/                  ← All public-facing pages
│   │   ├── area/                ← Area selection landing
│   │   ├── services/            ← All service modules
│   │   │   ├── land-guard/      ✅ DONE — AI deed analyzer
│   │   │   ├── fuel/            ✅ DONE — Fuel token + rationing
│   │   │   ├── vehicle-guard/   ✅ DONE — Digi-Bahan (vehicle docs)
│   │   │   ├── e-clinic/        ✅ DONE — Union health clinic
│   │   │   └── market/          🔄 PARTIAL — Market listing UI
│   │   ├── campus/              🔄 PARTIAL — School portal hub
│   │   ├── m/[mosqueId]/        🔄 PARTIAL — Smart Mosque Portal
│   │   ├── u/[unionSlug]/       ← Union profile pages
│   │   ├── admin/               ← Admin dashboard
│   │   ├── future-ai/           ← AI feature showcase page
│   │   ├── roadmap/             ← Public roadmap page
│   │   └── news/                ← Local news feed
│   ├── [domain]/                ← Custom domain routing (schools/mosques)
│   └── api/
│       ├── v1/                  ← REST API for mobile apps
│       │   ├── hierarchy/       ← Location tree API
│       │   ├── institutions/    ← Schools/Mosques API
│       │   └── services/active/ ← Get active plugins for a location
│       └── analyze-deed/        ← Gemini AI deed analysis endpoint
├── components/
│   ├── layout/                  ← Header, Footer, Nav
│   ├── sections/land/           ← LandGuardHub components
│   ├── modules/                 ← (empty — future shared module UI)
│   └── ...
├── database/
│   ├── 01_core_schema.sql       ← MUST run first (locations, profiles, services)
│   ├── 02_seed_data.sql         ← Demo data for Poba Union
│   ├── 03_service_schema.sql    ← Fuel, Blood Bank, Vehicle Guard tables
│   └── 04_admin_policies.sql    ← RLS policies for admin roles
└── lib/
    └── utils/format.js          ← toBnDigits() and other helpers
```

---

## 5. Database Architecture (Supabase)

### Run SQL scripts in this order:
1. `01_core_schema.sql` — Core tables
2. `02_seed_data.sql` — Demo locations (Poba, Mohonpur unions in Rajshahi)
3. `03_service_schema.sql` — Service-specific tables
4. `04_admin_policies.sql` — RLS for admin users

### Core Tables:

| Table | Purpose |
|-------|---------|
| `locations` | Geographic hierarchy (District → Upazila → Union → Ward → Village) |
| `institutions` | Schools, Colleges, Mosques with subdomain/custom_domain |
| `profiles` | User accounts with RBAC roles |
| `services` | Master list of available plugin services |
| `location_services` | Which services are active for which locations |
| `blood_donors` | Blood bank registry |
| `fuel_tokens` | Daily fuel queue tokens |
| `fuel_refill_logs` | Rationing enforcement (prevent duplicate refills) |
| `fuel_pump_settings` | Per-union pump configuration |
| `vehicles` | Vehicle registry (bike number → owner) |
| `vehicle_docs` | Document expiry dates (tax_token, fitness, bluebook) |

---

## 6. Completed Modules ✅

### A. Smart Land Guard (ভূমি সেবা)
- **Route:** `/services/land-guard`
- **What it does:** 
  - AI (Gemini Vision) reads uploaded deed images and extracts info
  - Government fee calculator (নামজারি: ১,১৭০ ৳)
  - Direct links to ePorcha, e-mutation portals
  - Step-by-step mutation guide (দালাল-মুক্ত)
- **API:** `POST /api/analyze-deed` — accepts image FormData, returns extracted info
- **Status:** Fully functional with Gemini integration

### B. Digi-Fuel (জ্বালানি সেবা)
- **Route:** `/services/fuel`
- **What it does:**
  - Citizens get a numbered daily queue token (no more queues)
  - Rationing enforcement: max 500ml per bike per 3 days
  - Pump operator panel at `/services/fuel/operator`
  - Activity logs for transparency
- **DB Tables:** `fuel_tokens`, `fuel_refill_logs`, `fuel_pump_settings`
- **Status:** Fully functional

### C. Digi-Bahan / Vehicle Guard (বাহন সুরক্ষা)
- **Route:** `/services/vehicle-guard`
- **What it does:**
  - AI Scanner: Upload tax token photo → Gemini extracts bike number, owner, expiry
  - "My Vehicles" tab: Track all vehicle document expiry dates
  - BRTA SMS verification: Generate proper SMS format for `26969`
  - Warning integration with Fuel module (expired docs ≠ fuel block, but operator gets alert)
- **DB Tables:** `vehicles`, `vehicle_docs`
- **Status:** UI complete, Supabase integration partially mocked (uses local state for demo)

### D. E-Clinic (ইউনিয়ন স্বাস্থ্য সেবা)
- **Route:** `/services/e-clinic`  
- **What it does:** 
  - Health service directory for Union level clinics
  - Doctor schedule, appointment info
- **Status:** UI complete (static/mock data)

### E. Mosque Portal (মসজিদ পোর্টাল)
- **Route:** `/m/[mosqueId]`
- **What it does:**
  - Public ledger for mosque income/expenses
  - Digital donation system
  - Prayer time schedule
  - Announcements
- **Status:** Route exists, partial implementation

---

## 7. The Service Plugin Architecture

DigiGram uses a **plugin system** for services. Each union can have different services enabled:

```
Union (Poba) → location_services → [digi_fuel ✅, land_guard ✅, blood_bank ✅]
Union (Mohonpur) → location_services → [digi_fuel ✅]
```

**API to get active services:**
```
GET /api/v1/services/active?location_id=<uuid>
```
Mobile apps use this to show/hide menu tabs dynamically.

---

## 8. Multi-Tenancy & Routing

The platform handles custom domains for institutions:

```
digigram.com/u/poba              → Poba Union homepage
pobaschool.digigram.com          → Poba School subdomain
www.pobaschool.edu.bd            → Custom domain
```

The `app/[domain]/` directory handles custom domain routing via `middleware.js`.

---

## 9. API for Mobile Apps

All endpoints are under `/api/v1/`:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/hierarchy/:id` | Get location details + path |
| `GET /api/v1/hierarchy/:id/children` | Get child locations |
| `GET /api/v1/institutions?location_id=` | Get schools/mosques in area |
| `GET /api/v1/services/active?location_id=` | Get enabled plugins |

**Auth:** Pass Supabase JWT in `Authorization: Bearer <token>` header.
See `API_DOCS.md` for full request/response format.

---

## 10. User Roles (RBAC)

| Role | Access |
|------|--------|
| `super_admin` | Full access — all unions, all settings |
| `uno` | Upazila-level — all unions in upazila |
| `chairman` | Single union — all services in that union |
| `ward_member` | Single ward — ward-specific data |
| `institution_admin` | Single school/mosque |
| `teacher` | Campus module — attendance, grades |
| `volunteer` | Service operations (fuel pump, blood bank) |
| `student` | Read-only — own data |

---

## 11. What's Next? (Next Phase)

### Priority 1 — Connect Real Supabase Data
- `vehicle-guard`: Replace mock `myVehicles` state with real Supabase queries
- `e-clinic`: Connect to real doctor/schedule data
- `market`: Complete the local market listing module

### Priority 2 — Smart Mosque Portal (Complete)
- Public income/expense ledger with receipt uploads
- Digital passbook for resident contributions  
- Donation gateway integration

### Priority 3 — Campus Module (School Portal)
- Student attendance tracking
- Exam results publishing
- SMS notification to parents

### Priority 4 — Admin Dashboard
- Union chairman dashboard at `/admin`
- Service activation/deactivation panel
- Analytics (tokens issued, donors, etc.)

### Priority 5 — Mobile App API Hardening
- Proper JWT validation on all `/api/v1/` routes
- Rate limiting
- Full RLS policies in Supabase

---

## 12. Running the Project Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:3000` — select an area → browse services.

> **Note:** Some features require Supabase tables to exist. Run all 4 SQL scripts in order before testing database-connected features.

---

## 13. Key Design Patterns

1. **Server Actions** — Forms and mutations use Next.js Server Actions (`'use server'`). See `fuel/actions.js`, `vehicle-guard/actions.js`.

2. **Bangla Numbers** — Always use `toBnDigits()` from `@/lib/utils/format` to convert numbers to Bengali (`১২৩` not `123`).

3. **No Page Reloads** — Use `useTransition` + Server Actions for form submissions. Never do full page reloads.

4. **AI Integration** — All Gemini calls go through `/api/analyze-deed` (server-side) to protect the API key. Never call Gemini from client components.

5. **Mobile Warning Policy** — Expired vehicle documents = **warning only**, NOT a hard block. Pump operator sees an alert but can still issue fuel. This is by design for rural usability.

---

## 14. Important Notes for AI Assistants

- ✅ This is **Next.js App Router** — no `pages/` directory. All routes are in `app/`.
- ✅ Server Components are the default. Add `'use client'` only when needed (state, events, animations).
- ✅ All user-facing text should be in **Bangla (Bengali)**, not English.
- ⚠️ Do NOT add new npm packages without checking if functionality already exists.
- ⚠️ Supabase queries should always respect RLS. Do not use the service role key on the frontend.
- ⚠️ The Gemini model name changes frequently. If you get a 404 from the AI API, update the model to `gemini-1.5-flash` or check the latest available models.
