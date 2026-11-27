import type { Metadata } from "next";

import { generatorProps } from "@/components/site/generatorProps";
import { ToolPage } from "@/components/site/ToolPage";
import { WorkoutGenerator } from "@/components/site/WorkoutGenerator";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";
import { fill } from "@/lib/siteLang";
import { GEN_PAGE_EN as P } from "@/locales/site/tools/gen/en";

// The free workout generator (docs/decisions/workout-generator.md). The words are in src/locales/site/tools/gen/.
const f = (s: string) => fill(s, { app: BRAND.name });

export const metadata: Metadata = pageMeta({
  title: P.title,
  description: P.description,
  path: "/tools/workout-generator/",
  translated: true,
});

export default function WorkoutGeneratorPage() {
  return (
    <ToolPage
      slug="workout-generator"
      translated
      name={P.name}
      intro={P.intro}
      sticky={P.sticky}
      mid={{ title: P.mid.title, body: f(P.mid.body), button: P.mid.button }}
      end={{ title: P.end.title, body: f(P.end.body) }}
      faq={P.faq.map(([q, a]) => [f(q), f(a)])}
      more={
        <>
          <h2 className="text-2xl font-bold tracking-tight">{P.more!.heading}</h2>
          {P.more!.paragraphs.map((p) => (
            <p key={p} className="text-muted">
              {f(p)}
            </p>
          ))}
        </>
      }
      reading={P.reading}
    >
      <WorkoutGenerator {...generatorProps("en")} />
    </ToolPage>
  );
}
