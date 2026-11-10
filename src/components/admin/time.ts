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
