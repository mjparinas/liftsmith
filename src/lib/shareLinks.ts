"use client";

// Public share links, the app side (server: src/server/shareLinks.ts; decision record docs/decisions/sharing.md).
// The card the lifter sees in the share sheet is drawn once more at post size, as a JPEG, and uploaded; the server
// gives back www.getliftsmith.com/w/<id>/, which shows the card and uses it as the link preview.
import { api, AuthError, readAccount } from "./auth";
import { currentLang, t } from "./i18n";
import { isNative } from "./juice";
import type { ShareKind } from "./shareCards";
import { CARD_SIZE, drawCard, type CardData, type DrawOptions } from "./shareImage";

export interface ShareLink {
  id: string;
  kind: ShareKind;
  title: string;
  description: string;
  createdAt: number;
  url: string;
}

/** The line under the title on the page and in previews: the hero number, else the kicker. */
export const linkDescription = (c: CardData) => [c.big?.value, c.kicker].filter(Boolean).join(" · ");

export function linkError(e: unknown): string {
  if (e instanceof AuthError) {
    if (e.message === "offline") return t("link.offline");
    if (e.message === "full") return t("link.full");
    if (e.message === "slow") return t("link.slow");
  }
  return t("link.failed");
}

export async function createLink(kind: ShareKind, card: CardData, figure: DrawOptions["figure"]): Promise<ShareLink> {
  const account = readAccount();
  if (!account) throw new AuthError("signedOut", 401);
  // Links always use the post size: it reads well as a preview in every app.
  const canvas = document.createElement("canvas");
  drawCard(canvas, card, { size: "post", figure });
  const [width, height] = CARD_SIZE.post;
  const image = canvas.toDataURL("image/jpeg", 0.86);
  const { link } = await api<{ link: ShareLink }>("/api/share/", {
    token: account.token,
    body: { kind, title: card.headline, description: linkDescription(card), lang: currentLang(), width, height, image },
  });
  return link;
}

export async function listLinks(): Promise<ShareLink[]> {
  const account = readAccount();
  if (!account) return [];
  const { links } = await api<{ links: ShareLink[] }>("/api/share/", { token: account.token });
  return links;
}

export async function deleteLink(id: string): Promise<void> {
  const account = readAccount();
  if (!account) return;
  await api(`/api/share/?id=${encodeURIComponent(id)}`, { token: account.token, method: "DELETE" });
}

/** Opens the share sheet with just the link (the preview comes from the page). False when there's no sheet. */
export async function shareUrl(url: string, title: string): Promise<boolean> {
  try {
    if (isNative()) {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title, url });
      return true;
    }
    if (navigator.share) {
      await navigator.share({ title, url });
      return true;
    }
  } catch {
    return true; // closed without sharing
  }
  return false;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
