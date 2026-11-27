import { describe, expect, it } from "vitest";

import { NOW } from "@/test/factories";

import { libraryPrintPath, routineHtml, routinePrintHtml, routineSheet } from "./libraryPage";
import type { LibraryRoutine } from "./routineLibrary";

const r: LibraryRoutine = {
  id: "abcdefghijkl",
  title: "Push day for beginners",
  about: "Three presses, short rests.",
  goal: "muscle",
  level: "beginner",
  equipment: ["barbell", "bench"],
  minutes: 40,
  code: "r1~UHVzaA~bench-press.4~overhead-press.3.s~dip.3",
  by: "",
  saves: 0,
  rating: { average: null, count: 0 },
  createdAt: NOW,
  updatedAt: NOW,
};

describe("printable library routine", () => {
  it("lists every exercise with its sets and points the QR code at the routine's page", () => {
    const s = routineSheet("en", r);
    expect(s.days[0]!.rows.map((x) => x.scheme)).toEqual(["4 sets", "3 sets", "3 sets"]);
    expect(s.qr.url).toBe("https://www.getliftsmith.com/routines/push-day-for-beginners-abcdefghijkl/?from=print");
    expect(s.facts.map((f) => f.value)).toContain("10");
  });

  it("is a page of its own with one script of ours, out of search, and the routine page links to it", () => {
    const html = routinePrintHtml("fr", r);
    expect(html).toContain('<html lang="fr">');
    expect(html).toContain('<meta name="robots" content="noindex,follow">');
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html).toContain('<script src="/print.js" defer></script>');
    expect(html).toContain("Imprimer ou enregistrer en PDF");
    expect(routineHtml("en", r, [])).toContain(`href="${libraryPrintPath(r)}"`);
  });
});
