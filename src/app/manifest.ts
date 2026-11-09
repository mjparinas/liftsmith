import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.name,
    start_url: "/app/",
    display: "standalone",
    background_color: "#0a0d12",
    theme_color: "#0a0d12",
    // Drawn by scripts/make-icons.mjs. PNGs for installers that skip SVG; the maskable one keeps the
    // mark inside the 40% safe circle for Android's shaped icons.
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon-mono.svg", sizes: "any", type: "image/svg+xml", purpose: "monochrome" },
    ],
    // Long-press the installed app's icon. The same actions as the native shortcuts (src/lib/shortcuts.ts).
    shortcuts: [
      { name: "Start workout", short_name: "Start", url: "/app/?do=start", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] },
      { name: "Log set", short_name: "Log set", url: "/app/?do=log", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] },
    ],
  };
}
