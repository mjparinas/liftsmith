// The row of blog topics, on the blog index and each topic page.
import Link from "next/link";

import { BLOG_TOPICS, topicPath } from "@/content/blogTopics";

export function BlogTopicChips({ current }: { current?: string }) {
  return (
    <nav aria-label="Blog topics" className="mt-6">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href="/blog/"
            aria-current={current ? undefined : "page"}
            className={`press inline-flex min-h-11 items-center rounded-full border px-4 text-sm ${current ? "border-line bg-surface" : "border-accent/50 bg-accent/10 font-medium"}`}
          >
            All posts
          </Link>
        </li>
        {BLOG_TOPICS.map((t) => (
          <li key={t.slug}>
            <Link
              href={topicPath(t)}
              aria-current={current === t.slug ? "page" : undefined}
              className={`press inline-flex min-h-11 items-center rounded-full border px-4 text-sm ${current === t.slug ? "border-accent/50 bg-accent/10 font-medium" : "border-line bg-surface"}`}
            >
              {t.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
