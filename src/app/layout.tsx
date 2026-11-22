import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import NavigationHandler from "@/components/providers/navigation-handler";
import { PerformanceTierProvider } from "@/lib/utils/use-performance-tier";
import PerformanceClassApplier from "@/components/providers/performance-class-applier";
import BottomNav from "@/components/layout/bottom-nav";
import RubberBandContainer from "@/components/ui/rubber-band-container";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

import { LazyMotion, domAnimation } from "framer-motion";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://skiply.app'),
  title: "Skiply — AI-Powered Attendance Planner & Safe Skip Calculator",
  description: "Automate college attendance tracking with AI. Upload your timetable and calendar once, mark attendance with a single tap, and know exactly how many classes you can safely skip while maintaining your target percentage.",
  keywords: ["attendance", "college", "timetable", "AI tracker", "safe skip", "university schedule", "student app"],
  authors: [{ name: "Skiply Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Skiply — AI Attendance Planner & Safe Skip Calculator",
    description: "Upload your timetable once. Track your classes and know your exact safe skip margins before every lecture.",
    url: "https://skiply.app",
    siteName: "Skiply",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "Skiply — Attendance planner and safe skip margins",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skiply — AI Attendance Planner",
    description: "Know exactly when you can safely skip.",
    images: ["/banner.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0C0E",
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
      <body className="min-h-full flex flex-col bg-[#0B0C0E] text-white font-sans selection:bg-teal-400 selection:text-slate-950">
        <PerformanceTierProvider>
          <PerformanceClassApplier />
          <NavigationHandler />
          <LazyMotion features={domAnimation} strict>
            <RubberBandContainer className="flex-1 flex flex-col min-h-full">
              {children}
            </RubberBandContainer>
            <BottomNav />
          </LazyMotion>
        </PerformanceTierProvider>
      </body>
    </html>
  );
}
