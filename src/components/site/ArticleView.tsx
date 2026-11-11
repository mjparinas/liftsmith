// One guide or blog post: title, a call to action right under the intro, the body with its own calls to
// action, related exercises, questions, related reading and the big banner at the end.
import Link from "next/link";
import type { ReactNode } from "react";

import { CTA_COPY, readMinutes, type Article, type Block } from "@/content/articles";
import { topicOf, topicPath } from "@/content/blogTopics";
import { BRAND } from "@/lib/brand";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { ogImage } from "@/lib/ogImages";
import { articlePath, MUSCLE_NAME } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

import { Crumbs, CtaBanner, CtaButton, CtaInline, JsonLd, LinkGrid } from "./SiteChrome";

/** [label](/path/) and **bold** inside a line of text. */
export function rich(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1])
      out.push(
        <Link
          key={i++}
          href={m[2]}
          className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
        >
          {m[1]}
        </Link>,
      );
    else
      out.push(
        <strong key={i++} className="font-semibold text-ink">
          {m[3]}
        </strong>,
      );
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Every link inside an article's text, for the tests. */
export function linksIn(text: string): string[] {
  return [...text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((m) => m[1]);
}

function BlockView({ b, a, n }: { b: Block; a: Article; n: number }) {
  if ("h2" in b) return <h2 className="mt-10 text-2xl font-bold tracking-tight">{b.h2}</h2>;
  if ("p" in b) return <p className="mt-4 leading-relaxed text-muted">{rich(b.p)}</p>;
  if ("ul" in b)
    return (
      <ul className="mt-4 list-disc space-y-2 pl-6 leading-relaxed text-muted">
        {b.ul.map((x, i) => (
          <li key={i}>{rich(x)}</li>
        ))}
      </ul>
    );
  if ("ol" in b)
    return (
      <ol className="mt-4 list-decimal space-y-2 pl-6 leading-relaxed text-muted">
        {b.ol.map((x, i) => (
          <li key={i}>{rich(x)}</li>
        ))}
      </ol>
    );
  if ("tip" in b)
    return (
      <p className="card mt-6 border-l-4 border-l-accent p-4 leading-relaxed">
        <span className="font-semibold">Tip: </span>
        <span className="text-muted">{rich(b.tip)}</span>
      </p>
    );
  if ("cta" in b) {
    const c = CTA_COPY[b.cta];
    return <CtaInline cta={`${a.kind}-mid${n ? `-${n + 1}` : ""}`} title={c.title} body={c.body} button={c.button} />;
  }
  return (
    <LinkGrid
      items={b.exercises.map((id) => {
        const e = EXERCISE_BY_ID.get(id)!;
        return { href: `/exercises/${id}/`, title: e.name, meta: e.primary.map((m) => MUSCLE_NAME[m]).join(", ") };
      })}
    />
  );
}

const longDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

export function ArticleView({ a, related }: { a: Article; related: Article[] }) {
  const url = `${SITE_URL}${articlePath(a)}`;
  const topic = a.kind === "blog" ? topicOf(a) : undefined;
  const section = a.kind === "guide" ? { href: "/guides/", label: "Guides" } : { href: "/blog/", label: "Blog" };
  const top = CTA_COPY[a.cta];
  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": a.kind === "guide" ? "Article" : "BlogPosting",
      headline: a.title,
      description: a.description,
      datePublished: a.date,
      dateModified: a.updated ?? a.date,
      mainEntityOfPage: url,
      url,
      image: `${SITE_URL}${ogImage(articlePath(a))}`,
      author: { "@type": "Organization", name: BRAND.name, url: SITE_URL },
      publisher: {
        "@type": "Organization",
        name: BRAND.name,
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png` },
      },
    },
  ];
  if (a.faq?.length)
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: a.faq.map(([q, ans]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: ans } })),
    });
  let ctas = 0;
  const [intro, ...rest] = a.body;
  return (
    <article>
      <JsonLd data={jsonLd} />
      <Crumbs
        items={topic ? [section, { href: topicPath(topic), label: topic.name }, { label: a.title }] : [section, { label: a.title }]}
      />
      <p className="mt-6 text-sm font-semibold tracking-wide text-accent uppercase">{a.tag}</p>
      <h1 className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight md:text-5xl">{a.title}</h1>
      <p className="mt-3 text-sm text-muted">
        <time dateTime={a.date}>{longDate(a.date)}</time>
        {a.updated && a.updated !== a.date ? (
          <>
            {" "}
            · Updated <time dateTime={a.updated}>{longDate(a.updated)}</time>
          </>
        ) : null}{" "}
        · {readMinutes(a)} min read
      </p>
      <div className="max-w-3xl">
        {intro && <BlockView b={intro} a={a} n={0} />}
        {/* Call to action at the top: for readers who already know what they want. */}
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4">
          <p className="min-w-0 flex-1 text-sm">
            <span className="font-semibold">{top.title}.</span> <span className="text-muted">Free to start, no account needed.</span>
          </p>
          <CtaButton cta={`${a.kind}-top`}>{top.button}</CtaButton>
        </div>
        {rest.map((b, i) => {
          const n = "cta" in b ? ctas++ : 0;
          return <BlockView key={i} b={b} a={a} n={n} />;
        })}
        {a.faq?.length ? (
          <section className="mt-10">
            <h2 className="text-2xl font-bold tracking-tight">Questions</h2>
            <dl className="mt-4 space-y-5">
              {a.faq.map(([q, ans]) => (
                <div key={q}>
                  <dt className="font-semibold">{q}</dt>
                  <dd className="mt-1 text-muted">{ans}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </div>
      <CtaBanner cta={`${a.kind}-end`} title={top.title} body={top.body} button={top.button} />
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight">Keep reading</h2>
          <LinkGrid items={related.map((r) => ({ href: articlePath(r), title: r.title, body: r.description, meta: r.tag }))} />
        </section>
      )}
    </article>
  );
}

/** Up to three other articles: same tag first, then guides, then the newest. */
export function relatedTo(a: Article, all: Article[]): Article[] {
  const others = all.filter((x) => x !== a);
  const score = (x: Article) => (x.tag === a.tag ? 2 : 0) + (x.kind === "guide" ? 1 : 0);
  return [...others].sort((x, y) => score(y) - score(x) || y.date.localeCompare(x.date) || x.slug.localeCompare(y.slug)).slice(0, 3);
}
