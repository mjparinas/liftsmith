import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogTopicChips } from "@/components/site/BlogTopicChips";
import { Crumbs, CtaBanner, JsonLd, SitePage } from "@/components/site/SiteChrome";
import { readMinutes } from "@/content/articles";
import { BLOG_TOPIC_BY_SLUG, BLOG_TOPICS, postsIn, topicPath } from "@/content/blogTopics";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";
import { articlePath } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => BLOG_TOPICS.map((t) => ({ topic: t.slug }));

type Props = { params: Promise<{ topic: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = BLOG_TOPIC_BY_SLUG.get((await params).topic);
  if (!t) return {};
  return pageMeta({ title: t.title, description: t.description, path: topicPath(t) });
}

export default async function BlogTopicPage({ params }: Props) {
  const t = BLOG_TOPIC_BY_SLUG.get((await params).topic);
  if (!t) notFound();
  const posts = postsIn(t);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t.title,
    description: t.description,
    url: `${SITE_URL}${topicPath(t)}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${articlePath(p)}`, name: p.title })),
    },
  };
  return (
    <SitePage kind="blog-topic">
      <JsonLd data={jsonLd} />
      <Crumbs items={[{ href: "/blog/", label: "Blog" }, { label: t.name }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{t.name}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{t.intro}</p>
      <BlogTopicChips current={t.slug} />
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link href={articlePath(p)} className="card press block h-full p-5 hover:border-accent/60">
              <span className="text-xs font-semibold tracking-wide text-accent uppercase">{p.tag}</span>
              <span className="mt-1 block text-lg font-bold tracking-tight">{p.title}</span>
              <span className="mt-2 block text-sm text-muted">{p.description}</span>
              <span className="mt-3 block text-xs text-muted">{readMinutes(p)} min read</span>
            </Link>
          </li>
        ))}
      </ul>
      <CtaBanner
        cta="blog-topic-end"
        title="Put it into practice today"
        body={`${BRAND.name} turns all of this into a workout you can start right now: the right exercises, sets, reps, weights and rest, adjusted every session.`}
      />
    </SitePage>
  );
}
