import { dayLabel, NEWS_KIND_LABEL, type NewsDay } from "@/lib/whatsNew";

// Each kind's chip is a tint from the palette; the label says the kind in words.
const TINT = { new: "var(--color-mint)", better: "var(--color-accent)", fixed: "var(--color-ember)" } as const;

/** One day's changes, with the day as its anchor (/whats-new/#2026-11-09). */
export function NewsDayCard({ entry }: { entry: NewsDay }) {
  return (
    <section id={entry.day} aria-labelledby={`d-${entry.day}`} className="card scroll-mt-20 p-6">
      <p className="text-sm text-muted">
        <time dateTime={entry.day}>{dayLabel(entry.day)}</time>
      </p>
      <h2 id={`d-${entry.day}`} className="mt-1 text-2xl font-bold tracking-tight">
        {entry.headline}
      </h2>
      <ul className="mt-4 flex flex-col gap-5">
        {entry.items.map((item) => (
          <li key={item.title}>
            <span
              className="rounded-full border px-2.5 py-0.5 text-xs font-bold text-ink"
              style={{
                borderColor: `color-mix(in srgb, ${TINT[item.kind]} 50%, transparent)`,
                background: `color-mix(in srgb, ${TINT[item.kind]} 16%, transparent)`,
              }}
            >
              {NEWS_KIND_LABEL[item.kind]}
            </span>
            <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
            <p className="mt-1 leading-relaxed text-muted">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
