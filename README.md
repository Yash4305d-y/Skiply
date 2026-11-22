<p align="center">
  <img src="public/banner.png" alt="Skiply — Attendance Safety Margin Engine" width="100%">
</p>

<div align="center">

# Skiply

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
  <a href="https://skiply-kk.vercel.app/">
    <img src="https://img.shields.io/badge/⚡_LAUNCH_SKIPLY_APP-https%3A%2F%2Fskiply--kk.vercel.app-2DD4BF?style=for-the-badge&labelColor=0B0C0E" alt="Launch Skiply">
  </a>
</p>

> **Direct Production URL:** [https://skiply-kk.vercel.app/](https://skiply-kk.vercel.app/)

---

## 📖 Overview

Every college and university student with mandatory attendance policies (typically 75% or 80%) constantly confronts the same critical dilemma:

> *"Can I safely skip today's lecture without dropping below my attendance criteria?"*

Conventional attendance apps merely log past records and output a backward-looking percentage ($\frac{\text{Attended}}{\text{Conducted}}$). They leave the student to mentally estimate future lectures, semester end dates, lab multipliers, and risk boundaries.

**Skiply solves this through a forward-looking, deterministic margin engine.**

Instead of guessing, Skiply models your complete academic timetable, holiday calendar, and semester boundary dates to calculate **the exact number of lectures you can safely skip** while remaining mathematically guaranteed to finish the semester at or above your target threshold.

```text
Traditional Trackers:  "You have attended 14 of 18 classes (77.8%)."
Skiply Engine:         "You can safely skip 3 more classes this semester. 
                        Target: 75% min · Status: Safe."
```

---

## ✨ Key Capabilities

| Capability | Engineering Highlight |
| :--- | :--- |
| 📐 **Deterministic Margin Engine** | 100% mathematically proven safe skip and deficit recovery calculations. Zero stochastic LLM hallucinations. |
| 📸 **Optical Schedule Extraction** | Upload a photo or screenshot of your timetable. Google Gemini Vision automatically extracts subjects, slots, and rooms. |
| ⚡ **Single-Tap Logging** | Tap once to mark Present, Absent, Cancelled, or Swapped. Real-time telemetry recalculates margins immediately. |
| 📶 **Offline-First Resilience** | In low-connectivity lecture halls, actions queue locally and automatically synchronize to Supabase when connectivity returns. |
| 📅 **RFC 5545 `.ics` Export** | Export your entire university timetable to Apple Calendar, Google Calendar, and Microsoft Outlook with one click. |
| 📱 **Tactile PWA Architecture** | Dynamic viewport scaling (`dvh`), physics-based spring gestures, matched icon stroke weights, and mobile safe-area clearance. |
| 🎨 **Editorial Flat Aesthetic** | Flat near-black (`#0B0C0E`) theme with disciplined `teal-400` accents, Instrument Serif headings, and Plus Jakarta Sans UI. |

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

## 🧠 Deterministic Mathematical Model

Skiply does not guess. The margin engine operates entirely on deterministic discrete arithmetic implemented in [`src/lib/math-engine.ts`](src/lib/math-engine.ts):

### 1. Current Attendance Standing
$$\text{Attendance Rate} = \begin{cases} 100.0\% & \text{if Conducted} = 0 \\ \left(\dfrac{\text{Classes Attended}}{\text{Classes Conducted}}\right) \times 100 & \text{if Conducted} > 0 \end{cases}$$

### 2. Verified Safe Skips Remaining
Given a target percentage $T$ (where $T_{\text{dec}} = \frac{T}{100}$) and total semester availability $N_{\text{total}}$:

$$\text{Safe Skips} = \left\lfloor N_{\text{total}} \times (1 - T_{\text{dec}}) \right\rfloor - \text{Classes Absent}$$

- **$\text{Safe Skips} > 0$ (`SAFE`)**: You remain above your required minimum even if you skip these classes.
- **$\text{Safe Skips} = 0$ (`WARNING`)**: You sit directly at the threshold boundary. Any absence triggers a deficit.

### 3. Deficit Recovery Requirement
When standing falls below the target threshold ($\text{Safe Skips} < 0$), the engine computes the required recovery attendance:

$$\text{Classes to Attend} = \left\lceil T_{\text{dec}} \times N_{\text{total}} \right\rceil - \text{Classes Attended}$$

If $\text{Classes to Attend} > \text{Classes Remaining}$, the system flags an irrecoverable semester deficit so the student can seek departmental waivers before exams.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Interface (PWA / Next.js)"]
        UI["Next.js 16 App Router\n(React 19 + Tailwind CSS)"]
        OfflineQueue["Offline Queue Handler\n(LocalStorage / IndexedDB)"]
        MathEngine["Deterministic Math Engine\n(calculateSubjectStats)"]
    end

    subgraph AI["Intelligent Ingestion"]
        Upload["Timetable Photo / Screenshot"] --> Gemini["Google Gemini Vision API\n(@google/genai)"]
        Gemini --> SchemaParser["Structured Schedule Extractor\n(Subjects, Slots, Holidays)"]
    end

    subgraph Backend["Cloud & Database Infrastructure"]
        SupabaseAuth["Supabase Auth (Student ID / Email)"]
        SupabaseDB[("PostgreSQL Database\n(Profiles, Subjects, Slots, Logs)")]
        Vercel["Vercel Edge & Serverless Functions"]
    end

    SchemaParser --> UI
    UI --> MathEngine
    UI <--> OfflineQueue
    OfflineQueue <--> SupabaseDB
    UI <--> SupabaseAuth
    UI <--> SupabaseDB
    UI --> ICS["RFC 5545 .ics Calendar Export"]
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
│   ├── banner.png              # High-resolution 1200x630 project banner
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

[🌐 Launch Live App](https://skiply-kk.vercel.app/) · [🐛 Report Issue](https://github.com/Yash4305d-y/Skiply/issues) · [💡 Request Feature](https://github.com/Yash4305d-y/Skiply/pulls)

</div>
