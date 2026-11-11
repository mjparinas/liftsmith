// Which code this build was made from (Melvin, 2026-11-11: "a short commit hash somewhere in the app so i know
// what code has been released"). next.config.ts stamps the commit at build time: Vercel's own commit on the
// website, GitHub's in CI and the release builds (so the Android and iOS apps carry the commit of the web
// bundle they ship), and `git rev-parse` on a laptop. Shown in Settings, the admin header and the site footer, as plain text.

/** The package version, "0.1.0". */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";

/** The full commit hash, or "" when the build couldn't tell. */
export const COMMIT_SHA = process.env.NEXT_PUBLIC_COMMIT_SHA ?? "";

/** The short commit hash (7 characters), or "dev". */
export const COMMIT = shortCommit(COMMIT_SHA);

export function shortCommit(sha: string): string {
  const s = sha.trim().toLowerCase();
  return /^[0-9a-f]{7,40}$/.test(s) ? s.slice(0, 7) : "dev";
}

/** "0.1.0 (8)" with the store build number on Android and iOS, "0.1.0" on the web. */
export function versionLabel(native?: { appVersion?: string; build?: string } | null): string {
  const v = native?.appVersion || APP_VERSION;
  return native?.build ? `${v} (${native.build})` : v;
}
