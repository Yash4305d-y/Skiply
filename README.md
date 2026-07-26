# ⚡ Skiply — AI-Powered Attendance Planner & Safe-Skip Predictor

> **Stop manually building timetables.** Skiply uses Vision AI to parse your college schedule and holiday list in seconds, then transitions into an offline-first, single-tap progressive web app that answers one critical question: *"How many classes can I safely miss without failing my attendance requirement?"*

---

## 🌟 Overview

Most attendance trackers fail because of friction: students hate manually typing in course codes, room numbers, lecture hours, and academic calendars. 

**Skiply (Attendra)** eliminates this onboarding barrier. By uploading two simple screenshots—your weekly class timetable and your semester holiday list—our cloud AI extracts and builds your entire semester schedule automatically. Once configured, Skiply relies entirely on a **deterministic, on-device math engine** to track daily attendance, ensuring zero latency and 100% offline functionality in dead-zone lecture halls.

---

## ✨ Key Features

* **🤖 AI Vision Onboarding:** Powered by Google Gemini 1.5 Pro/Flash. Upload an image of your timetable and holiday list; the AI extracts subjects, merged multi-hour labs, timings, and dates into structured JSON.
* **🎯 Subject-Wise Safe-Skip Math Engine:** Attendance is enforced per course. Skiply calculates your exact buffer for *each individual subject*, telling you precisely when you can sleep in—and when you are in the "Danger Zone."
* **👆 One-Tap Daily Tracking:** Mark lectures as **Present**, **Absent**, or **Cancelled** with single-tap cards featuring instant optimistic UI updates.
* **📅 Visual Calendar History:** Audit your semester through a monthly grid featuring color-coded badges (🟢 Present, 🔴 Absent, ⚪ Cancelled/Holiday, 🔵 Upcoming) and an interactive Day Drawer for retroactive edits.
* **📊 Smart Analytics & AI Insights:** Dedicated subject cards display real-time progress bars, skip allowances, and a 2-sentence AI summary of your overall academic standing.
* **📴 Offline-First PWA:** Built with Serwist. Works seamlessly without cell reception in college basements. Taps are queued locally in IndexedDB and automatically sync to the cloud the moment connectivity returns.
* **🔐 Unique Student ID Auth:** Uses a custom Virtual Email Proxy (`studentid@skiply.internal`) with Supabase Auth, allowing students to log in natively using their Roll Number / Student ID and password.

---

## 🛠️ Tech Stack

| Component | Technologies Used |
| :--- | :--- |
| **Frontend Framework** | [Next.js 14+](https://nextjs.org/) (App Router), TypeScript, React |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives), Lucide Icons |
| **Backend & Database** | [Supabase](https://supabase.com/) (PostgreSQL, Supabase Auth, Row Level Security, Server Actions) |
| **AI Vision & Parsing** | [Google GenAI SDK](https://ai.google.dev/) (`gemini-1.5-pro` / `gemini-1.5-flash`) |
| **PWA & Offline Sync** | [Serwist](https://serwist.pages.dev/) (`@serwist/next`), IndexedDB / LocalStorage Queueing |
| **Deployment** | [Vercel](https://vercel.com/) (Serverless Edge Functions, Zero-Config PWA Hosting) |

---

## 📐 The Math Engine: Safe Skips & Recovery

Skiply **never** uses AI to calculate attendance percentages. All daily tracking relies on a robust, deterministic TypeScript algorithm that dynamically evaluates remaining lectures:

### 1. Safe Skips Available (S)
To determine how many additional classes you can miss across the remainder of the semester while staying above your target percentage (`T_req`, typically 75%):

`S = floor(P + T_remaining - ((T_req / 100) * T_total_expected))`

*(Where `P` is Present classes logged, `T_remaining` is scheduled future classes excluding holidays, and `T_total_expected` is conducted classes plus remaining classes).*

### 2. Danger Zone Recovery Classes (N)
If `S < 0`, the student has breached the threshold. Skiply calculates the exact number of **consecutive upcoming classes** (`N`) they must attend to recover:

`N = ceil(((T_req / 100 * T_conducted) - P) / (1 - (T_req / 100)))`

---

## 🚀 Getting Started (Local Development)

### Prerequisites
* **Node.js** (v18.17 or higher) & **npm** / **pnpm** / **bun**
* A free [Supabase](https://supabase.com) account & project
* A free [Google AI Studio](https://aistudio.google.com/) API key (Gemini)

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/skiply.git](https://github.com/yourusername/skiply.git)
cd skiply
