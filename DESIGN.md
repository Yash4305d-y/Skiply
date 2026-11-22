# Skiply Design System & Tokens (V2 — Editorial Flat Direction)

This document serves as the **Single Source of Truth** for all UI design and component styling across the Skiply application. 

**CRITICAL RULE FOR ALL AGENTS AND DEVELOPERS**: 
Do **NOT** introduce glassmorphism, background blurs, radial gradient glows, or arbitrary colored text highlights. Adhere strictly to the flat near-black palette, serif display typography for page headings, Plus Jakarta Sans for UI, and disciplined accent usage.

---

## 1. Color Palette (Flat Near-Black & Disciplined Accent)

### Core Backgrounds & Surfaces
- **App Background**: `#0B0C0E` (`bg-[#0B0C0E]` or `var(--color-background)`)
  - Flat, solid near-black. No aurora blurs, no ambient gradient meshes, no glass effects.
- **Surface / Card (Rest)**: `#121417` (`bg-[#121417]` or `var(--color-surface)`)
  - Flat solid dark surface.
  - Border: `1px solid rgba(255, 255, 255, 0.06)` (`border-white/[0.06]`).
  - Box Shadow: `none`.
  - Backdrop Filter: `none`.
- **Surface Raised / Active / Hover**: `#181B1F` (`bg-[#181B1F]` or `var(--color-surface-raised)`)
  - Secondary containers, elevated cards on hover, segmented control wells.
  - Hover Border: `1px solid rgba(255, 255, 255, 0.12)` (`border-white/[0.12]`).
- **Surface Elevated / Modals**: `#1E2228`
  - Dropdowns, popovers, sticky overlays.

### Accent & Semantic Discipline
- **Teal (`teal-400` / #2DD4BF or #5EEAD4)**:
  - **STRICT USAGE ONLY**:
    1. **Primary Action**: The single dominant primary button on the screen (e.g. "Get started", "Extract with AI").
    2. **"Safe" State**: Margin badges showing positive safe skips (e.g. `+3 safe skips`, attendance >= 75%).
  - **FORBIDDEN FOR TEAL**:
    - Never use as decorative glow or ambient blur.
    - Never use as gradient text or colored keywords in headlines.
    - Never use on secondary buttons, tertiary links, or general icon badges.
    - Never use as a hover wash on navigation items or inputs.
- **Semantic Warning (Amber)**: `amber-400` / `amber-500` (#F59E0B)
  - Caution states, near-threshold attendance (e.g. 75.0% - 77.0%), end-date validation warnings.
- **Semantic Danger (Red)**: `rose-400` / `rose-500` (#EF4444)
  - Deficit classes to attend, attendance below required threshold (< 75%), destructive actions.
- **Neutral / Informational**: Slate / grey scale (`slate-400`, `slate-500`, `slate-600`). Do not introduce arbitrary electric blues or purples.

### Neutral Grey Text Scale
Contrast is created through opacity and weight rather than decorative color highlights:
- **Primary Text**: `text-white` (#FFFFFF) — Main headings, active numbers, high-priority labels.
- **Secondary Text**: `text-slate-300` / `text-slate-400` — Subtitles, body copy, descriptions.
- **Muted Text**: `text-slate-500` — Captions, timestamps, small metadata readouts.
- **Subtle / Inactive**: `text-slate-600` — Disabled controls, subtle separators.

---

## 2. Typography System V2

### Display Font (Page Headings Only)
- **Font**: `Instrument Serif` (or `Fraunces`) via `next/font` (`--font-serif` / `font-serif` / `.page-heading`).
- **Usage**: Top-level page titles and hero display headlines only.
- **Characteristics**: Larger scale (`text-[44px]` to `text-[76px]`), tight tracking (`tracking-[-0.02em]`), regular weight (400).
- **Contrast Rule**: Split headline emphasis with opacity/weight (e.g., muted `text-slate-400` lead-in, full white `text-white` focal point). No colored keyword highlights.

### UI Font (All Interactive & Content Elements)
- **Font**: `Plus Jakarta Sans` (`--font-sans` / `font-sans`).
- **Usage**: Everything outside page display headings: navigation, buttons, card titles, section headers, form inputs, tables, labels.
- **Weights**:
  - `font-semibold` (600): Buttons, card headings, navigation items, metric values.
  - `font-medium` (500): Field labels, table headers, chip labels.
  - `font-normal` (400): Body text, descriptions, explanatory paragraphs.

### Data & Margin Readouts
- **Font**: Monospace (`font-mono` / `ui-monospace`).
- **Usage**: Technical margins, sample status lines, code-like readouts (e.g. `IoT 78% · 3 safe skips`).
- **Scale**: `text-xs font-mono text-slate-500 tracking-tight`.

---

## 3. Corner Radius Scale (Preserved)

Strictly adhere to this 4-tier radius scale. Do not introduce arbitrary or unlisted radius values:

| Scale | Class | Value | Usage |
| :--- | :--- | :--- | :--- |
| **Small** | `rounded-lg` | 8px | Badges, chips, status pills, segmented control items |
| **Medium** | `rounded-xl` | 12px | Buttons, input fields, dropdowns, navigation items |
| **Large** | `rounded-2xl` | 16px | Standard cards, dashboard widgets, modal dialogs |
| **X-Large** | `rounded-3xl` | 24px | Major section containers, feature panels |
| **Full** | `rounded-full` | 9999px | Avatars, icon circular buttons, status indicator dots |

---

## 4. Surfaces, Cards & Borders (No Glass, No Blur)

Glassmorphism is retired. All UI elements must use flat surfaces and hairline borders:

- **Cards (`.flat-card`, `.glass-card`)**:
  - Background: `#121417`
  - Border: `1px solid rgba(255, 255, 255, 0.06)`
  - Backdrop Blur: `none`
  - Box Shadow: `none`
- **Headers (`.flat-header`, `.glass-header`)**:
  - Background: `#0B0C0E`
  - Border Bottom: `1px solid rgba(255, 255, 255, 0.06)`
  - Backdrop Blur: `none`
- **Borders**:
  - Standard border: `rgba(255, 255, 255, 0.06)`
  - Hover border: `rgba(255, 255, 255, 0.12)`
  - Focus border: `rgba(255, 255, 255, 0.3)`

---

## 5. Interaction & Animation System

All interactive elements use subtle, fast transitions (150–200ms). Never use heavy drop-shadow glows.

### Interaction Classes
- **`.btn-interactive` (Buttons, 150ms)**
  - Hover: `translateY(-1px)`, subtle brightness step.
  - Active: `scale(0.98)`
  - Focus-visible: Crisp 2px outline.
- **`.card-interactive` (Cards, 200ms)**
  - Hover: `translateY(-2px)`, background shifts to `#181B1F`, border shifts to `rgba(255, 255, 255, 0.12)`.
  - Active: `scale(0.99)`
  - Box-shadow: none (flat elevation).
- **`.icon-interactive` (Fast actions, 150ms)**
  - Hover: `text-white` (neutral hover).
  - Active: `scale(0.95)`
- **`.nav-item-interactive` (Nav items, 150ms)**
  - Hover: `rgba(255, 255, 255, 0.06)` background, `text-white`. (No teal tint).
  - Active: `rgba(255, 255, 255, 0.10)` background, `text-white`.
- **`.input-interactive` (Form inputs, 150ms)**
  - Hover: `border-white/20`
  - Focus: `border-white/40` (Crisp neutral focus, no 12px teal halo).
- **`.link-interactive` (Text links, 150ms)**
  - Hover: `text-white` (neutral hover).

---

## 6. Low-End Performance Tier & Reduced Motion (Preserved)

- Low-spec devices are detected via `PerformanceTierProvider`.
- Under `.low-perf`, transitions and animations are collapsed to `0.01ms` and blurs are disabled to guarantee 60fps on low-end hardware.
- `@media (prefers-reduced-motion: reduce)` disables all transforms and keyframes globally.

---

## 7. Brand Identity & Vector Assets

### 7.1 Visual Concept: The Minimal Forward Skip
- **Metaphor**: A razor-sharp architectural geometric 'S' constructed from two interlocking kinetic facets.
- **The Diagonal Notch**: A precise 45° negative-space diagonal slit cutting through the spine, symbolizing a student's calculated forward leap over a scheduled class.
- **The Teal Pivot Point**: A single vivid teal circle (`#2DD4BF`) positioned at the upper apex, representing the anchored safety threshold and math engine precision.
- **Surface**: Set upon a flat near-black `#0B0C0E` base with a `#121417` dark slate tile and hairline border (`rgba(255,255,255,0.08)`).

### 7.2 Core Asset Manifest
- **Mobile App Icon**:
  - `public/icon.svg`: Master scalable vector icon.
  - `public/icon-512.png`: 512x512 high-resolution icon.
  - `public/icon-192.png`: 192x192 PWA mobile icon.
  - `public/icon-512-maskable.png` / `public/icon-192-maskable.png`: Android adaptive safe-zone maskable icons.
  - `public/apple-touch-icon.png`: 180x180 iOS home screen icon.
  - `public/favicon.svg`: Standalone vector glyph favicon.
- **Logo Lockup**:
  - `public/logo.svg`: Primary horizontal lockup (88px Minimal Forward Skip tile + "Skiply" Wordmark in Plus Jakarta Sans Bold + "— Attendance planner").
  - `public/logo-mark.svg`: Standalone vector glyph (transparent background).
  - `public/logo.png` / `public/nav-logo.png`: High-density raster logo lockups.
- **Brand Feature Banner**:
  - `public/banner.svg` / `public/banner.png`: 1200x630 OpenGraph / Social / App Store promotional banner featuring the editorial headline in Instrument Serif, the hero emblem tile, and the live 75% threshold telemetry margin card.
