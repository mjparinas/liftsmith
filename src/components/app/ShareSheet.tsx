"use client";

// The one share sheet for workouts and milestones (Melvin, 2026-11-11). It shows the card exactly as it will
// be shared, lets the lifter pick which moment (when a screen has several), post or story size, and two
// privacy switches: weights (on) and their name (off). Heart rate, body weight, body fat and places are never
// on a card (shareCards.ts). Pure web code, so Android, iOS and the web app get it together; the image goes
// out through shareCanvas (Capacitor Share on the phones, Web Share or a download on the web).
import { useEffect, useMemo, useState } from "react";

import { bodyFor } from "@/components/demo/LiftDemo";
import { track } from "@/lib/analytics";
import { useAccount } from "@/lib/auth";
import { useProMember } from "@/lib/billing";
import { COSMETICS } from "@/lib/game";
import { t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { inviteLink, keptInviteCode, trackInvite, warmInviteCode } from "@/lib/referral";
import { shareText, type Shareable, type ShareContext, type ShareOptions } from "@/lib/shareCards";
import { drawCard, shareCanvas, type CardData, type CardSize } from "@/lib/shareImage";
import { copyText, createLink, deleteLink, linkError, shareUrl, type ShareLink } from "@/lib/shareLinks";
import { socialOn, useSocial } from "@/lib/social";
import { useApp } from "@/lib/store";
import { isTeen } from "@/lib/teen";
import { toast } from "@/lib/toast";

import { go } from "./router";
import { Button, Chip, Sheet, SwitchRow } from "./ui";

const PREFS = "liftsmith.sharePrefs";
interface Prefs {
  size: CardSize;
  weights: boolean;
  name: boolean;
  /** Add the lifter's invite link to what's shared (the invite loop, docs/decisions/growth.md). */
  invite: boolean;
}
const DEFAULTS: Prefs = { size: "post", weights: true, name: false, invite: true };

function loadPrefs(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS) ?? "{}") as Partial<Prefs>;
    return {
      size: p.size === "story" ? "story" : "post",
      weights: typeof p.weights === "boolean" ? p.weights : DEFAULTS.weights,
      name: p.name === true,
      invite: typeof p.invite === "boolean" ? p.invite : DEFAULTS.invite,
    };
  } catch {
    return DEFAULTS;
  }
}
function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREFS, JSON.stringify(p));
  } catch {
    /* private mode: the defaults next time */
  }
}

/** Figure stills by exercise and body, drawn once per app run. */
const stills = new Map<string, Promise<HTMLCanvasElement | null>>();
function still(exerciseId: string, body: "male" | "female") {
  const k = `${exerciseId}:${body}`;
  let p = stills.get(k);
  if (!p) {
    p = import("@/components/demo/still").then((m) => m.figureStill({ exerciseId, body, width: 900, height: 1000 }));
    stills.set(k, p);
  }
  return p;
}

export function ShareSheet({
  open,
  onClose,
  items,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  items: Shareable[];
  initial?: string;
}) {
  return (
    <Sheet open={open && items.length > 0} onClose={onClose} title={t("card.title")}>
      <ShareBody items={items} initial={initial} />
    </Sheet>
  );
}

function ShareBody({ items, initial }: { items: Shareable[]; initial?: string }) {
  const { profile } = useApp();
  const [prefs, setPrefsState] = useState(loadPrefs);
  const [pickId, setPick] = useState(initial ?? items[0]?.id);
  const [figure, setFigure] = useState<{ id: string; c: HTMLCanvasElement | null } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const item = items.find((i) => i.id === pickId) ?? items[0];
  const name = profile.name.trim().slice(0, 40);
  const setPrefs = (p: Partial<Prefs>) => {
    const next = { ...prefs, ...p };
    setPrefsState(next);
    savePrefs(next);
  };
  const opts: ShareOptions = { weights: prefs.weights, name: prefs.name && name ? name : null };
  const body = bodyFor(profile.sex);
  // The invite link rides along for lifters in Friends, never for someone under 18: a card can be posted anywhere,
  // and an invite makes whoever opens it a mutual follow (docs/decisions/growth.md "The invite loop").
  const joined = useSocial((st) => !!st.me?.profile);
  const canInvite = socialOn() && !isTeen(profile) && (joined || !!keptInviteCode());
  useEffect(() => {
    if (canInvite) warmInviteCode();
  }, [canInvite]);

  useEffect(() => {
    if (!item?.figure) return;
    const id = item.figure;
    let live = true;
    void still(id, body).then((c) => live && setFigure({ id, c }));
    return () => {
      live = false;
    };
  }, [item?.figure, body]);

  const fig = item?.figure && figure?.id === item.figure ? figure.c : null;
  const card = item?.card(opts);
  const member = useProMember();
  const canvas = useMemo(() => {
    if (!card || typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    drawCard(c, card, { size: prefs.size, figure: fig, pro: member });
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, prefs.size, prefs.weights, prefs.name, name, fig, member]);
  const src = useMemo(() => {
    try {
      return canvas?.toDataURL("image/png") ?? null;
    } catch {
      return null;
    }
  }, [canvas]);

  if (!item || !card) return null;

  const share = async () => {
    if (!canvas || busy) return;
    setBusy(true);
    haptic("tap");
    const url = canInvite && prefs.invite ? ((await inviteLink()) ?? undefined) : undefined;
    const how = await shareCanvas(canvas, item.file, shareText(card), url);
    setBusy(false);
    if (url && how !== "cancelled" && how !== "failed") trackInvite("card");
    track("feature", { name: "share_card", detail: `${item.kind}:${prefs.size}:${how}` });
    if (how === "failed") oops();
    else if (how !== "cancelled") sound.done();
    setNote(how === "download" ? t("card.saved") : how === "failed" ? t("card.failed") : null);
  };

  return (
    <div>
      {items.length > 1 && (
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-wider text-muted">{t("card.what")}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {items.map((i) => (
              <Chip key={i.id} active={i.id === item.id} onClick={() => setPick(i.id)}>
                {i.label}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}
      <div className="mt-4 flex justify-center">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL drawn on the device
          <img
            src={src}
            alt={t("card.preview", { headline: card.headline })}
            className={`rounded-2xl border border-line shadow-lg ${prefs.size === "story" ? "max-h-[52vh]" : "max-h-[46vh]"} w-auto`}
          />
        ) : (
          <div
            role="img"
            aria-label={t("card.preview", { headline: card.headline })}
            className="flex aspect-[4/5] w-2/3 items-center justify-center rounded-2xl border border-line bg-surface p-4 text-center font-semibold"
          >
            {card.headline}
          </div>
        )}
      </div>
      <fieldset className="mt-4">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted">{t("card.size")}</legend>
        <div className="mt-2 flex gap-2">
          <Chip active={prefs.size === "post"} onClick={() => setPrefs({ size: "post" })}>
            {t("card.post")}
          </Chip>
          <Chip active={prefs.size === "story"} onClick={() => setPrefs({ size: "story" })}>
            {t("card.story")}
          </Chip>
        </div>
      </fieldset>
      <SwitchRow label={t("card.weights")} on={prefs.weights} onChange={(v) => setPrefs({ weights: v })} />
      <SwitchRow
        label={name ? t("card.name", { name }) : t("card.nameNone")}
        on={prefs.name && !!name}
        onChange={(v) => name && setPrefs({ name: v })}
      />
      {canInvite && (
        <SwitchRow label={t("card.invite")} hint={t("card.inviteNote")} on={prefs.invite} onChange={(v) => setPrefs({ invite: v })} />
      )}
      <p className="mt-3 text-xs text-muted">{t("card.privacy")}</p>
      <Button className="mt-4 w-full py-4" icon="share" disabled={busy || !canvas} onClick={() => void share()}>
        {t("card.share")}
      </Button>
      {note && (
        <p className="mt-2 text-center text-sm text-muted" role="status">
          {note}
        </p>
      )}
      <LinkSection key={`${item.id}:${prefs.weights}:${opts.name ?? ""}`} item={item} card={card} figure={fig} />
    </div>
  );
}

/** Step 2 of sharing: turn this card into a public link with a preview (signed in only). */
function LinkSection({ item, card, figure }: { item: Shareable; card: CardData; figure: HTMLCanvasElement | null }) {
  const account = useAccount((s) => s.account);
  const [link, setLink] = useState<ShareLink | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const make = async () => {
    setBusy(true);
    setNote(null);
    haptic("tap");
    try {
      setLink(await createLink(item.kind, card, figure));
      track("feature", { name: "share_link", detail: item.kind });
      sound.done();
    } catch (e) {
      oops();
      setNote(linkError(e));
    } finally {
      setBusy(false);
    }
  };
  // Copied: a toast says so (the sheet's own note sits below the fold). Not copied: show the link to copy by hand.
  const copy = async () => {
    if (!link) return;
    if (await copyText(link.url)) {
      setNote(null);
      haptic("success");
      toast(t("link.copied"));
    } else {
      oops();
      setNote(link.url);
    }
  };
  const remove = async () => {
    if (!link) return;
    setBusy(true);
    try {
      await deleteLink(link.id);
      setLink(null);
      setNote(t("link.deleted"));
    } catch (e) {
      oops();
      setNote(linkError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="mt-6 border-t border-line pt-4" aria-labelledby="share-link-title">
      <h3 id="share-link-title" className="text-xs font-semibold uppercase tracking-wider text-muted">
        {t("link.title")}
      </h3>
      {!account ? (
        <>
          <p className="mt-2 text-sm text-muted">{t("link.signInBody")}</p>
          <Button kind="ghost" className="mt-3 w-full" icon="lock" onClick={() => go("account")}>
            {t("link.signIn")}
          </Button>
        </>
      ) : link ? (
        <>
          <p className="card mt-3 select-all break-all px-4 py-3 text-sm">{link.url}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              kind="ghost"
              icon="link"
              onClick={async () => {
                if (!(await shareUrl(link.url, card.headline))) await copy();
              }}
            >
              {t("link.share")}
            </Button>
            <Button kind="ghost" onClick={copy}>
              {t("link.copy")}
            </Button>
          </div>
          <Button kind="quiet" className="mt-2 w-full" disabled={busy} onClick={() => void remove()}>
            {t("link.delete")}
          </Button>
        </>
      ) : (
        <Button kind="ghost" className="mt-3 w-full" icon="link" disabled={busy} onClick={() => void make()}>
          {busy ? t("link.creating") : t("link.create")}
        </Button>
      )}
      {account && <p className="mt-3 text-xs text-muted">{t("link.note")}</p>}
      {note && (
        <p className="mt-2 text-center text-sm text-muted" role="status">
          {note}
        </p>
      )}
    </section>
  );
}

/** What every card needs from the app: units, level and streak, and an equipped accent colour. */
export function useShareContext(g: ShareContext["game"]): ShareContext {
  const { profile } = useApp();
  return { unit: profile.unit, game: g, accent: COSMETICS.find((c) => c.id === profile.cosmetics?.accent)?.value };
}
