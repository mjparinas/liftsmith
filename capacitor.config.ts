import type { CapacitorConfig } from "@capacitor/cli";

// The Android and iOS apps wrap the same static export (out/). Package id is permanent after the first store upload.
const config: CapacitorConfig = {
  appId: "com.liftsmith.app",
  appName: "Liftsmith",
  webDir: "out",
  backgroundColor: "#0a0d12",
  android: { backgroundColor: "#0a0d12" },
  ios: { backgroundColor: "#0a0d12", contentInset: "never" },
  // The app lives at /app/ inside the export; the landing page at / is for the website only.
  server: { androidScheme: "https", iosScheme: "liftsmith", appStartPath: "/app/index.html" },
  plugins: { StatusBar: { style: "DARK", backgroundColor: "#0a0d12", overlaysWebView: false } },
};

export default config;
