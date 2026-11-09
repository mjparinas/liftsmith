import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// CI runs the browser tests in Microsoft's Playwright image, whose browsers only work with the same
// playwright version. Dependabot bumps the npm package but not the image tag in the workflows, so a
// bump that skips the image fails every browser job with "Executable doesn't exist". This catches it
// in the unit tests instead, naming the line to change.

const root = join(__dirname, "../..");
const installed: string = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8")).packages["node_modules/playwright"].version;

describe("toolchain", () => {
  it("runs CI's browser tests on the Playwright image that matches the installed playwright", () => {
    const dir = join(root, ".github/workflows");
    const pins = readdirSync(dir)
      .filter((f) => /\.ya?ml$/.test(f))
      .flatMap((f) => [...readFileSync(join(dir, f), "utf8").matchAll(/mcr\.microsoft\.com\/playwright:v([\d.]+)/g)].map((m) => ({ file: f, version: m[1] })));
    expect(pins.length).toBeGreaterThan(0);
    for (const p of pins) expect(p.version, `${p.file}: set the image to mcr.microsoft.com/playwright:v${installed}-noble`).toBe(installed);
  });
});
