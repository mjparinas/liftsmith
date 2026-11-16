import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// Every image a person sees has alt text (WCAG 1.1.1). Lint (jsx-a11y/alt-text) checks JSX, but not the
// HTML that emails and server-drawn pages build as text, and nothing checks inline SVG. This test reads
// every source file under src/ and fails when:
//  - an <img> or <Image> tag, in JSX or in an HTML string, has no alt attribute (alt="" for decorative ones);
//  - an inline <svg> neither hides itself from screen readers (aria-hidden) nor names itself
//    (role="img" with aria-label or aria-labelledby). Mark it on the <svg> itself, even when a parent is hidden,
//    so the rule stays simple to check.

const ROOT = join(__dirname, "..");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

/** The opening tags named `tag` in `src`, read up to the `>` that closes them (braces skipped, so `=>` and `${…}` don't end a tag early). */
function openingTags(src: string, tag: string): { line: number; text: string }[] {
  const found: { line: number; text: string }[] = [];
  const start = new RegExp(`<${tag}\\s`, "g");
  let m: RegExpExecArray | null;
  while ((m = start.exec(src))) {
    let depth = 0;
    let j = m.index + m[0].length;
    for (; j < src.length; j++) {
      const c = src[j];
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth <= 0) break;
    }
    found.push({ line: src.slice(0, m.index).split("\n").length, text: src.slice(m.index, j + 1) });
    start.lastIndex = j;
  }
  return found;
}

const sources = files(ROOT).map((path) => ({ path: relative(join(ROOT, ".."), path), src: readFileSync(path, "utf8") }));

describe("alt text", () => {
  it("finds the images and drawings it checks", () => {
    const imgs = sources.flatMap((f) => openingTags(f.src, "img"));
    const svgs = sources.flatMap((f) => openingTags(f.src, "svg"));
    expect(imgs.length).toBeGreaterThan(20);
    expect(svgs.length).toBeGreaterThan(20);
  });

  it("gives every image an alt attribute", () => {
    const missing = sources.flatMap((f) =>
      [...openingTags(f.src, "img"), ...openingTags(f.src, "Image")]
        .filter((t) => !/\salt\s*=/.test(t.text) && !/\{\s*\.\.\./.test(t.text))
        .map((t) => `${f.path}:${t.line}`),
    );
    expect(missing).toEqual([]);
  });

  it("hides or names every inline SVG", () => {
    const loose = sources.flatMap((f) =>
      openingTags(f.src, "svg")
        .filter((t) => {
          if (/aria-hidden/.test(t.text) || /\{\s*\.\.\./.test(t.text)) return false;
          return !(/role=["{]?["']?img/.test(t.text) && /aria-label(ledby)?\s*=/.test(t.text));
        })
        .map((t) => `${f.path}:${t.line}`),
    );
    expect(loose).toEqual([]);
  });

  it("catches a missing alt in an HTML string", () => {
    const html = 'const card = `<p><img src="${url}" width="300"></p>`;';
    expect(openingTags(html, "img").filter((t) => !/\salt\s*=/.test(t.text))).toHaveLength(1);
    expect(openingTags('<img src={x} alt="" onLoad={() => go()} />', "img")[0]?.text).toContain('alt=""');
  });
});
