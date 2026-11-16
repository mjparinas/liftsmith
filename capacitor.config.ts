import type { CapacitorConfig } from "@capacitor/cli";

/** The Capacitor plugins in the Android app: every one in package.json but @capacitor/status-bar. */
export const ANDROID_PLUGINS = [
  "@capacitor-community/bluetooth-le",
  "@capacitor/app",
  "@capacitor/device",
  "@capacitor/filesystem",
  "@capacitor/geolocation",
  "@capacitor/haptics",
  "@capacitor/local-notifications",
  "@capacitor/push-notifications",
  "@capacitor/share",
  "@capacitor/text-zoom",
  "@capgo/capacitor-health",
  "@revenuecat/purchases-capacitor",
];

// The Android and iOS apps wrap the same static export (out/). Package id is permanent after the first store upload.
const config: CapacitorConfig = {
  appId: "com.getliftsmith.app",
  appName: "Liftsmith",
  webDir: "out",
  backgroundColor: "#0a0d12",
  android: {
    backgroundColor: "#0a0d12",
    // Every native plugin except @capacitor/status-bar, whose colour calls Play flags as deprecated edge-to-edge APIs.
    // Android goes edge to edge in MainActivity and styles the bars with Capacitor's own SystemBars
    // (docs/decisions/platform-deltas.md). capacitorConfig.test.ts fails when a new plugin is missing here.
    includePlugins: ANDROID_PLUGINS,
  },
  ios: { backgroundColor: "#0a0d12", contentInset: "never" },
  // The app lives at /app/ inside the export; the landing page at / is for the website only.
  server: { androidScheme: "https", iosScheme: "liftsmith", appStartPath: "/app/index.html" },
  plugins: {
    // iOS only (Android leaves the plugin out, above).
    StatusBar: { style: "DARK", backgroundColor: "#0a0d12", overlaysWebView: false },
    // Android's bars: light icons to start, as the app opens dark; appearance.ts follows the theme. The page uses
    // viewport-fit=cover, so the hint saves a layout jump on the first frame.
    SystemBars: { style: "DARK", initialViewportFitValueHint: "cover" },
    // Reminders (src/lib/reminders.ts): the same monochrome status-bar icon as the workout notification.
    LocalNotifications: { smallIcon: "ic_stat_workout", iconColor: "#4c8dff" },
  },
};

export default config;
