<p align="center">
  <img src="public/banner.svg" alt="Skiply — Attendance Safety Margin Engine" width="100%">
</p>

<div align="center">

# <img src="public/icon.svg" alt="Skiply Icon" width="40" height="40" align="center" style="vertical-align: -6px;"/> Skiply

**Know exactly when you can safely skip.**

*A client-first, deterministic attendance safety margin planner designed for university and college students.*

<br/>

[![Live Deployment](https://img.shields.io/badge/Live_Demo-skiply--kk.vercel.app-2DD4BF?style=for-the-badge&logo=vercel&logoColor=0B0C0E)](https://skiply-kk.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-0B0C0E?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-2.0_Flash-8E75C2?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![License: MIT](https://img.shields.io/badge/License-MIT-2DD4BF?style=for-the-badge&logoColor=0B0C0E)](LICENSE)

</div>

---

## 🌐 Live Demo

Experience the live production application deployed on Vercel:

<p align="center">
  <a href="https://skiply-kk.vercel.app/" target="_blank">
    <img
      src="https://img.shields.io/badge/⚡_LAUNCH_SKIPLY_APP-2DD4BF?style=for-the-badge&labelColor=0B0C0E"
      alt="Launch Skiply"
    />
  </a>
</p>

<p align="center">
  <strong>Live Application:</strong>
  <a href="https://skiply-kk.vercel.app/">skiply-kk.vercel.app</a>
</p>

---

## 📖 Overview

Every college student with mandatory attendance rules (typically 75% or 80%) asks the same question:

> *"Can I safely skip today's lecture without dropping below my attendance criteria?"*

Conventional attendance apps only show past percentages ($\frac{\text{Attended}}{\text{Conducted}}$). They leave you to mentally calculate remaining lectures, semester end dates, and safe thresholds.

**Skiply solves this with an intelligent, deterministic margin engine.**

By modeling your academic timetable, holidays, and semester timeline, Skiply calculates **the exact number of lectures you can safely skip** while guaranteeing you finish at or above your target percentage.

```text
Traditional Trackers:  "You have attended 14 of 18 classes (77.8%)."
Skiply Engine:         "You can safely skip 3 more classes this semester. 
                        Target: 75% min · Status: Safe."
```

---

## ✨ Key Capabilities

| Capability | Engineering Highlight |
| :--- | :--- |
| 📐 **Deterministic Margin Engine** | Exact discrete arithmetic for safe skips and deficit recovery. Zero guessing. |
| 📸 **Optical Schedule Extraction** | Upload a photo of your timetable. Google Gemini Vision automatically extracts subjects, timings, and rooms. |
| ⚡ **Single-Tap Logging** | Log Present, Absent, Cancelled, or Swapped with one tap. Margins update instantaneously. |
| 📶 **Offline-First Resilience** | Queues actions locally in lecture halls with spotty connectivity and auto-syncs when back online. |
| 📅 **RFC 5545 `.ics` Export** | Sync your timetable with Apple Calendar, Google Calendar, and Microsoft Outlook. |
| 📱 **Tactile PWA Architecture** | Dynamic viewport scaling (`dvh`), spring physics, matched icon weights, and safe-area clearance. |
| 🎨 **Editorial Flat Aesthetic** | Flat near-black (`#0B0C0E`) palette with disciplined `teal-400` accents and Instrument Serif typography. |

---

## 📸 Visual Walkthrough

<div align="center">

### Desktop Experience
*Restrained editorial craft with instant attendance telemetry and interactive target sliders.*

<img src="public/screenshots/home-desktop.png" alt="Skiply Desktop Home" width="90%"/>

<br/><br/>

### Mobile PWA Experience
*Single-thumb ergonomic daily navigation, safe skip badges, and architectural bottom sheet modals.*

<table align="center">
  <tr>
    <td align="center" width="33%">
      <img src="public/screenshots/schedule-mobile.png" alt="Mobile Daily Schedule" width="100%"/>
      <br/><b>Daily Schedule & Safe Skips</b>
    </td>
    <td align="center" width="33%">
      <img src="public/screenshots/auth-mobile.png" alt="Mobile Authentication" width="100%"/>
      <br/><b>Campus Student ID Auth</b>
    </td>
    <td align="center" width="33%">
      <img src="public/screenshots/about-modal.png" alt="Mobile About Sheet" width="100%"/>
      <br/><b>Architecture & Creators Sheet</b>
    </td>
  </tr>
</table>

</div>

---

## 🧠 How Safe Skips Work

Skiply calculates your safe skip margin using discrete arithmetic implemented in [`src/lib/math-engine.ts`](src/lib/math-engine.ts):

$$\text{Safe Skips} = \left\lfloor N_{\text{total}} \times (1 - T) \right\rfloor - \text{Absences}$$

- **$N_{\text{total}}$**: Total semester classes (conducted so far + scheduled classes remaining until the semester end date).
- **$T$**: Your attendance target (e.g. $0.75$ for $75\%$).
- **Cancelled Sessions**: Automatically deducted from conducted classes so you are never penalized.
- **Academic Holidays**: Excluded from remaining class counts using your university holiday schedule.

```text
Status Classification:
  🟢 SAFE      ·  Safe Skips > 2  (Comfortable buffer above target)
  🟡 WARNING   ·  Safe Skips 0–2  (Border zone; any skip reduces margin to zero)
  🔴 DANGER    ·  Deficit        (Below target; displays exact classes needed to recover)
```

---

## 🏗️ System Architecture

```mermaid
flowchart LR
    Ingest["📸 Timetable Photo / OCR\n(Google Gemini Vision)"] --> Core["⚡ Deterministic Engine\n(Next.js 16 + Offline Queue)"]
    Core --> Storage[("🗄️ PostgreSQL\n(Supabase Database)")]
    Core --> Output["📅 Daily Schedule & Safe Skips\n(RFC 5545 .ics Calendar Export)"]
```

---

## 🛠️ Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16 (App Router)** | Server Components, Server Actions, streaming SSR, dynamic routing |
| **Frontend** | **React 19** | Concurrent rendering, `useTransition`, server actions integration |
| **Styling** | **Tailwind CSS v4** | Pure flat design system, hairline borders, zero CSS runtime overhead |
| **Animation** | **Framer Motion 12** | Strict `<LazyMotion>` with `domAnimation`, spring physics gestures |
| **Database** | **Supabase (PostgreSQL)** | Row-Level Security (RLS), relational timetable slots, attendance logs |
| **Auth** | **Supabase SSR** | Cookie-based session validation via `proxy.ts` middleware |
| **AI / OCR** | **Google Gemini 2.0 Flash** | Optical character recognition & structured JSON extraction for schedules |
| **Offline Sync** | **Custom Offline Queue** | Automatic FIFO queuing with `navigator.onLine` reconnection flushing |
| **PWA** | **Serwist & Service Worker** | Offline caching, standalone app manifest, mobile installability |
| **Export** | **RFC 5545 iCalendar** | Cross-platform calendar synchronization (.ics generation) |
| **Deployment** | **Vercel** | Edge runtime, global CDN distribution, automatic CI/CD deployment |

---

## 📁 Repository Structure

```text
Skiply/
├── public/                     # Static assets, branding & icons
│   ├── banner.svg              # Scalable vector banner
│   ├── icon.svg                # Minimal Forward Skip vector mark
│   ├── logo.svg                # Primary brand lockup
│   ├── manifest.json           # PWA web app manifest
│   └── screenshots/            # Verified visual proof assets
├── src/
│   ├── actions/
│   │   ├── auth.ts             # Server actions for student registration & login
│   │   └── db.ts               # Database CRUD: profiles, timetable, attendance logs
│   ├── app/
│   │   ├── about/              # Editorial about page & creators credits
│   │   ├── api/
│   │   │   └── extract-schedule/ # Gemini Vision AI extraction route
│   │   ├── dashboard/          # Daily schedule, single-tap logging & hero widget
│   │   ├── history/            # Attendance audit table, 3-dot telemetry
│   │   ├── login/              # Campus Student ID authentication
│   │   ├── onboarding/         # Timetable image upload & verification wizard
│   │   ├── layout.tsx          # Root layout, PWA meta, RubberBandContainer
│   │   └── page.tsx            # Editorial landing page & safe skip preview
│   ├── components/
│   │   ├── layout/
│   │   │   ├── navbar.tsx      # Responsive desktop & mobile header
│   │   │   ├── bottom-nav.tsx  # Fixed mobile 3-tab navigation + actions sheet
│   │   │   └── footer.tsx      # Desktop-only editorial footer
│   │   └── ui/                 # Reusable animated UI elements & icons
│   ├── features/               # Modular domain feature slices
│   │   ├── dashboard/          # DailyClassList, ClassCard, HeroWidget
│   │   ├── history/            # HistoryView, monthly audit calendars
│   │   └── onboarding/         # OnboardingWizard, schedule review steps
│   ├── lib/
│   │   ├── math-engine.ts      # Deterministic safe skip calculation engine
│   │   ├── supabase/           # Server, client, and proxy SSR clients
│   │   └── utils/              # Performance tiers, offlineQueue, cn helper
│   └── types/                  # TypeScript data contracts & database models
├── DESIGN.md                   # Single Source of Truth design system
├── PRODUCT.md                  # Product specifications & principles
└── package.json                # Project dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or later
- **npm** or **pnpm**
- **Supabase project**: A PostgreSQL instance with the schema applied
- **Google Gemini API Key**: For AI timetable optical character extraction

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Yash4305d-y/Skiply.git
   cd Skiply
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the project root:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

   # Google Gemini API (AI Timetable Extraction)
   GEMINI_API_KEY=your-gemini-api-key
   ```

4. **Initialize Database Schema:**
   Execute the migration SQL file located at [`supabase-schema.sql`](supabase-schema.sql) in your Supabase SQL Editor to establish tables, relationships, and Row-Level Security (RLS) policies.

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Built By

Skiply is an open-source collaboration designed and built by:

<table align="center">
  <tr>
    <td align="center" width="50%">
      <a href="https://github.com/Yash4305d-y">
        <img src="https://github.com/Yash4305d-y.png" width="90" style="border-radius: 50%;" alt="Yash Vinay Kalyani"/>
      </a>
      <br/>
      <b>Yash Vinay Kalyani</b>
      <br/>
      <sub>Frontend Architecture · Attendance Logic · UI/UX System</sub>
      <br/><br/>
      <a href="https://github.com/Yash4305d-y">
        <img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" alt="Yash GitHub"/>
      </a>
      <a href="https://yashkalyani.vercel.app/">
        <img src="https://img.shields.io/badge/Portfolio-2DD4BF?style=flat-square&logo=vercel&logoColor=0B0C0E" alt="Yash Portfolio"/>
      </a>
    </td>
    <td align="center" width="50%">
      <a href="https://github.com/kyush02">
        <img src="https://github.com/kyush02.png" width="90" style="border-radius: 50%;" alt="Kyush Kumar"/>
      </a>
      <br/>
      <b>Kyush Kumar</b>
      <br/>
      <sub>Original Concept · Product Direction · Database Schema</sub>
      <br/><br/>
      <a href="https://github.com/kyush02">
        <img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" alt="Kyush GitHub"/>
      </a>
      <a href="https://kyush-portfolio.vercel.app/">
        <img src="https://img.shields.io/badge/Portfolio-2DD4BF?style=flat-square&logo=vercel&logoColor=0B0C0E" alt="Kyush Portfolio"/>
      </a>
    </td>
  </tr>
</table>

---

## 🤝 Contributing

We welcome community contributions, feature ideas, and architectural enhancements.

1. Fork the repository.
2. Create your feature branch (`git checkout -b feat/attendance-analytics`).
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/) (`git commit -m "feat: add semester attendance forecasting"`).
4. Push to the branch (`git push origin feat/attendance-analytics`).
5. Open a Pull Request for review.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for full details.

---

<div align="center">

**Plan Your Attendance. Skip Smarter.**

[🌐 Launch Live App](https://skiply-kk.vercel.app/) · [🐛 Report Bug](https://github.com/Yash4305d-y/Skiply/issues/new?labels=bug) · [💡 Request Feature](https://github.com/Yash4305d-y/Skiply/issues/new?labels=enhancement)

</div>
