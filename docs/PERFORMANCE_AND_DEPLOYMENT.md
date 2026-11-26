# Skiply Performance Engineering, Deployment & Agent Guardrails

This document records all **low-end Android mobile optimizations**, **Vercel/Supabase deployment settings**, **Lighthouse benchmarks**, and **critical pitfalls/guardrails** for future agents.

---

## 1. Low-End Android Optimizations (Zero Visual Regression)

All optimizations were implemented under the strict constraint of **zero visual, color, animation, layout, or copy changes** (verified by 100% SHA-256 pixel equality across 7 mobile screens).

### A. Bundle & Server Component Optimizations
- **Pruned Dead Dependencies:** Removed unused `groq-sdk` and `openai` from `package.json` and removed dead imports from `src/app/api/extract-schedule/route.ts`.
- **Server Component Home Page ([`src/app/page.tsx`](../src/app/page.tsx)):** Converted `Home` to an `async` Server Component that awaits `getCurrentUser()` on the server, eliminating client-side auth effect overhead on `/`.
- **On-Demand Confetti:** `canvas-confetti` in [`onboarding-wizard.tsx`](../src/features/onboarding/components/onboarding-wizard.tsx) is dynamically imported only at Step 4.
- **Direct Bundling of Primary Views:** `HeroWidget`, `DailyClassList`, `AttendanceReminder`, `HistoryView`, and `TableAuditView` are imported statically (not `dynamic({ ssr: false })`) so route transitions never stall on secondary JS chunk downloads over slow 4G.

**Top 5 Webpack Client Chunks (measured via `@next/bundle-analyzer` with `next build --webpack`):**
1. `188-62d35eb660773f93.js` — **68.1 KB gzip** (`@supabase`, `firebase`, `@firebase`, buffer)
2. `4bd1b696-deb4a0a1da1923b0.js` — **61.3 KB gzip** (`react-dom`)
3. `254-b28b31d62ebceeb7.js` — **60.6 KB gzip** (`next/dist` runtime & routing)
4. `framework-b29f9083d3cda3b2.js` — **58.4 KB gzip** (`react`, `react-dom`, `scheduler`)
5. `main-539221f20d2bed95.js` — **39.2 KB gzip** (Next.js client entry)

### B. Framer Motion & Direct-Ref `rAF` Loops
- Root layout wraps the app in `<LazyMotion features={domAnimation} strict>` and components use `m.*` rather than full `motion.*`.
- [`src/components/ui/animated-number.tsx`](../src/components/ui/animated-number.tsx) uses a pure `requestAnimationFrame` loop (`easeOutQuad`) writing directly to `ref.current.textContent` — zero per-frame React state updates.
- [`PerformanceTierProvider`](../src/lib/utils/use-performance-tier.tsx) + [`PerformanceClassApplier`](../src/components/providers/performance-class-applier.tsx) apply `.low-perf` on low-spec hardware, collapsing transitions to `0.01ms` and disabling `RubberBandContainer` / spring tap physics.

### C. Rendering, Memoization & CSS Containment
- `React.memo` wraps `ClassCard` ([`class-card.tsx`](../src/features/dashboard/components/class-card.tsx)) and `CalendarCell` ([`history-view.tsx`](../src/features/history/components/history-view.tsx)).
- `contain: 'layout paint'` is applied to class cards, calendar cells, subject cards, and virtualized audit rows ([`table-audit-view.tsx`](../src/features/history/components/table-audit-view.tsx)).
- `content-visibility: auto` with `contain-intrinsic-size: 1px 96px` (class list in [`daily-class-list.tsx`](../src/features/dashboard/components/daily-class-list.tsx)) and `1px 110px` (subject cards in [`history-view.tsx`](../src/features/history/components/history-view.tsx)) skips off-screen layout and paint.

### D. Tab Visibility Animation Pause
- [`src/components/providers/navigation-handler.tsx`](../src/components/providers/navigation-handler.tsx) listens to `visibilitychange` and toggles `html.tab-hidden`.
- [`src/app/globals.css`](../src/app/globals.css) defines `html.tab-hidden * { animation-play-state: paused !important; }` to freeze ambient/looping CSS animations when the tab is backgrounded.

### E. Instant Local-First Data Hydration & Caching
- Both [`src/app/dashboard/page.tsx`](../src/app/dashboard/page.tsx) and [`src/app/history/page.tsx`](../src/app/history/page.tsx) synchronously initialize `profile`, `subjects`, `slots`, `holidays`, `logs`, and `isLoaded` via `getInitialSemesterData()` from `localStorage` / `sessionStorage` (`skiply_semester_data_cache`).
- Return visits and `/dashboard` ↔ `/history` switches render in **~36 ms** while `getSemesterData()` refreshes silently in the background.
- Holiday checks on date changes use local `useMemo` against `holidays` instead of calling `getDailySchedule` over the network.

### F. Image Pipeline & Fonts
- `downscaleImageForUpload` in [`onboarding-wizard.tsx`](../src/features/onboarding/components/onboarding-wizard.tsx) uses `createImageBitmap` + `<canvas>` (with `Image` fallback) to downscale camera timetable uploads to **max 1600px long edge, JPEG quality 0.8** before hitting `/api/extract-schedule`.
- [`src/app/layout.tsx`](../src/app/layout.tsx) loads `Plus_Jakarta_Sans` (`["400", "500", "600", "700"]`, `latin`, `display: "swap"`) and `Instrument_Serif` (`["400"]`, `latin`, `display: "swap"`).

### G. Service Worker & Prefetching
- All primary `<NextLink>` elements in `BottomNav`, `Navbar`, and `Home` use `prefetch={true}`.
- [`src/app/sw.ts`](../src/app/sw.ts) configures Serwist with `skipWaiting: true`, `clientsClaim: true`, `navigationPreload: true`, `CacheFirst` for static images/fonts, `StaleWhileRevalidate` for `/_next/image`, and `defaultCache` for Next.js static JS/CSS chunks.

---

## 2. Lighthouse Mobile Benchmark (6× CPU Throttle + Slow 4G)

| Metric | Before | After |
| :--- | :--- | :--- |
| **Performance Score** | 87 / 100 | 86 / 100 (within local variance) |
| **FCP** | 1.8 s | **1.7 s** |
| **LCP** | 1.8 s | **1.7 s** |
| **Speed Index** | 2.3 s | **2.2 s** |
| **Time to Interactive** | 4.4 s | **4.2 s** |
| **TBT** | 470 ms | 500 ms |
| **CLS** | **0** | **0** |

---

## 3. Vercel & Supabase Configuration

### Edge Headers & Cron ([`vercel.json`](../vercel.json))
- **Cron:** `GET /api/cron/reminders` at `"30 16 * * *"` UTC.
- **Headers:**
  - `/icons/(.*)`: `public, max-age=31536000, immutable`
  - `/manifest.json`: `public, max-age=0, s-maxage=86400, stale-while-revalidate=604800`
  - `/(.*).(svg|png|jpg|ico)`: `public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000`
- `/api/firebase-config` returns `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`.

### Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for `/api/cron/reminders` and `/api/notifications/send`)
- `GEMINI_API_KEY` (for `/api/extract-schedule`)
- `CRON_SECRET` (optional bearer guard for `/api/cron/reminders`)
- `NEXT_PUBLIC_APP_URL` (metadataBase canonical URL)
- `NEXT_PUBLIC_FIREBASE_*` & Firebase Admin credentials (for FCM push reminders)

### Recommended Dashboard Settings (Vercel / Supabase)
1. **Vercel Function Region:** Align with Supabase region (e.g., `bom1` Mumbai if Supabase is in `ap-south-1`) to avoid 300–500 ms cross-continent latency on Server Actions.
2. **Supabase Connection Pooler:** Use Supavisor Transaction Pooler (port `6543`) for serverless connections.
3. **Vercel Function Memory:** 1792 MB–2048 MB allocates >= 1.0 vCPU for faster cold starts.

---

## 4. Agent Guardrails & Known Pitfalls

1. **Always run commands inside `d:\Skiply`**: Running `next build` with `--prefix` from `d:\` fails to resolve `.next` server runtime modules.
2. **Turbopack vs Webpack**: `next.config.ts` enables `turbopack: {}`. To run `@next/bundle-analyzer`, you must pass `--webpack` (`npx next build --webpack`).
3. **Serwist Build Artifacts**: `npm run build` generates `public/sw.js` (and `swe-worker*`), which are gitignored (`/public/sw*`, `/public/swe-worker*` in `.gitignore`). Never commit generated SW build outputs.
4. **Never add `e.preventDefault()` to `<NextLink>`**: Auth gating belongs in `src/proxy.ts`, not click handlers on `Navbar` / `BottomNav`.
5. **Never set `touchAction: 'none'` on `document.body`**: Only toggle `overflow: hidden` when mobile bottom sheets are open.
6. **Never use `w-0 h-0 pointer-events-none` + `.showPicker()` for `<input type="date">`**: Keep the native `<input type="date">` stretched (`absolute inset-0 w-full h-full opacity-0 z-10`) over the calendar button.
7. **Do not break Design System V2**: No glassmorphism, no card backdrop blurs, no arbitrary teal glows, no Demo Mode re-introductions, and no LLM-computed attendance math.
