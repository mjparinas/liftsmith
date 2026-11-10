// Ported from Gradelings (src/lib/csv.ts).
// CSV for the admin panel's downloads. A cell that a spreadsheet would read as a formula (=, +, -, @) gets a
// leading apostrophe, so an email address or name someone typed can never run as one.

export type Cell = string | number | boolean | null | undefined;

export function csvCell(v: Cell): string {
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: Cell[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** An ISO date and time (UTC), or blank. */
export const isoTime = (t: number | null | undefined) => (t ? new Date(t).toISOString().replace(".000Z", "Z") : "");
