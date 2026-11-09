// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { applyA11y, cleanA11y, savedA11y, textPercent } from "./a11y";

// Colour checks on the real tokens in globals.css: text contrast (WCAG 1.4.3), graphics contrast
// (1.4.11), and that the status and recovery colours stay apart when simulated for the three kinds
// of colour blindness (Machado et al. 2009, full severity), in both themes.

const css = readFileSync(join(__dirname, "../app/globals.css"), "utf8");

/** The custom properties declared directly in the first block that opens with `head`. */
function block(head: string): Record<string, string> {
  const at = css.indexOf(head);
  if (at < 0) throw new Error(`no block ${head}`);
  let depth = 0;
  let i = css.indexOf("{", at);
  const start = i + 1;
  for (; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) break;
  }
  const out: Record<string, string> = {};
  for (const m of css.slice(start, i).matchAll(/(--[\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

const THEME = block("@theme");
const DARK = { ...THEME, ...block(":root {\n  color-scheme: dark;") };
const LIGHT = { ...DARK, ...block(':root[data-theme="light"]') };
const SYSTEM_LIGHT = block(':root[data-theme="system"]');

const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const rgb = (hex: string) => [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
const lum = ([r, g, b]: number[]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const SIM: Record<string, number[][]> = {
  normal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
function lab([r, g, b]: number[]): number[] {
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047);
  const y = f(0.2126 * r + 0.7152 * g + 0.0722 * b);
  const z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const seen = (hex: string, kind: string) => lab(SIM[kind].map((row) => Math.min(1, Math.max(0, row.reduce((n, k, j) => n + k * rgb(hex)[j], 0)))));
/** The smallest colour difference (CIE76) between any two of `hexes` for one kind of vision. */
function closest(hexes: string[], kind: string): number {
  let min = Infinity;
  for (let i = 0; i < hexes.length; i++) {
    for (let j = i + 1; j < hexes.length; j++) {
      const [a, b] = [seen(hexes[i], kind), seen(hexes[j], kind)];
      min = Math.min(min, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]));
    }
  }
  return min;
}

const BANDS = ["fresh", "ready", "recovering", "fatigued"];
const THEMES = { dark: DARK, light: LIGHT } as const;

afterEach(() => {
  localStorage.clear();
  const root = document.documentElement;
  root.removeAttribute("style");
  for (const k of ["cvd", "contrast", "text"]) delete root.dataset[k];
});

describe("colour tokens", () => {
  it("keeps the light values for Match system identical to Light", () => {
    const light = block(':root[data-theme="light"]');
    expect(SYSTEM_LIGHT).toEqual(light);
  });

  for (const [name, t] of Object.entries(THEMES)) {
    for (const set of ["std", "cvd"]) {
      it(`${name} ${set}: status colours are readable text on every surface`, () => {
        for (const s of ["good", "warn", "bad"]) {
          for (const bg of ["--color-bg", "--color-surface"]) expect(contrast(t[`--${s}-${set}`], t[bg]), `${s} on ${bg}`).toBeGreaterThanOrEqual(4.5);
        }
      });

      it(`${name} ${set}: recovery colours stand out from the card (3:1 for graphics)`, () => {
        for (const b of BANDS) expect(contrast(t[`--band-${b}-${set}`], t["--color-surface"]), b).toBeGreaterThanOrEqual(3);
      });
    }

    it(`${name}: the colour-blind safe set stays distinct for every kind of colour vision`, () => {
      const bands = BANDS.map((b) => t[`--band-${b}-cvd`]);
      const status = ["good", "warn", "bad"].map((s) => t[`--${s}-cvd`]);
      for (const kind of Object.keys(SIM)) {
        expect(closest(bands, kind), `bands, ${kind}`).toBeGreaterThanOrEqual(20);
        expect(closest(status, kind), `status, ${kind}`).toBeGreaterThanOrEqual(25);
      }
    });

    it(`${name}: the colour-blind safe set beats the standard one for red-green colour blindness`, () => {
      for (const kind of ["protanopia", "deuteranopia"]) {
        expect(closest(BANDS.map((b) => t[`--band-${b}-cvd`]), kind)).toBeGreaterThan(closest(BANDS.map((b) => t[`--band-${b}-std`]), kind));
      }
    });

    it(`${name}: the standard set is distinct with typical colour vision`, () => {
      expect(closest(BANDS.map((b) => t[`--band-${b}-std`]), "normal")).toBeGreaterThanOrEqual(25);
    });
  }

  it("picks the set by data-cvd and keeps every status colour behind a token", () => {
    expect(block(":root {\n  --color-good: var(--good-std);")["--band-fatigued"]).toBe("var(--band-fatigued-std)");
    expect(block(':root[data-cvd="on"]')["--color-bad"]).toBe("var(--bad-cvd)");
  });

  it("raises secondary text and outlines in More contrast, for both the setting and the phone's", () => {
    const more = block(':root[data-contrast="more"]');
    expect(more["--color-faint"]).toContain("var(--color-ink)");
    expect(css).toMatch(/@media \(prefers-contrast: more\) \{\s*:root\[data-contrast="system"\]/);
  });
});

describe("accessibility settings", () => {
  it("cleans unknown values to the defaults", () => {
    expect(cleanA11y(undefined)).toEqual({ text: "system", colours: "standard", contrast: "system", hand: "off" });
    expect(cleanA11y({ text: "999", colours: "pink", contrast: "max" })).toEqual({ text: "system", colours: "standard", contrast: "system", hand: "off" });
    expect(cleanA11y({ text: "130", colours: "cvd", contrast: "more", hand: "left" })).toEqual({ text: "130", colours: "cvd", contrast: "more", hand: "left" });
  });

  it("follows the phone's text size within limits", () => {
    expect(textPercent("system")).toBe(100);
    expect(textPercent("system", 1.3)).toBe(130);
    expect(textPercent("system", 3.5)).toBe(200);
    expect(textPercent("system", 0.5)).toBe(80);
    expect(textPercent("150", 1.3)).toBe(150);
  });

  it("sets the page up and remembers it for the next launch", () => {
    applyA11y({ text: "130", colours: "cvd", contrast: "more" });
    const root = document.documentElement;
    expect(root.style.fontSize).toBe("130%");
    expect(root.dataset.cvd).toBe("on");
    expect(root.dataset.contrast).toBe("more");
    expect(savedA11y()).toEqual({ text: "130", colours: "cvd", contrast: "more", hand: "off" });
    applyA11y(undefined);
    expect(root.style.fontSize).toBe("");
    expect(root.dataset.cvd).toBeUndefined();
    expect(root.dataset.contrast).toBe("system");
  });
});

describe("3D recovery map", () => {
  it("paints with the dark theme's band colours, and they stand out on the stage", async () => {
    const { STAGE_BANDS } = await import("@/components/demo/colours");
    for (const [set, suffix] of [["standard", "std"], ["cvd", "cvd"]] as const)
      for (const [band, hex] of Object.entries(STAGE_BANDS[set])) {
        expect(hex, `${band} ${set}`).toBe(DARK[`--band-${band}-${suffix}`]);
        expect(contrast(hex, "#05080c"), `${band} ${set}`).toBeGreaterThanOrEqual(3);
      }
  });
});
