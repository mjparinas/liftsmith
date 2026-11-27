// Printing a sheet (docs/decisions/printable-plans.md). The Android and iOS apps hand the page to the phone's own print
// service through the native Print plugin (PrintPlugin.java: a WebView's print adapter and PrintManager; PrintPlugin
// in DelightPlugins.swift: a WKWebView's print formatter and UIPrintInteractionController), where Save as PDF and
// sharing the PDF also live; a web view's own window.print() does nothing in either app. The web app prints from a
// hidden frame holding only the sheet, so the app around it never reaches the paper.
import { isNative } from "./juice";
import { measureSheet, printDocument, zoomFor, type PrintSheet } from "./printSheet";

type PrintPlugin = { print?: (o: { html: string; name: string }) => Promise<unknown> };
type Cap = { Plugins?: Record<string, PrintPlugin | undefined> };

/** Whether this device can print at all: every app and every browser with a print window. */
export function canPrint(): boolean {
  if (isNative()) return !!(window as unknown as { Capacitor?: Cap }).Capacitor?.Plugins?.Print?.print;
  return typeof window !== "undefined" && typeof window.print === "function";
}

/** A name for the print job and a saved PDF: the sheet's title in plain words. */
export const jobName = (title: string) =>
  title
    .replace(/[\\/:*?"<>|]+/g, " ")
    .trim()
    .slice(0, 80) || "Liftsmith";

/** Opens the print window for a sheet, scaled to stay on one page. False when it couldn't. */
export async function printSheet(sheet: PrintSheet): Promise<boolean> {
  const frame = await loadFrame(printDocument(sheet));
  const doc = frame?.contentDocument;
  const mm = doc ? measureSheet(doc) : null;
  const zoom = mm === null ? 1 : zoomFor(mm);
  if (isNative()) {
    frame?.remove();
    const plugin = (window as unknown as { Capacitor?: Cap }).Capacitor?.Plugins?.Print;
    if (!plugin?.print) return false;
    try {
      await plugin.print({ html: printDocument(sheet, zoom), name: jobName(sheet.title) });
      return true;
    } catch {
      return false;
    }
  }
  const win = frame?.contentWindow;
  if (!frame || !doc || !win) {
    frame?.remove();
    return false;
  }
  if (zoom < 1) doc.querySelector<HTMLElement>(".ps-sheet")?.style.setProperty("--ps-zoom", String(zoom));
  try {
    win.focus();
    win.print();
    return true;
  } catch {
    return false;
  } finally {
    // Some browsers return from print() before the dialog closes, so the frame stays a while.
    setTimeout(() => frame.remove(), 60_000);
  }
}

/** The page in a hidden frame the width of the paper, loaded and ready to measure and print. */
function loadFrame(html: string): Promise<HTMLIFrameElement | null> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve(null);
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.cssText = "position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;opacity:0;pointer-events:none";
    frame.onload = () => resolve(frame);
    frame.srcdoc = html;
    document.body.appendChild(frame);
  });
}
