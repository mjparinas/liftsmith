// "Build 3336dee": the commit the running website was built from (src/lib/build.ts), as plain text
// (Melvin, 2026-11-11: no link to GitHub). Used in the site footer and the admin header; the app shows it in Settings.
import { COMMIT } from "@/lib/build";

export function BuildStamp({ className = "" }: { className?: string }) {
  return <span className={`tabular-nums ${className}`}>Build {COMMIT}</span>;
}
