// "Build 3336dee", linked to the commit on GitHub: the commit the running website was built from
// (src/lib/build.ts). Used in the site footer and the admin header; the app shows it in Settings.
import { COMMIT, commitUrl } from "@/lib/build";

export function BuildStamp({ className = "" }: { className?: string }) {
  const url = commitUrl();
  const label = `Build ${COMMIT}`;
  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className={`tabular-nums text-muted underline ${className}`}>
      {label}
    </a>
  ) : (
    <span className={`tabular-nums text-muted ${className}`}>{label}</span>
  );
}
