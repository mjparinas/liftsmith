// A translated tool page (/<lang>/tools/<slug>/; docs/decisions/public-pages-and-seo.md "Translated tools"): the
// shared tool frame with the page's words from src/locales/site/tools/<lang>.ts, and the calculator handed only that
// language's words. The English pages keep their own files under src/app/tools/.
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OneRmCalculator } from "@/components/site/OneRmCalculator";
import { PlateCalculator } from "@/components/site/PlateCalculator";
import { ToolPage } from "@/components/site/ToolPage";
import { WarmupCalculator } from "@/components/site/WarmupCalculator";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";
import { fill } from "@/lib/siteLang";
import { WARMUP_REST } from "@/lib/warmup";
import type { GuideLang } from "@/locales/site/exercise";
import { isLocalTool, LOCAL_TOOLS } from "@/locales/site/tools";
import { LOCAL_TOOL_SLUGS, type LocalToolSlug } from "@/locales/site/tools/types";

export const localToolParams = () => LOCAL_TOOL_SLUGS.map((slug) => ({ slug }));

const vars = { app: BRAND.name, rest: WARMUP_REST };
const f = (s: string) => fill(s, vars);

export function localToolMeta(lang: GuideLang, slug: string): Metadata {
  if (!isLocalTool(slug)) return {};
  const { page } = LOCAL_TOOLS[lang][slug];
  return pageMeta({ title: f(page.title), description: f(page.description), path: `/tools/${slug}/`, lang });
}

function calculator(lang: GuideLang, slug: LocalToolSlug) {
  const tools = LOCAL_TOOLS[lang];
  switch (slug) {
    case "plate-calculator":
      return <PlateCalculator t={tools[slug].ui} />;
    case "one-rep-max-calculator":
      return <OneRmCalculator t={tools[slug].ui} />;
    case "warm-up-calculator":
      return <WarmupCalculator t={tools[slug].ui} />;
  }
}

export function LocalToolView({ lang, slug }: { lang: GuideLang; slug: string }) {
  if (!isLocalTool(slug)) notFound();
  const tools = LOCAL_TOOLS[lang];
  const { page } = tools[slug];
  return (
    <ToolPage
      slug={slug}
      lang={lang}
      frame={tools.frame}
      translated
      name={page.name}
      intro={f(page.intro)}
      sticky={f(page.sticky)}
      mid={{ title: f(page.mid.title), body: f(page.mid.body), button: f(page.mid.button) }}
      end={{ title: f(page.end.title), body: f(page.end.body) }}
      faq={page.faq.map(([q, a]) => [f(q), f(a)])}
      more={
        page.more ? (
          <>
            <h2 className="text-2xl font-bold tracking-tight">{page.more.heading}</h2>
            {page.more.paragraphs.map((p) => (
              <p key={p} className="text-muted">
                {f(p)}
              </p>
            ))}
          </>
        ) : undefined
      }
      reading={page.reading}
    >
      {calculator(lang, slug)}
    </ToolPage>
  );
}
