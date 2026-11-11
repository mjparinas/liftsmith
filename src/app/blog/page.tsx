import type { Metadata } from "next";
import Link from "next/link";

import { Crumbs, CtaBanner, CtaInline, JsonLd, SitePage } from "@/components/site/SiteChrome";
import { readMinutes } from "@/content/articles";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";
import { articlePath, articlesOf } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Blog: strength training, made simple",
  description:
    "Plain-words articles on building muscle and strength: sets, rest, warm-ups, plateaus, recovery, home workouts, nutrition and more.",
  path: "/blog/",
});

export default function BlogIndex() {
  const posts = articlesOf("blog");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${BRAND.name} blog`,
    url: `${SITE_URL}/blog/`,
    blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${SITE_URL}${articlePath(p)}`, datePublished: p.date })),
  };
  const [first, ...rest] = posts;
  return (
    <SitePage kind="blog-index">
      <JsonLd data={jsonLd} />
      <Crumbs items={[{ label: "Blog" }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">Strength training, made simple</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Short, practical articles on lifting: what to do, why it works, and how to stop guessing. Every one ends with a way to put it into
        practice today.
      </p>
      <CtaInline
        cta="blog-index-top"
        title={`Rather skip the reading? ${BRAND.name} plans it all for you.`}
        body="Every set, rep and weight, picked from your equipment and recovery, and moved forward each session."
        button="Get today's workout"
      />
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {[first, ...rest].map((p, i) => (
          <li key={p.slug} className={i === 0 ? "md:col-span-2" : ""}>
            <Link href={articlePath(p)} className="card press block h-full p-5 hover:border-accent/60">
              <span className="text-xs font-semibold tracking-wide text-accent uppercase">{p.tag}</span>
              <span className={`mt-1 block font-bold tracking-tight ${i === 0 ? "text-2xl" : "text-lg"}`}>{p.title}</span>
              <span className="mt-2 block text-sm text-muted">{p.description}</span>
              <span className="mt-3 block text-xs text-muted">{readMinutes(p)} min read</span>
            </Link>
          </li>
        ))}
      </ul>
      <CtaBanner
        cta="blog-index-end"
        title="Put it into practice today"
        body={`${BRAND.name} turns all of this into a workout you can start right now: the right exercises, sets, reps, weights and rest, adjusted every session.`}
      />
    </SitePage>
  );
}
