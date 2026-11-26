# Skiply UI, Design System & Mobile PWA Patterns

This document summarizes the **Editorial Flat Design System (V2)** (full tokens in [`DESIGN.md`](../DESIGN.md)) alongside all mobile-first PWA UX patterns, navigation rules, skeletons, and brand assets.

---

## 1. Visual Identity & Design System V2

- **App Background:** `#0B0C0E` (flat near-black, no radial glows, no glassmorphism, no backdrop blurs on cards).
- **Card Surface (Rest):** `#121417` with `1px solid rgba(255, 255, 255, 0.06)` (`border-white/[0.06]`).
- **Raised / Hover Surface:** `#181B1F` with `border-white/[0.12]`.
- **Elevated Overlays / Modals:** `#1E2228`.
- **Strict Teal Accent (`teal-400` / `#2DD4BF`):** Reserved **only** for the primary dominant CTA button and "Safe" attendance margin indicators (`safe_skips > 2`, attendance `>= target`). Never use teal for decorative glows, gradient text, or secondary nav hover states.
- **Semantic Status Colors:**
  - `SAFE`: `teal-400`
  - `WARNING`: `amber-400` / `amber-500`
  - `DANGER`: `rose-400` / `rose-500`
- **Typography:**
  - **Display (`font-serif`):** `Instrument Serif` (weight `400`, `display: swap`, Latin subset) for top-level page headings only.
  - **UI (`font-sans`):** `Plus Jakarta Sans` (weights `400`, `500`, `600`, `700`, `display: swap`, Latin subset).
  - **Telemetry (`font-mono`):** Tabular numbers (`tabular-nums`) for percentages, safe skips, and timestamps.

---

## 2. Mobile PWA Navigation & Layout

### Root Layout ([`src/app/layout.tsx`](../src/app/layout.tsx))
- Wraps the app in `PerformanceTierProvider` → `PerformanceClassApplier` + `NavigationHandler` → `<LazyMotion features={domAnimation} strict>`.
- Main content sits inside [`RubberBandContainer`](../src/components/ui/rubber-band-container.tsx) (overscroll spring physics on capable devices; automatically disabled when `isLowEnd` is true or when touch originates inside `.fixed`, `[role="dialog"]`, `[data-sheet]`, or `.overflow-y-auto` overlays).
- Fixed mobile [`BottomNav`](../src/components/layout/bottom-nav.tsx) renders outside `RubberBandContainer` and is hidden on `/login`.
- All views use `min-h-dvh` (`min-h-screen min-h-dvh`) and bottom padding (`pb-28 sm:pb-32 md:py-8`) so scrollable content clears the fixed bottom bar.
- Footer and the desktop static example readout on `/` are hidden on mobile screens (`hidden md:block`).

### `BottomNav` ([`src/components/layout/bottom-nav.tsx`](../src/components/layout/bottom-nav.tsx))
Follows Hick's Law with **3 primary destinations** (`Home`, `Schedule`, `Audit`) plus **1 Actions trigger**:
- Active tab displays a spring-animated pill (`layoutId="bottomNavPill"`) and expanding indicator pip (`layoutId="bottomNavPip"`), collapsed to `{ duration: 0 }` on `isLowEnd`.
- **Actions Bottom Sheet (`data-sheet="actions"`):**
  - Quick-mark all unmarked today's classes present (`handleQuickMarkTodayPresent`)
  - Jump to Today (`/dashboard`)
  - Export timetable to RFC 5545 `.ics` calendar (`handleExportIcs` → downloads `skiply-timetable.ics`)
  - Link to Setup (`/onboarding`)
  - Trigger for the **About Skiply** bottom sheet (`data-sheet="about"` / `data-sheet="about-content"`)
- **Mobile Scroll-Lock Rules:**
  - When `isActionsOpen || isAboutOpen`, set `overflow = 'hidden'` on `document.body` and `document.documentElement` (and reset to `''` on close/unmount).
  - **Never** set `document.body.style.touchAction = 'none'`, as it can freeze touch gestures across mobile browsers.
  - Sheet backdrops use `touch-none` with `onTouchMove` `preventDefault()` / `stopPropagation()`, while sheet content uses `overflow-y-auto overscroll-contain touch-pan-y` with `WebkitOverflowScrolling: 'touch'`.

### Non-Blocking Navigation Links
- Every `<NextLink>` in `Navbar`, `BottomNav`, and `/` uses `prefetch={true}` and **must not** call `e.preventDefault()` on click. Auth gating is handled by `src/proxy.ts`.

---

## 3. Interactive Controls & Structural Skeletons

### Reliable Mobile Date Picker ([`src/features/dashboard/components/daily-class-list.tsx`](../src/features/dashboard/components/daily-class-list.tsx))
- **Do not** hide `<input type="date">` with `w-0 h-0 pointer-events-none` and call `.showPicker()` — mobile Chrome and Android WebView throw `NotAllowedError` or silently ignore `.showPicker()` on non-interactable inputs.
- **Current Pattern:** Position `<input type="date">` directly over the calendar button with `className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"` and render the `CalendarIcon` beneath it (`pointer-events-none`). Tapping anywhere on the icon natively opens the OS date picker 100% reliably.
- Date stepping (`<`, `Today`, `>`) calls `onDateChange` directly (without `startTransition`) so rapid taps never feel dropped.

### 1:1 Structural Loading Skeletons
- **Schedule ([`src/app/dashboard/page.tsx`](../src/app/dashboard/page.tsx)):** When `!isLoaded || !profile`, renders a 1:1 mirror of `HeroWidget` (status badge, percentage block, progress bar, 4 stat tiles, target slider) and `DailyClassList` (heading, date row, 3 class cards) — **no circular spinner**.
- **Audit ([`src/app/history/page.tsx`](../src/app/history/page.tsx)):** When `!isLoaded`, renders a 1:1 mirror of `HistoryView` (title, horizontal subject summary cards, filter toolbar, 7×5 calendar grid).

---

## 4. Brand Assets ("The Minimal Forward Skip")

All legacy template SVGs (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) and old raster clutter were purged in `f8655f0`.

Active brand assets in `public/`:
- **App Icons:** `icon.svg` (master vector), `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` (180×180), `icon-72..512.png`, and `icon-72..512-maskable.png` (referenced in `manifest.json` and `layout.tsx`).
- **Logos:** `logo.svg`, `logo-mark.svg`, `logo.png`, `nav-logo.png`.
- **Editorial Banner:** `banner.svg`, `banner.png` (1200×630 OpenGraph / Twitter / README header).
- **Verified Screenshots:** `public/screenshots/` (`home-desktop.png`, `home-mobile.png`, `schedule-mobile.png`, `auth-mobile.png`, `about-desktop.png`, `about-modal.png`, `onboarding-mobile.png`).
