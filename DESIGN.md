# Skiply Design System & Tokens

This document serves as the **Single Source of Truth** for all UI design and component styling across the Skiply application. 

**CRITICAL RULE FOR ALL AGENTS AND DEVELOPERS**: 
Do **NOT** introduce new hardcoded hex colors, arbitrary border radii, or ad-hoc animation values. You must strictly use the design tokens and utility classes defined below.

---

## 1. Color Palette (Midnight Navy & Mint)

All colors must reference Tailwind standard variables or `globals.css` custom variables.

### Core Backgrounds & Surfaces
- **App Background**: `bg-slate-950` or `var(--color-background)` (#08111F)
- **Glass Card Background (Rest)**: `rgba(15, 23, 42, 0.4)` (Slate 900 at 40%)
- **Glass Card Background (Hover/Active)**: `rgba(15, 23, 42, 0.6)` (Slate 900 at 60%)
- **Solid Inner Surfaces**: `bg-slate-900` or `bg-slate-800`

### Semantic Colors
- **Primary (Mint/Teal)**: `var(--color-primary)` (#5EEAD4) / `teal-400`
- **Secondary (Green)**: `emerald-400` / `emerald-500`
- **Warning (Yellow/Orange)**: `amber-400` / `amber-500`
- **Danger (Red)**: `rose-400` / `rose-500`
- **Info/Swap (Blue)**: `sky-400` / `sky-500`

### Text Colors
- **Primary Text**: `text-white` or `text-slate-100` (Headings, active values)
- **Secondary Text**: `text-slate-400` (Subtitles, descriptions, inactive states)
- **Muted Text**: `text-slate-500`

---

## 2. Typography System V1

- **Primary Font**: Plus Jakarta Sans (`var(--font-sans)`)
- **Other Fonts**: strictly forbidden. Do not use Inter or Outfit.

### Weight System
- **ExtraBold (800)**: Hero headline only.
- **Bold (700)**: Main headings, brand wordmark, dashboard numbers.
- **SemiBold (600)**: Section titles, navigation, card titles, buttons.
- **Medium (500)**: Labels, form fields, statistics labels, sidebar items.
- **Regular (400)**: Body text, paragraphs, supporting descriptions.

### Type Scale
- **Hero Display**: `64-72px` (`text-[64px]` or `text-7xl`) | ExtraBold
- **Hero Subtitle**: `22-24px` (`text-[22px]`) | Regular
- **Page Title**: `40px` (`text-[40px]`) | Bold
- **Section Heading**: `30-32px` (`text-[30px]`) | Bold
- **Card Title**: `20-22px` (`text-[20px]`) | SemiBold
- **Statistic Number**: `40-48px` (`text-[40px]`) | Bold
- **Body Large**: `18px` (`text-lg`) | Regular
- **Body**: `16px` (`text-base`) | Regular
- **Small Labels**: `14px` (`text-sm`) | Medium
- **Captions**: `12px` (`text-xs`) | Medium

### Letter Spacing & Line Height
- **Hero**: `tracking-[-0.03em]`, leading 100-110% (`leading-[1.1]`)
- **Headings**: `tracking-[-0.02em]`, leading 110-120% (`leading-tight`)
- **Body**: `tracking-normal`, leading 150-170% (`leading-relaxed`)
- **Small Labels**: `tracking-[0.02em]` to `0.05em` (`tracking-wide`)

### Component Specifics
- **Buttons**: `text-base font-semibold normal-case` (Never uppercase).
- **Navigation**: `text-base font-semibold`.
- **Forms**: Labels `text-sm font-medium`, Inputs `text-base font-normal`.

---

## 3. Corner Radius Scale

Strictly adhere to this 4-tier radius scale. Do not use intermediate or unlisted radius values (e.g., `rounded-md` for buttons is forbidden).

| Scale | Class | Value | Usage |
| :--- | :--- | :--- | :--- |
| **Small** | `rounded-lg` | 8px | Badges, pills, status indicators, tiny chips, segmented control items |
| **Medium** | `rounded-xl` | 12px | Buttons, input fields, dropdowns, navigation items, search bars |
| **Large** | `rounded-2xl` | 16px | Standard cards, dashboard widgets, modal dialogs, history banners |
| **X-Large** | `rounded-3xl` | 24px | Hero dashboard showcase, large feature panels, extreme premium containers |
| **Full** | `rounded-full` | 9999px | Avatars, glowing ambient orbs, specific extreme pill shapes |

---

## 4. Glass Effect & Borders

Skiply heavily relies on a unified glassmorphism aesthetic. Never manually hardcode `backdrop-blur` directly on cards in the markup.

- **Glass Cards**: Use the `.glass-card` class.
  - Backdrop Blur: `24px`
  - Border: `1px solid rgba(255, 255, 255, 0.05)`
  - Inner Top Highlight: `inset 0 1px 0 rgba(255, 255, 255, 0.05)`
- **Premium Gradient Border**: Use the `.premium-gradient-border` class for hero elements.

---

## 5. Animation & Interaction System

All interactive elements must use the global CSS interaction classes rather than arbitrary Tailwind `hover:*` transitions.

### Interaction Classes
- **`.btn-interactive` (Medium actions, 200ms)**
  - Hover: `translateY(-2px)`, `brightness(1.05)`, distinct shadow.
  - Active: `scale(0.97)`
  - Used for: Primary buttons, secondary buttons.
  
- **`.card-interactive` (Heavy actions, 250ms)**
  - Hover: `translateY(-4px)`, deep shadow (`0 16px 32px -8px rgba(0,0,0,0.3)`), increased glass opacity.
  - Active: `scale(0.99)`
  - Used for: Dashboard widgets, class cards, feature cards.
  
- **`.icon-interactive` (Fast actions, 150ms)**
  - Hover: `brightness(1.2)`, primary color tint.
  - Active: `scale(0.95)`
  - Used for: Small icon buttons (undo, swap, cancel).
  
- **`.input-interactive` (Focus states, 200ms)**
  - Focus: Primary border color, glowing outer ring (`0 0 12px 0 rgba(94, 234, 212, 0.2)`).
  - Used for: Text inputs, selects, textareas.

---

## 6. Layout & Spacing

- **Max Width**: `max-w-7xl` for standard page wrappers.
- **Section Spacing**: `py-12` to `py-24` depending on vertical rhythm.
- **Inner Padding**: `p-4` or `p-5` for standard cards. `p-3` for dense components (like Class Cards).
- **Gaps**: `gap-2` to `gap-4` for tight item clusters. `gap-6` to `gap-8` for major sections.
