import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Page speed guards for the public website (docs/decisions/public-pages-and-seo.md, "Page speed").

const ROOT = resolve(__dirname, "../..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

/** Every local module a file loads at run time (type-only imports don't reach the browser). */
function runtimeImports(file: string, seen = new Set<string>()): Set<string> {
  if (seen.has(file)) return seen;
  seen.add(file);
  const src = read(file);
  for (const m of src.matchAll(/^(?:import|export)\s+(?!type\b)[^;]*?from\s+"([^"]+)";/gms)) {
    const spec = m[1]!;
    const names = /^import\s+\{([^}]*)\}/.exec(m[0])?.[1];
    if (names?.split(",").every((n) => !n.trim() || n.trim().startsWith("type "))) continue; // { type A, type B }
    const base = spec.startsWith("@/") ? join("src", spec.slice(2)) : spec.startsWith(".") ? join(dirname(file), spec) : null;
    if (!base) continue;
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      try {
        read(base + ext);
        runtimeImports(base + ext, seen);
        break;
      } catch {}
    }
  }
  return seen;
}

describe("public pages stay light", () => {
  it("the home page hero, the demo picker and the exercise page demo don't load the language catalogues", () => {
    for (const file of [
      "src/components/site/HeroLift.tsx",
      "src/components/site/DemoPicker.tsx",
      "src/components/site/ExerciseDemo.tsx",
      "src/components/demo/LiftDemoCore.tsx",
    ]) {
      const reached = [...runtimeImports(file)];
      expect(reached, file).not.toContain("src/lib/i18n.ts");
      expect(
        reached.filter((f) => f.startsWith("src/locales/")),
        file,
      ).toEqual([]);
    }
  });

  it("the walker does see the catalogues when they are imported (the app's LiftDemo)", () => {
    expect([...runtimeImports("src/components/demo/LiftDemo.tsx")]).toContain("src/lib/i18n.ts");
  });

  it("links from public pages to the app never prefetch its code", () => {
    for (const file of [
      "src/app/page.tsx",
      "src/app/tools/tdee-calculator/page.tsx",
      "src/components/site/SiteChrome.tsx",
      "src/components/site/StoreBadges.tsx",
      "src/components/site/CreatorLanding.tsx",
    ]) {
      const links = [...read(file).matchAll(/<Link\b[^>]*?href=\{APP_PATH\}[^>]*>/gs)].map((m) => m[0]);
      expect(links.length, file).toBeGreaterThan(0);
      for (const l of links) expect(l, file).toContain("prefetch={false}");
    }
  });
});
