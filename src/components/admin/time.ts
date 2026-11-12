// Times in the admin panel: a short date and time, and "3 days ago".
export const when = (t: number) =>
  new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function ago(t: number, now = Date.now()): string {
  const s = Math.round((now - t) / 1000);
  if (s < 0) return when(t);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

/** Just the day ("Nov 12"), for tight table columns; the full time goes in the cell's title. */
export const shortDay = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const names = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en-CA"], { type: "region" }) : null;
/** A country's name from its two-letter code ("GB" → "United Kingdom"); anything else is shown as it is. */
export function countryName(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return code;
  try {
    return names?.of(code) ?? code;
  } catch {
    return code;
  }
}
