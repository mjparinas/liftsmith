// A program's printable page (/programs/<id>/print/ and /<lang>/programs/<id>/print/; docs/decisions/printable-plans.md):
// the program on one page, every workout with its sets, reps and rest, four sessions to log by hand and a QR code back
// to the program in Liftsmith, plus a ready PDF of the same sheet (public/pdf/, scripts/program-pdfs.mjs). For
// "printable workout plan" searches. The workouts are the program page's own (ProgramView.tsx), so the two never differ.
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocLang } from "@/components/site/DocLang";
import { pageMeta } from "@/lib/pageMeta";
import { PRINT_CSS, PRINT_PAGE_CSS, printPageHtml, printSheetHtml, sheetHash, type PrintSheet } from "@/lib/printSheet";
import { programDays, SPLITS } from "@/lib/programs";
import { SITE_URL } from "@/lib/site";
import { fill, localPath, type SiteLang } from "@/lib/siteLang";
import { muscleLabels } from "@/locales/site/fromApp";
import { printLine, printWords } from "@/locales/site/print";
import { PROGRAM_TEXT } from "@/locales/site/program";

import {
  PROGRAM_CTX,
  programById,
  programDayName,
  programEquipment,
  programExName,
  programItemLabel,
  programPath,
  programText,
  restText,
  scheme,
} from "./ProgramView";

export const programPrintPath = (id: string) => `/programs/${id}/print/`;
/** The ready PDF of a program's sheet in a language (written by scripts/program-pdfs.mjs). */
export const programPdfPath = (lang: SiteLang, id: string) => `/pdf/${lang}/liftsmith-${id}.pdf`;
/** Letter in English (Canada and the US read it most), A4 in every other language. */
export const pdfPaper = (lang: SiteLang) => (lang === "en" ? "Letter" : "A4");

/** A program's one-page sheet in a language, or null for a program that isn't there. */
export function programSheet(lang: SiteLang, id: string): PrintSheet | null {
  const p = programById(id);
  if (!p) return null;
  const t = PROGRAM_TEXT[lang];
  const w = programText(lang, p);
  const muscles = muscleLabels(lang);
  const days = programDays(p.id, PROGRAM_CTX);
  const split = p.kind === "split" ? SPLITS[p.id as keyof typeof SPLITS] : null;
  const url = `${SITE_URL}${localPath(lang, programPath(p.id))}`;
  return {
    lang,
    title: w.name,
    summary: w.summary,
    facts: [
      { label: t.days, value: String(p.daysPerWeek) },
      { label: t.level, value: t.levels[p.level] },
      { label: t.equipment, value: programEquipment(lang, p) },
    ],
    how: w.how,
    credit: fill(t.credit, { text: w.basedOn }),
    days: days
      ? days.map((d, i) => ({
          name: programDayName(lang, d.name, i),
          rows: d.items.map((it) => ({
            name: programExName(lang, it.exerciseId),
            ...(programItemLabel(lang, it.label) ? { label: programItemLabel(lang, it.label)! } : {}),
            scheme: scheme(lang, it),
            rest: restText(t, it.restSec),
          })),
        }))
      : (split ?? []).map((d, i) => ({
          name: programDayName(lang, d.name, i),
          rows: [],
          muscles: d.muscles.map((m) => muscles[m]).join(", "),
        })),
    qr: { url: `${url}?from=print`, shown: url.replace(/^https?:\/\//, "") },
    words: printWords(lang, "program"),
  };
}

export function programPrintMeta(lang: SiteLang, id: string): Metadata {
  const p = programById(id);
  if (!p) return {};
  const name = programText(lang, p).name;
  return pageMeta({
    title: printLine(lang, "prt.page.title", { name }),
    description: printLine(lang, "prt.page.description", { name }),
    path: programPrintPath(p.id),
    ...(lang === "en" ? { translated: true } : { lang }),
  });
}

export function ProgramPrintView({ lang, id }: { lang: SiteLang; id: string }) {
  const sheet = programSheet(lang, id);
  if (!sheet) notFound();
  const html = printPageHtml({
    sheet,
    back: { href: localPath(lang, programPath(id)), label: printLine(lang, "prt.page.back", { name: sheet.title }) },
    printLabel: printLine(lang, "prt.page.print"),
    pdf: { href: programPdfPath(lang, id), label: printLine(lang, "prt.page.pdf") },
    hint: printLine(lang, "prt.page.hint"),
  });
  return (
    <>
      <DocLang lang={lang} />
      <style>{`${PRINT_CSS}\n${PRINT_PAGE_CSS}`}</style>
      {/* The sheet's fingerprint, which scripts/program-pdfs.mjs saves beside each PDF so a test can tell it's current. */}
      <div className="pp-desk" data-sheet-hash={sheetHash(printSheetHtml(sheet))} dangerouslySetInnerHTML={{ __html: html }} />
      <script src="/print.js" async />
    </>
  );
}
