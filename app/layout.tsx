import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorker } from "@/components/service-worker";
import { AnalyticsConsent } from "@/components/analytics-consent";
import { AnalyticsNavigation } from "@/components/analytics-navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://quote-chaser.com"),
  title: { default: "Quote-Chaser", template: "%s | Quote-Chaser" },
  description: "Follow up quotes and win more work.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
  applicationName: "Quote-Chaser",
  formatDetection: { telephone: false, address: false, email: false },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en-GB"><body>{children}<ServiceWorker /><Suspense fallback={null}><AnalyticsNavigation /></Suspense><AnalyticsConsent /></body></html>;
}
