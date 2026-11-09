// The side-by-side rows on a comparison page. Every fact about the other app shows its source and the date
// it was checked; rows the other app's pages don't cover are left out rather than guessed.
import { OURS, TOPIC_LABEL, type Competitor, type Topic } from "@/content/compare";
import { BRAND } from "@/lib/brand";

const when = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");

export function CompareTable({ c }: { c: Competitor }) {
  const topics = (Object.keys(TOPIC_LABEL) as Topic[]).filter((t) => c.rows[t]?.length);
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-line">
      <div className="hidden grid-cols-[10rem_1fr_1fr] gap-4 border-b border-line bg-surface px-4 py-3 text-sm font-semibold md:grid">
        <span />
        <span className="text-accent">{BRAND.name}</span>
        <span>{c.name}</span>
      </div>
      <dl>
        {topics.map((t) => (
          <div key={t} className="grid gap-2 border-b border-line/60 px-4 py-4 last:border-b-0 md:grid-cols-[10rem_1fr_1fr] md:gap-4">
            <dt className="font-semibold">{TOPIC_LABEL[t]}</dt>
            <dd className="text-sm">
              <span className="font-semibold text-accent md:hidden">{BRAND.name}: </span>
              {OURS[t]}
            </dd>
            <dd className="text-sm text-muted">
              <span className="font-semibold text-ink md:hidden">{c.name}: </span>
              {c.rows[t]!.map((x, i) => (
                <span key={i} className="block">
                  {x.text}{" "}
                  <a href={x.source} rel="nofollow noopener" className="text-xs whitespace-nowrap underline underline-offset-2">{host(x.source)}, checked {when(x.checked)}</a>
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
