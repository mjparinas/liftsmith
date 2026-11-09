import type { NextConfig } from "next";

// A static export: the whole app is one offline page (hash routes), so the same files can be served
// from the web, wrapped by Bubblewrap, or bundled into a Capacitor shell.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
