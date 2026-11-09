"use client";
import { BRAND } from "./brand";
import { isNative } from "./juice";

// Shareable workout and milestone cards: drawn on a canvas (no server, no health data), then handed to
// the system share sheet. Native apps go through @capacitor/share with the image written to the cache
// folder (Android FileProvider / iOS share sheet); the web uses the Web Share API or a download.

export interface CardData {
  /** Big headline, e.g. "3 new PRs" or "Workout done". */
  headline: string;
  /** Small line above it, e.g. the date. */
  kicker: string;
  /** Up to four [label, value] tiles. */
  tiles: [string, string][];
  /** Up to four highlight lines (PRs, badges). */
  lines: string[];
  /** Footer, e.g. "Level 12 · Iron · 8-week streak". */
  footer: string;
  accent?: string;
}

const W = 1080;
const H = 1350;

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

export function drawCard(canvas: HTMLCanvasElement, d: CardData): void {
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d");
  if (!c) return;
  const accent = d.accent ?? "#4c8dff";
  const font = (px: number, weight = 600) => `${weight} ${px}px system-ui, -apple-system, Roboto, sans-serif`;
  const g = c.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#0a0d12");
  g.addColorStop(1, "#141b26");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  // A soft accent glow in the corner.
  const glow = c.createRadialGradient(W - 120, 140, 10, W - 120, 140, 520);
  glow.addColorStop(0, accent + "55");
  glow.addColorStop(1, accent + "00");
  c.fillStyle = glow;
  c.fillRect(0, 0, W, H);

  c.fillStyle = accent;
  c.font = font(40, 800);
  c.fillText(BRAND.name.toUpperCase(), 80, 120);
  c.fillStyle = "#8a97a8";
  c.font = font(36, 500);
  c.fillText(d.kicker, 80, 220);
  c.fillStyle = "#e8edf3";
  c.font = font(104, 800);
  c.fillText(d.headline, 80, 340, W - 160);

  const tiles = d.tiles.slice(0, 4);
  const tw = (W - 160 - 30 * (tiles.length - 1)) / Math.max(1, tiles.length);
  tiles.forEach(([k, v], i) => {
    const x = 80 + i * (tw + 30);
    roundRect(c, x, 410, tw, 200, 32);
    c.fillStyle = "#18202a";
    c.fill();
    c.fillStyle = "#8a97a8";
    c.font = font(28, 600);
    c.fillText(k.toUpperCase(), x + 30, 470, tw - 60);
    c.fillStyle = "#e8edf3";
    c.font = font(62, 800);
    c.fillText(v, x + 30, 560, tw - 60);
  });

  d.lines.slice(0, 4).forEach((l, i) => {
    const y = 690 + i * 130;
    roundRect(c, 80, y, W - 160, 104, 28);
    c.fillStyle = "#11161d";
    c.fill();
    c.strokeStyle = "#232d3a";
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = "#e8edf3";
    c.font = font(42, 600);
    c.fillText(l, 116, y + 66, W - 232);
  });

  c.fillStyle = accent;
  c.fillRect(80, H - 170, 120, 8);
  c.fillStyle = "#e8edf3";
  c.font = font(40, 700);
  c.fillText(d.footer, 80, H - 100, W - 160);
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((r) => canvas.toBlob((b) => r(b), "image/png"));
}

/** Draws the card and opens the share sheet. Returns how it was shared. */
export async function shareCard(d: CardData, name = "liftsmith"): Promise<"native" | "web" | "download" | "failed"> {
  const canvas = document.createElement("canvas");
  drawCard(canvas, d);
  const file = `${name}.png`;
  const text = `${d.headline} · ${d.footer}`;
  try {
    if (isNative()) {
      const [{ Filesystem, Directory }, { Share }] = await Promise.all([import("@capacitor/filesystem"), import("@capacitor/share")]);
      const data = canvas.toDataURL("image/png").split(",")[1];
      const { uri } = await Filesystem.writeFile({ path: file, data, directory: Directory.Cache });
      await Share.share({ title: BRAND.name, text, files: [uri] });
      return "native";
    }
    const blob = await toBlob(canvas);
    if (!blob) return "failed";
    const f = new File([blob], file, { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [f] })) {
      await nav.share({ files: [f], title: BRAND.name, text });
      return "web";
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    return "download";
  } catch {
    return "failed";
  }
}
