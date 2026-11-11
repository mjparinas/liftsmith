"use client";

import { BRAND } from "./brand";
import { isNative } from "./juice";

// Shareable workout and milestone cards: drawn on a canvas (no server, no health data), then handed to
// the system share sheet. Native apps go through @capacitor/share with the image written to the cache
// folder (Android FileProvider / iOS share sheet); the web uses the Web Share API or a download.
// What goes on a card is decided by the builders in shareCards.ts; this file only draws.

export type CardSize = "post" | "story";
/** Post fits a feed (4:5); story fills a phone screen (9:16). */
export const CARD_SIZE: Record<CardSize, [number, number]> = { post: [1080, 1350], story: [1080, 1920] };

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
  /** One hero number under the headline ("100 kg × 5", "+8%", "Level 12"), with a small label. */
  big?: { value: string; label?: string };
  /** Small pills, e.g. the muscles worked. */
  chips?: string[];
  /** A medal in the middle (badge cards): the badge's icon on its tier colour. */
  medal?: { icon: string; colour: string };
  /** The lifter's name, only when they chose to show it. */
  name?: string | null;
}

export interface DrawOptions {
  size?: CardSize;
  /** A still of the 3D figure (figureStill), drawn as the card's art. */
  figure?: HTMLCanvasElement | null;
}

const INK = "#e8edf3";
const MUTED = "#8a97a8";
const VIOLET = "#a78bfa";
const PAD = 80;
const SITE = "getliftsmith.com";

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/** Splits text into at most `max` lines that fit `width`; the last line is shortened with an ellipsis. */
export function wrap(measure: (s: string) => number, text: string, width: number, max: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (measure(next) <= width || !line) line = next;
    else {
      out.push(line);
      line = w;
    }
  }
  if (line) out.push(line);
  // Japanese has no spaces: break long runs by character.
  const lines = out.flatMap((l) => {
    if (measure(l) <= width) return [l];
    const parts: string[] = [];
    let cur = "";
    for (const ch of l) {
      if (measure(cur + ch) > width && cur) {
        parts.push(cur);
        cur = ch;
      } else cur += ch;
    }
    if (cur) parts.push(cur);
    return parts;
  });
  if (lines.length <= max) return lines;
  const kept = lines.slice(0, max);
  let last = kept[max - 1] ?? "";
  while (last && measure(`${last}…`) > width) last = last.slice(0, -1);
  kept[max - 1] = `${last.trimEnd()}…`;
  return kept;
}

export function drawCard(canvas: HTMLCanvasElement, d: CardData, o: DrawOptions = {}): void {
  const [W, H] = CARD_SIZE[o.size ?? "post"];
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d");
  if (!c) return;
  const accent = d.accent ?? "#4c8dff";
  const font = (px: number, weight = 600) => `${weight} ${px}px system-ui, -apple-system, Roboto, "Noto Sans JP", sans-serif`;
  const story = H > W * 1.5;

  // Background: navy, a soft accent light at the top, violet at the bottom (the app's aurora).
  const g = c.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#0a0d12");
  g.addColorStop(1, "#141b26");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  const glow = (x: number, y: number, r: number, col: string) => {
    const rg = c.createRadialGradient(x, y, 10, x, y, r);
    rg.addColorStop(0, col + "55");
    rg.addColorStop(1, col + "00");
    c.fillStyle = rg;
    c.fillRect(0, 0, W, H);
  };
  glow(W - 120, 140, 560, accent);
  glow(80, H - 200, 520, VIOLET);

  // Measure the text blocks first, so the art gets whatever room is left.
  c.font = font(story ? 104 : 96, 800);
  const head = wrap((s) => c.measureText(s).width, d.headline, W - PAD * 2, 2);
  const headLH = story ? 112 : 104;
  const y = (story ? 360 : 310) + (head.length - 1) * headLH;
  const bigY = d.big ? y + (story ? 210 : 180) : y;
  const artTop = (d.big ? bigY + (d.big.label ? 70 : 20) : y) + 30;

  const tiles = d.tiles.slice(0, 4);
  const chips = (d.chips ?? []).slice(0, 4);
  let lines = d.lines.slice(0, 4);
  const footerTop = H - 220;
  const stackH = (n: number) => n * 130 + (tiles.length ? 240 : 0) + (chips.length ? 100 : 0);
  // Drop highlight lines rather than squash them when a post is full.
  while (lines.length && footerTop - stackH(lines.length) < artTop + 40) lines = lines.slice(0, -1);
  const stackTop = footerTop - stackH(lines.length);
  const artH = stackTop - artTop - 20;

  // The art: the figure (or a medal) in its own space when there is room, else behind the text on the right.
  if (o.figure) {
    const f = o.figure;
    const inline = artH >= 420;
    const box = inline ? { x: PAD, y: artTop, w: W - PAD * 2, h: artH } : { x: W * 0.36, y: 150, w: W * 0.64 - 20, h: stackTop - 170 };
    const s = Math.min(box.w / f.width, box.h / f.height);
    const fw = f.width * s,
      fh = f.height * s;
    c.save();
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = inline ? 1 : 0.75;
    c.drawImage(f, box.x + (box.w - fw) / 2, box.y + (box.h - fh) / 2, fw, fh);
    c.restore();
  } else if (d.medal && artH >= 160) {
    const r = Math.min(story ? 220 : 150, artH / 2 - 10);
    const cx = W / 2,
      cy = artTop + artH / 2;
    const mg = c.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.6);
    mg.addColorStop(0, d.medal.colour + "66");
    mg.addColorStop(1, d.medal.colour + "00");
    c.fillStyle = mg;
    c.fillRect(cx - r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2);
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fillStyle = "#18202a";
    c.fill();
    c.lineWidth = r * 0.09;
    c.strokeStyle = d.medal.colour;
    c.stroke();
    c.font = font(Math.round(r * 0.95), 400);
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = INK;
    c.fillText(d.medal.icon, cx, cy + r * 0.04);
    c.textAlign = "left";
    c.textBaseline = "alphabetic";
  }

  // Brand, and the name when the lifter chose to show it.
  c.fillStyle = accent;
  c.font = font(40, 800);
  c.fillText(BRAND.name.toUpperCase(), PAD, 120);
  if (d.name) {
    c.fillStyle = MUTED;
    c.font = font(34, 600);
    c.textAlign = "right";
    c.fillText(d.name, W - PAD, 118, W / 2 - PAD);
    c.textAlign = "left";
  }
  c.fillStyle = MUTED;
  c.font = font(36, 500);
  c.fillText(d.kicker, PAD, story ? 240 : 210, W - PAD * 2);
  c.fillStyle = INK;
  c.font = font(story ? 104 : 96, 800);
  head.forEach((l, i) => c.fillText(l, PAD, (story ? 360 : 310) + i * headLH));

  if (d.big) {
    c.font = font(story ? 190 : 170, 800);
    const bg = c.createLinearGradient(PAD, 0, PAD + Math.min(W - PAD * 2, c.measureText(d.big.value).width), 0);
    bg.addColorStop(0, accent);
    bg.addColorStop(1, VIOLET);
    c.fillStyle = bg;
    c.fillText(d.big.value, PAD, bigY, W - PAD * 2);
    if (d.big.label) {
      c.fillStyle = MUTED;
      c.font = font(38, 600);
      c.fillText(d.big.label, PAD, bigY + 62, W - PAD * 2);
    }
  }

  let sy = stackTop;
  if (chips.length) {
    let x = PAD;
    c.font = font(32, 700);
    for (const chip of chips) {
      const w = c.measureText(chip).width + 56;
      if (x + w > W - PAD) break;
      roundRect(c, x, sy, w, 70, 35);
      c.fillStyle = accent + "2e";
      c.fill();
      c.strokeStyle = accent + "66";
      c.lineWidth = 2;
      c.stroke();
      c.fillStyle = INK;
      c.fillText(chip, x + 28, sy + 46);
      x += w + 18;
    }
    sy += 100;
  }
  if (tiles.length) {
    const tw = (W - PAD * 2 - 30 * (tiles.length - 1)) / tiles.length;
    tiles.forEach(([k, v], i) => {
      const x = PAD + i * (tw + 30);
      roundRect(c, x, sy, tw, 200, 32);
      c.fillStyle = "#18202aee";
      c.fill();
      c.strokeStyle = "#ffffff14";
      c.lineWidth = 2;
      c.stroke();
      c.fillStyle = MUTED;
      c.font = font(28, 600);
      c.fillText(k.toUpperCase(), x + 30, sy + 60, tw - 60);
      c.fillStyle = INK;
      c.font = font(tiles.length > 3 ? 54 : 62, 800);
      c.fillText(v, x + 30, sy + 150, tw - 60);
    });
    sy += 240;
  }
  lines.forEach((l, i) => {
    const ly = sy + i * 130;
    roundRect(c, PAD, ly, W - PAD * 2, 104, 28);
    c.fillStyle = "#11161dee";
    c.fill();
    c.strokeStyle = "#232d3a";
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = INK;
    c.font = font(42, 600);
    c.fillText(l, PAD + 36, ly + 66, W - PAD * 2 - 72);
  });

  c.fillStyle = accent;
  c.fillRect(PAD, H - 170, 120, 8);
  c.fillStyle = INK;
  c.font = font(40, 700);
  c.fillText(d.footer, PAD, H - 100, W - PAD * 2 - 360);
  c.fillStyle = MUTED;
  c.font = font(32, 600);
  c.textAlign = "right";
  c.fillText(SITE, W - PAD, H - 100);
  c.textAlign = "left";
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((r) => canvas.toBlob((b) => r(b), "image/png"));
}

export type ShareHow = "native" | "web" | "download" | "failed" | "cancelled";

/** True when the person closed the share sheet without picking anything (not a failure). */
function isCancel(e: unknown): boolean {
  const s = e instanceof Error ? `${e.name} ${e.message}` : String(e);
  return /abort|cancel/i.test(s);
}

/** Hands a drawn card to the share sheet (or downloads it). `text` and `url` go with it where the target takes them. */
export async function shareCanvas(canvas: HTMLCanvasElement, name: string, text: string, url?: string): Promise<ShareHow> {
  const file = `${name}.png`;
  try {
    if (isNative()) {
      const [{ Filesystem, Directory }, { Share }] = await Promise.all([import("@capacitor/filesystem"), import("@capacitor/share")]);
      const data = canvas.toDataURL("image/png").split(",")[1] ?? "";
      const { uri } = await Filesystem.writeFile({ path: file, data, directory: Directory.Cache });
      await Share.share({ title: BRAND.name, text, url, files: [uri] });
      return "native";
    }
    const blob = await toBlob(canvas);
    if (!blob) return "failed";
    const f = new File([blob], file, { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [f] })) {
      await nav.share({ files: [f], title: BRAND.name, text: url ? `${text} ${url}` : text });
      return "web";
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    return "download";
  } catch (e) {
    return isCancel(e) ? "cancelled" : "failed";
  }
}

/** Draws the card and opens the share sheet. Returns how it was shared. */
export async function shareCard(d: CardData, name = "liftsmith", o: DrawOptions = {}): Promise<ShareHow> {
  const canvas = document.createElement("canvas");
  drawCard(canvas, d, o);
  return shareCanvas(canvas, name, `${d.headline} · ${d.footer}`);
}
