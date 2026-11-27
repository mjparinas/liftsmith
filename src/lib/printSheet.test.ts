import jsQR from "jsqr";
import { describe, expect, it } from "vitest";

import { qrPath } from "@/components/QrCode";

import { density, logColumns, printDocument, printPageHtml, printSheetHtml, sheetHash, writeInRows, type PrintSheet } from "./printSheet";

const words = {
  kicker: "Printable workout plan",
  exercise: "Exercise",
  setsReps: "Sets × reps",
  rest: "Rest",
  next: "Next time",
  session: "Session {n}",
  date: "Date",
  superset: "Superset",
  howTitle: "How it works",
  scanTitle: "Scan to run this program",
  scanBody: "It picks each weight.",
  free: "Free.",
  qrLabel: "QR code",
  writeIn: "Exercise (write it in)",
  notes: "Notes",
};

const sheet = (over: Partial<PrintSheet> = {}): PrintSheet => ({
  lang: "en",
  title: "Classic 5×5",
  summary: "Three lifts a day.",
  facts: [{ label: "Days a week", value: "3" }],
  how: ["Add weight each time."],
  days: [
    {
      name: "Workout A",
      rows: [
        { name: "Back squat", scheme: "5 × 5", rest: "3 min" },
        { name: "Bench press", scheme: "5 × 5", rest: "3 min", superset: true },
        { name: "Barbell row", scheme: "5 × 5", rest: "3 min" },
      ],
    },
  ],
  qr: { url: "https://www.getliftsmith.com/programs/classic-5x5/?from=print", shown: "www.getliftsmith.com/programs/classic-5x5/" },
  words,
  ...over,
});

/** The QR code's squares as an image, read back like a phone camera would. */
function readQr(text: string): string | null {
  const { size, d } = qrPath(text);
  const scale = 4;
  const q = 4;
  const edge = (size + q * 2) * scale;
  const px = new Uint8ClampedArray(edge * edge * 4).fill(255);
  for (const m of d.matchAll(/M(\d+) (\d+)/g)) {
    const x0 = (Number(m[1]) + q) * scale;
    const y0 = (Number(m[2]) + q) * scale;
    for (let y = y0; y < y0 + scale; y++) for (let x = x0; x < x0 + scale; x++) px.fill(0, (y * edge + x) * 4, (y * edge + x) * 4 + 3);
  }
  return jsQR(px, edge, edge)?.data ?? null;
}

describe("printable sheet", () => {
  it("draws the title, every exercise with its scheme and rest, and four sessions to log", () => {
    const html = printSheetHtml(sheet());
    expect(html).toContain("<h1>Classic 5×5</h1>");
    for (const name of ["Back squat", "Bench press", "Barbell row"]) expect(html).toContain(name);
    expect(html.match(/class="ps-log">Session \d/g)).toHaveLength(4);
    expect(html).toContain("3 min");
    expect(html).toContain('class="ps-tag ps-ss">Superset');
  });

  it("escapes what lifters typed", () => {
    const html = printSheetHtml(
      sheet({ title: '<img src=x onerror="alert(1)">', days: [{ name: "", rows: [{ name: "A & B", scheme: "3" }] }] }),
    );
    expect(html).not.toContain("<img");
    expect(html).toContain("A &#38; B");
  });

  it("leaves out a day heading for a sheet with one unnamed workout, and columns nobody filled", () => {
    const html = printSheetHtml(sheet({ days: [{ name: "", rows: [{ name: "Plank", scheme: "3 × 30 s" }] }] }));
    expect(html).not.toContain("<h3>");
    expect(html).not.toContain(">Rest<");
    expect(html).not.toContain(">Next time<");
  });

  it("shows the app's next weight when there is one", () => {
    const html = printSheetHtml(sheet({ days: [{ name: "", rows: [{ name: "Squat", scheme: "3 × 8", next: "60 kg" }] }] }));
    expect(html).toContain(">Next time<");
    expect(html).toContain("60 kg");
  });

  it("gives a split day its muscles and blank rows to write the exercises in, with no sessions", () => {
    const split = sheet({ days: ["Push", "Pull", "Legs"].map((name) => ({ name, rows: [], muscles: "Chest, Triceps" })) });
    expect(logColumns(split)).toBe(0);
    const html = printSheetHtml(split);
    expect(html.match(/<tr><td><\/td><td><\/td><\/tr>/g)).toHaveLength(3 * writeInRows(3));
    expect(html).toContain("Exercise (write it in)");
    expect(html).toContain("ps-grid");
  });

  it("tightens a long program so it stays on one page", () => {
    const row = { name: "Lift", scheme: "3 × 8", rest: "2 min" };
    const long = sheet({
      days: Array.from({ length: 4 }, (_, i) => ({ name: `Day ${i + 1}`, rows: Array.from({ length: 6 }, () => row) })),
    });
    expect(density(long)).toBe("tight");
    expect(logColumns(long)).toBe(3);
    expect(density(sheet())).toBe("roomy");
    expect(logColumns(sheet())).toBe(4);
  });

  it("has a QR code a phone reads back as the plan's address", () => {
    const s = sheet();
    expect(printSheetHtml(s)).toContain('role="img" aria-label="QR code"');
    expect(readQr(s.qr.url)).toBe(s.qr.url);
  });

  it("prints as a whole document with no script, and the print page runs only /print.js", () => {
    const doc = printDocument(sheet());
    expect(doc.startsWith("<!doctype html>")).toBe(true);
    expect(doc).not.toMatch(/<script/i);
    const page = printPageHtml({
      sheet: sheet(),
      back: { href: "/programs/x/", label: "Back" },
      printLabel: "Print",
      hint: "Fits one page.",
    });
    expect(page).not.toMatch(/<script/i);
    expect(page).toContain("data-print");
  });

  it("fingerprints a sheet so a changed program shows up", () => {
    expect(sheetHash("a")).toMatch(/^[0-9a-f]{16}$/);
    expect(sheetHash(printSheetHtml(sheet()))).toBe(sheetHash(printSheetHtml(sheet())));
    expect(sheetHash(printSheetHtml(sheet()))).not.toBe(sheetHash(printSheetHtml(sheet({ title: "Other" }))));
  });
});
