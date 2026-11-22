import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import NavigationHandler from "@/components/providers/navigation-handler";
import { PerformanceTierProvider } from "@/lib/utils/use-performance-tier";
import PerformanceClassApplier from "@/components/providers/performance-class-applier";
import BottomNav from "@/components/layout/bottom-nav";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "optional",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

import { LazyMotion, domAnimation } from "framer-motion";

export const metadata: Metadata = {
  title: "Skiply — AI-Powered Attendance Planner & Safe Skip Calculator",
  description: "Automate college attendance tracking with AI. Upload your timetable and calendar once, mark attendance with a single tap, and know exactly how many classes you can safely skip while maintaining your target percentage.",
  keywords: ["attendance", "college", "timetable", "AI tracker", "safe skip", "university schedule", "student app"],
  authors: [{ name: "Skiply Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${instrumentSerif.variable} h-full antialiased dark`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col bg-[#0B0C0E] text-slate-100 font-sans selection:bg-teal-400 selection:text-slate-950">
        <PerformanceTierProvider>
          <PerformanceClassApplier />
          <NavigationHandler />
          <LazyMotion features={domAnimation} strict>
            {children}
            <BottomNav />
          </LazyMotion>
        </PerformanceTierProvider>
      </body>
    </html>
  );
}
