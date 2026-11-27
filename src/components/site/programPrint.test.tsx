// @vitest-environment jsdom
// Printable program pages (docs/decisions/printable-plans.md): every program on one sheet in every site language, the
// program page linking to it, the sitemap listing it, and a ready PDF for each whose sheet hasn't changed since it was
// drawn (scripts/program-pdfs.mjs).
import { existsSync, readFileSync } from "node:fs";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { printSheetHtml, sheetHash } from "@/lib/printSheet";
import { programDays, PROGRAMS } from "@/lib/programs";
import { siteRoutes } from "@/lib/seo";
import { localPath, SITE_LANGS } from "@/lib/siteLang";

import { programPdfPath, programPrintMeta, programPrintPath, ProgramPrintView, programSheet } from "./ProgramPrint";
import { PROGRAM_CTX, ProgramView } from "./ProgramView";

afterEach(cleanup);

const manifest = JSON.parse(readFileSync("public/pdf/manifest.json", "utf8")) as Record<string, string>;

describe("printable program pages", () => {
  it("puts every workout of every program on its sheet, in every language", () => {
    for (const p of PROGRAMS)
      for (const lang of SITE_LANGS) {
        const s = programSheet(lang, p.id)!;
        const days = programDays(p.id, PROGRAM_CTX);
        if (days) {
          expect(s.days.map((d) => d.rows.length)).toEqual(days.map((d) => d.items.length));
          for (const d of s.days) for (const r of d.rows) expect(r.scheme).toMatch(/\d/);
        } else expect(s.days.every((d) => d.muscles)).toBe(true);
        expect(s.qr.url).toBe(`https://www.getliftsmith.com${localPath(lang, `/programs/${p.id}/`)}?from=print`);
      }
  });

  it("has a ready PDF for every program and language, drawn from the sheet as it is now", () => {
    for (const p of PROGRAMS)
      for (const lang of SITE_LANGS) {
        const key = `${lang}/${p.id}`;
        expect(existsSync(`public${programPdfPath(lang, p.id)}`), `${key}: run node scripts/program-pdfs.mjs`).toBe(true);
        expect(manifest[key], `${key} changed since its PDF was drawn: run node scripts/program-pdfs.mjs`).toBe(
          sheetHash(printSheetHtml(programSheet(lang, p.id)!)),
        );
      }
  });

  it("is a page of its own with the print button, the PDF and the way back", () => {
    render(<ProgramPrintView lang="en" id="classic-5x5" />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Classic 5×5");
    expect(screen.getByRole("button", { name: "Print or save as PDF" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Download the PDF" }).getAttribute("href")).toBe("/pdf/en/liftsmith-classic-5x5.pdf");
    expect(screen.getByRole("link", { name: /Back to Classic 5×5/ }).getAttribute("href")).toBe("/programs/classic-5x5/");
    expect(screen.getByRole("img", { name: /QR code/ })).toBeTruthy();
  });

  it("is titled for people searching for a printable plan, and the program page links to it", () => {
    const meta = programPrintMeta("en", "classic-5x5");
    expect(String((meta.title as { absolute?: string })?.absolute ?? meta.title)).toContain("Printable Classic 5×5 workout plan");
    expect(meta.alternates?.canonical).toBe("/programs/classic-5x5/print/");
    render(<ProgramView lang="de" id="classic-5x5" />);
    expect(screen.getByRole("link", { name: /Dieses Programm drucken/ }).getAttribute("href")).toMatch(
      /^\/de\/programs\/classic-5x5\/print\/?$/,
    );
  });

  it("lists every print page in the sitemap, in every language", () => {
    const paths = new Set(siteRoutes().map((r) => r.path));
    for (const p of PROGRAMS) for (const lang of SITE_LANGS) expect(paths.has(localPath(lang, programPrintPath(p.id)))).toBe(true);
  });
});
