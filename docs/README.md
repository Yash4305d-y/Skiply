# Skiply — Agent & Developer Documentation

> **Live Production URL:** [https://skiply-kk.vercel.app/](https://skiply-kk.vercel.app/)  
> **Repository:** `Yash4305d-y/Skiply` (active development branch `yash`, production branch `main`)

This `docs/` directory is the **up-to-date, canonical context** for AI coding agents and developers working on **Skiply**. It consolidates the original specifications (`specs/`, `PRODUCT.md`, `DESIGN.md`) with all architectural, UI, mobile-PWA, and low-end performance changes implemented through November 2026.

---

## 1. What Skiply Is

Skiply is a **client-first, deterministic attendance safety margin planner** built for university and college students navigating mandatory attendance rules (typically 75% or 80%).

Instead of only reporting past attendance ($\text{Attended} / \text{Conducted}$), Skiply models:
- The student's weekly timetable (`timetable_slots`)
- Semester start and end dates (`semester_start_date`, `semester_end_date`)
- Academic holidays (`holidays` / `academic_holidays`)
- Daily attendance logs (`attendance_logs`: `PRESENT`, `ABSENT`, `CANCELLED`, `SWAPPED`)

From these inputs, it computes the exact **safe skips remaining** or **classes needed to recover** per subject and across the semester.

---

## 2. Documentation Index

| Document | Purpose |
| :--- | :--- |
| [`docs/README.md`](README.md) | Project overview, tech stack, directory map, and reconciliation with legacy specs. |
| [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) | App Router pages, Server Actions, API routes, `src/proxy.ts` auth, offline queue, and FCM push reminders. |
| [`docs/DATABASE_AND_MATH.md`](DATABASE_AND_MATH.md) | Supabase PostgreSQL schema, RLS policies, SQL migrations, TypeScript types, and `math-engine.ts` formulas. |
| [`docs/UI_AND_DESIGN.md`](UI_AND_DESIGN.md) | Editorial Flat Design System V2, mobile PWA navigation, date picker pattern, 1:1 skeletons, and Minimal Forward Skip assets. |
| [`docs/PERFORMANCE_AND_DEPLOYMENT.md`](PERFORMANCE_AND_DEPLOYMENT.md) | Low-end Android optimizations, bundle analysis, `vercel.json` Edge headers, Serwist SW, and agent guardrails. |

Root-level reference files preserved in the repository:
- [`DESIGN.md`](../DESIGN.md) — Design System V2 tokens & strict visual rules (Single Source of Truth for styling).
- [`PRODUCT.md`](../PRODUCT.md) — Product positioning, operating context, and principles.
- [`README.md`](../README.md) — Public GitHub presentation README.
- [`specs/`](../specs/) — Original historical specifications (see **Section 5** below for what changed).

---

## 3. Current Technology Stack

Verified against [`package.json`](../package.json):

| Layer | Technology | Version / Notes |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `16.2.12` (Turbopack default in dev/build; `--webpack` flag needed for bundle analyzer) |
| **UI Runtime** | React / React DOM | `19.2.4` |
| **Language** | TypeScript | `^5` |
| **Styling** | Tailwind CSS | `^4` (`@tailwindcss/postcss`) |
| **Motion** | Framer Motion | `^12.42.2` (`LazyMotion` + `domAnimation` + `m` components) |
| **Icons** | Lucide React | `^1.27.0` |
| **Virtualization** | TanStack React Virtual | `^3.14.9` (used in `TableAuditView`) |
| **Database & Auth** | Supabase (`@supabase/supabase-js`, `@supabase/ssr`) | PostgreSQL with RLS and SSR cookie auth |
| **AI / OCR** | Google GenAI (`@google/genai`) | `^2.13.0` (Gemini Vision timetable extraction) |
| **Push Notifications** | Firebase (`firebase`, `firebase-admin`) | FCM client tokens + server cron reminders |
| **PWA / Service Worker** | Serwist (`@serwist/next`, `serwist`) | `^9.5.12` (precaching + runtime caching) |
| **Celebration** | `canvas-confetti` | `^1.9.4` (dynamically imported on onboarding completion) |

---

## 4. Repository Directory Map

```text
Skiply/
├── docs/                           # Canonical agent & developer documentation (this folder)
├── public/                         # Brand SVGs, PWA icons (72–512px + maskable), manifest, screenshots
├── specs/                          # Historical initial project & DB specifications
├── sql/                            # Incremental SQL migrations & triggers
├── src/
│   ├── actions/                    # Next.js Server Actions (auth.ts, db.ts)
│   ├── app/                        # App Router pages, API routes, globals.css, layout.tsx, sw.ts
│   ├── components/
│   │   ├── fcm/                    # Push notification toggle UI
│   │   ├── layout/                 # Navbar, BottomNav, Footer, AmbientBackground
│   │   ├── providers/              # NavigationHandler, PerformanceClassApplier
│   │   └── ui/                     # AnimatedNumber (rAF), AnimatedRing, RubberBandContainer
│   ├── features/
│   │   ├── dashboard/              # HeroWidget, DailyClassList, ClassCard, AttendanceReminder
│   │   ├── history/                # HistoryView, TableAuditView
│   │   ├── marketing/              # DashboardPreview
│   │   └── onboarding/             # OnboardingWizard
│   ├── lib/
│   │   ├── __tests__/              # math-engine.test.ts
│   │   ├── supabase/               # client.ts, server.ts, proxy.ts
│   │   ├── utils/                  # offlineQueue.ts, use-performance-tier.tsx
│   │   ├── firebase.ts             # Client Firebase initialization
│   │   ├── firebase-admin.ts       # Server Firebase Admin SDK initialization
│   │   └── math-engine.ts          # Deterministic safe-skip & deficit calculation engine
│   ├── types/index.ts              # Shared TypeScript interfaces
│   └── proxy.ts                    # Next.js 16 SSR proxy (session refresh)
├── supabase-schema.sql             # Base PostgreSQL schema & RLS policies
├── next.config.ts                  # NextConfig wrapped with withSerwist + withBundleAnalyzer
├── vercel.json                     # Vercel Cron + Edge Cache-Control headers
└── package.json                    # Scripts & dependencies
```

---

## 5. Reconciliation with Legacy `specs/` & Earlier Docs

If you read the older `.txt` files in [`specs/`](../specs/), be aware of these **verified superseding changes**:

1. **Demo Mode Removed (`8c035f2`)**: Earlier specs and components supported a local `demo-store` / Demo Mode without login. Demo Mode has been **completely removed** across the application, navigation, and stores. All persistence flows through Supabase (with `localStorage` / `sessionStorage` acting purely as read-through cache and offline queue).
2. **Next.js 16 `proxy.ts` instead of `middleware.ts`**: Session refresh runs via [`src/proxy.ts`](../src/proxy.ts) delegating to [`src/lib/supabase/proxy.ts`](../src/lib/supabase/proxy.ts). Do not create a competing `middleware.ts`.
3. **AI SDK Cleanup**: Unused `groq-sdk` and `openai` dependencies were removed. Timetable extraction in [`src/app/api/extract-schedule/route.ts`](../src/app/api/extract-schedule/route.ts) uses `@google/genai` (Gemini).
4. **Design System V2 (`DESIGN.md`)**: Glassmorphism, heavy blurs, and blue/purple gradients from early prototypes were retired in favor of the **Editorial Flat Direction** (`#0B0C0E` background, `#121417` cards, `Instrument Serif` page titles, `Plus Jakarta Sans` UI, strict `teal-400` discipline).
5. **About Page & Sheet (`a0f18a3`)**: Replaced the old "Reset Demo" action with a dedicated [`/about`](../src/app/about/page.tsx) page and a mobile About bottom sheet inside `BottomNav`.
6. **Navigation & Loading Architecture**:
   - Nav links in `Navbar` and `BottomNav` no longer block clicks with `e.preventDefault()` on async auth state.
   - `Home` (`src/app/page.tsx`) is an `async` Server Component.
   - `Dashboard` and `History` use synchronous `localStorage`/`sessionStorage` cache initialization and **1:1 structural skeletons** (the old circular spinner was removed).

---

## 6. Quick Start Commands

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Type-check & production build (Turbopack)
npm run build

# Start production server locally
npm run start

# Lint codebase
npm run lint
```

> **Note on Bundle Analysis:** `@next/bundle-analyzer` is incompatible with Turbopack builds in Next.js 16. Run `ANALYZE=true npx next build --webpack` from inside the project root (`d:\Skiply`).
