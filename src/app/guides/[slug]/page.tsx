import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLES, ARTICLE_BY_SLUG } from "@/content/articles";
import { ArticleView, relatedTo } from "@/components/site/ArticleView";
import { SitePage } from "@/components/site/SiteChrome";
import { articlesOf } from "@/lib/seo";

export const dynamicParams = false;
export const generateStaticParams = () => articlesOf("guide").map((a) => ({ slug: a.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = ARTICLE_BY_SLUG.get(`guide/${(await params).slug}`);
  if (!a) return {};
  return { title: a.title, description: a.description, alternates: { canonical: `/guides/${a.slug}/` }, openGraph: { type: "article", title: a.title, description: a.description, publishedTime: a.date } };
}

export default async function GuidePage({ params }: Props) {
  const a = ARTICLE_BY_SLUG.get(`guide/${(await params).slug}`);
  if (!a) notFound();
  return (
    <SitePage kind="guide">
      <ArticleView a={a} related={relatedTo(a, ARTICLES)} />
    </SitePage>
  );
}
