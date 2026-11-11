// The row of help topics, on /help/ and each /help/<topic>/ page.
import Link from "next/link";

import { HELP, helpPath } from "@/lib/faqs";

const chip = (on: boolean) =>
  `press inline-flex min-h-11 items-center rounded-full border px-4 text-sm ${on ? "border-accent/50 bg-accent/10 font-medium" : "border-line bg-surface"}`;

export function HelpTopicChips({ current }: { current?: string }) {
  return (
    <nav aria-label="Help topics" className="-mt-4">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link href="/help/" aria-current={current ? undefined : "page"} className={chip(!current)}>
            All questions
          </Link>
        </li>
        {HELP.map((t) => (
          <li key={t.id}>
            <Link href={helpPath(t)} aria-current={current === t.id ? "page" : undefined} className={chip(current === t.id)}>
              {t.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
