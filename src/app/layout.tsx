import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";
import { SiteBeacon } from "@/components/SiteBeacon";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.name}: adaptive strength training`, template: `%s | ${BRAND.name}` },
  description: "Workouts built around your equipment, your recovery and your time. Progressive overload, RIR blocks and deloads, with a plate-loading guide for every barbell set.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
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
      </body>
    </html>
  );
}
