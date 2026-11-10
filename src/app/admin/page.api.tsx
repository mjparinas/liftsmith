// /admin/: the admin panel. Server build only (named page.api.tsx, so the static export for the native shells
// leaves it out). Never indexed; disallowed in robots.txt.
import type { Metadata } from "next";

import { AdminApp } from "@/components/admin/AdminApp";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminApp />;
}
