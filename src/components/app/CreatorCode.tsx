"use client";

// Entering a code, a creator's or one of our own (docs/decisions/marketing-and-growth.md): in Settings › Redeem a code, and under the
// plans on the paywall and setup's trial step. A code from a link or the Play install referrer arrives by
// itself (creator.ts); this is for iPhone, where the App Store passes nothing, and for anyone who was told
// a code. The code can't change once a trial or subscription has started.
//
// A lifetime code (Melvin, 2026-11-11) is tried first when the lifter is signed in: it gives the account Pro for
// good, whatever the store says, so a trial or subscription doesn't lock it out. Signed out, it's kept and the
// box asks them to sign in; it's redeemed the moment they do (creator.ts `redeemSaved`).
import { useState } from "react";

import { useAccount } from "@/lib/auth";
import { useBilling } from "@/lib/billing";
import { clearCode, codeTrialDays, normalizeCode, redeemLifetime, sendClaim, setCode, useCreator } from "@/lib/creator";
import { t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { useApp } from "@/lib/store";

import { celebratePro } from "./ProWelcome";
import { go } from "./router";
import { Button } from "./ui";

/** True once this lifter has a trial or subscription: the code belongs to it then. */
export function useCodeLocked(): boolean {
  const { profile } = useApp();
  const { live, ent } = useBilling();
  // Any store entitlement, active or lapsed, means a trial or subscription happened under this install.
  if (live) return !!ent && (ent.active || ent.trial || ent.expiresAt != null);
  return !!(profile.pro?.trialStartedAt || profile.pro?.subscribed);
}

export function CreatorCode({ collapsed = false }: { collapsed?: boolean }) {
  const { claim, checking } = useCreator();
  const locked = useCodeLocked();
  const [open, setOpen] = useState(!collapsed || !!claim);
  const [text, setText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signedIn = useAccount((s) => !!s.account);
  const accountPro = useAccount((s) => !!s.account?.pro);
  const days = codeTrialDays(claim);

  if (!open) {
    if (locked && !signedIn) return null;
    return (
      <button type="button" className="press mt-3 min-h-11 w-full text-center text-sm text-accent underline" onClick={() => setOpen(true)}>
        {t("creator.have")}
      </button>
    );
  }

  const apply = async () => {
    setNote(null);
    setDone(null);
    const code = normalizeCode(text);
    if (code && signedIn) {
      // A lifetime code goes straight to the account; any other live code answers "not lifetime" and carries on below.
      setBusy(true);
      const l = await redeemLifetime(code).finally(() => setBusy(false));
      if (l === "ok") {
        setText("");
        setDone(t("creator.lifetimeOk", { code }));
        celebratePro();
        return;
      }
      if (l === "held" || l === "unknown" || l === "ended") {
        oops();
        setNote(l === "held" ? t("creator.lifetimeHeld") : l === "unknown" ? t("creator.unknown", { code }) : t("creator.ended", { code }));
        return;
      }
    }
    const r = setCode(text, "typed", locked);
    if (r === "invalid") {
      oops();
      setNote(t("creator.invalid"));
      return;
    }
    if (r === "locked") {
      oops();
      setNote(claim ? t("creator.locked", { code: claim.code }) : t("creator.lockedNone"));
      return;
    }
    haptic("tick");
    setText("");
    const status = await sendClaim();
    if (status === "unknown" || status === "ended") oops();
    else if (status === "ok") haptic("success");
  };

  const status = !claim
    ? null
    : claim.status === "ok" && claim.kind === "lifetime"
      ? accountPro
        ? t("creator.lifetimeOk", { code: claim.code })
        : t("creator.lifetimeSignIn", { code: claim.code })
      : claim.status === "ok"
        ? days == null
          ? t("creator.okOffer", { code: claim.code })
          : claim.name
            ? t("creator.ok", { code: claim.code, name: claim.name, days })
            : t("creator.okNoName", { code: claim.code, days })
        : claim.status === "unknown"
          ? t("creator.unknown", { code: claim.code })
          : claim.status === "ended"
            ? t("creator.ended", { code: claim.code })
            : t("creator.pending", { code: claim.code });

  return (
    <div className="card mt-3 p-4">
      {!collapsed || !claim ? <p className="text-sm text-muted">{t("creator.note")}</p> : null}
      {status && (
        <p role="status" className={`mt-2 text-sm ${claim?.status === "unknown" || claim?.status === "ended" ? "text-warn" : "text-ink"}`}>
          {status}
        </p>
      )}
      {claim?.kind === "lifetime" && claim.status === "ok" && !signedIn && (
        <Button kind="ghost" className="mt-3 w-full" onClick={() => go("account")}>
          {t("creator.lifetimeSignInButton")}
        </Button>
      )}
      {done && (
        <p role="status" className="mt-2 text-sm text-ink">
          {done}
        </p>
      )}
      {locked && !signedIn ? null : (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={24}
            value={text}
            onChange={(e) => setText(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") void apply();
            }}
            placeholder={t("creator.placeholder")}
            aria-label={t("creator.title")}
            className="card min-h-11 min-w-0 flex-1 px-4 py-2 uppercase"
          />
          <Button kind="ghost" disabled={checking || busy || !text.trim()} onClick={() => void apply()}>
            {t("creator.apply")}
          </Button>
        </div>
      )}
      {claim && !locked && (
        <button
          type="button"
          className="press mt-2 min-h-11 text-sm text-muted underline"
          onClick={() => {
            clearCode(false);
            setNote(null);
          }}
        >
          {t("creator.remove")}
        </button>
      )}
      {locked && !claim && !signedIn && <p className="mt-2 text-sm text-muted">{t("creator.lockedNone")}</p>}
      {note && (
        <p role="status" className="mt-2 text-sm text-warn">
          {note}
        </p>
      )}
    </div>
  );
}
