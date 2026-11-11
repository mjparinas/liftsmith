import type { Metadata, Viewport } from "next";

import "./globals.css";

import { SiteBeacon } from "@/components/SiteBeacon";
import { VercelAnalytics } from "@/components/VercelAnalytics";
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.name}: adaptive strength training`, template: `%s | ${BRAND.name}` },
  description:
    "Workouts built around your equipment, your recovery and your time. Progressive overload, RIR blocks and deloads, with a plate-loading guide for every barbell set.",
  // Let search engines show large image previews and full snippets (Google Discover needs large images).
  // Pages that must stay out of search (the app, /me/, share pages) set their own robots.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  // The default preview for any page that doesn't set its own (public pages use pageMeta, src/lib/pageMeta.ts).
  openGraph: { siteName: BRAND.name, type: "website", images: [{ url: "/og/default.jpg", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: ["/og/default.jpg"] },
  manifest: "/manifest.webmanifest",
  // Drawn by scripts/make-icons.mjs: SVG for modern browsers, .ico for the rest, a full-square PNG for iOS.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0d12",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body className="min-h-dvh antialiased">
        {children}
        <SiteBeacon />
        <VercelAnalytics />
      </body>
    </html>
  );
}
