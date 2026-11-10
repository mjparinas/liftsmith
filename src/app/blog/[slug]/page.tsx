import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleView, relatedTo } from "@/components/site/ArticleView";
import { SitePage } from "@/components/site/SiteChrome";
import { ARTICLE_BY_SLUG, ARTICLES } from "@/content/articles";
import { articlesOf } from "@/lib/seo";

export const dynamicParams = false;
export const generateStaticParams = () => articlesOf("blog").map((a) => ({ slug: a.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = ARTICLE_BY_SLUG.get(`blog/${(await params).slug}`);
  if (!a) return {};
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: `/blog/${a.slug}/` },
    openGraph: { type: "article", title: a.title, description: a.description, publishedTime: a.date },
  };
}

export default async function BlogPost({ params }: Props) {
  const a = ARTICLE_BY_SLUG.get(`blog/${(await params).slug}`);
  if (!a) notFound();
  return (
    <SitePage kind="blog">
      <ArticleView a={a} related={relatedTo(a, ARTICLES)} />
    </SitePage>
  );
}
