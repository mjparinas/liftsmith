"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { parseBackup } from "@/lib/backup";
import { backupJson, saveFile, stamp } from "@/lib/exportData";
import { haptic } from "@/lib/juice";
import { t } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { canPromptInstall, isIos, onInstallChange, promptInstall, storageKept, where, type Where } from "@/lib/saving";
import { STORE_LINKS } from "@/lib/site";
import { useApp } from "@/lib/store";
import { go } from "./router";
import { Button, Section } from "./ui";
import { AccountPanel } from "./Account";
import { useAccount } from "@/lib/auth";

// "Save your progress" (Melvin, 2026-11-09: "it's not clear how to save my information or register").
// These say plainly where the data lives, offer the optional account (backup and sync, Account.tsx), keep
// it from being cleared in a browser (home screen), and move it by file (backup and restore). AGENTS.md "Saving".

const subscribeWhere = (f: () => void) => {
  const mq = window.matchMedia?.("(display-mode: standalone)");
  mq?.addEventListener?.("change", f);
  return () => mq?.removeEventListener?.("change", f);
};
const useWhere = (): Where => useSyncExternalStore(subscribeWhere, where, () => "browser");

/** Where it's saved, and in a browser what can clear it. */
export function SavedWhere() {
  const w = useWhere();
  const account = useAccount((s) => s.account);
  const [kept, setKept] = useState(false);
  useEffect(() => void storageKept().then(setKept), [w]);
  return (
    <div className="space-y-2">
      <p>{w === "native" ? t("save.lead.native") : t("save.lead.web")}</p>
      {account && <p className="text-sm text-muted">{t("save.synced", { email: account.email ?? "" })}</p>}
      {w === "browser" && !account && <p className="text-sm text-muted">{t("save.risk.web")}{isIos() ? ` ${t("save.risk.ios")}` : ""}</p>}
      {w === "installed" && <p className="text-sm text-muted">{t("save.installed")}</p>}
      {w === "browser" && kept && <p className="text-sm text-muted">{t("save.kept")}</p>}
    </div>
  );
}

/** Add to home screen: the browser's own sheet where there is one, otherwise the steps. Browser only. */
export function InstallHelp() {
  const w = useWhere();
  const can = useSyncExternalStore(onInstallChange, canPromptInstall, () => false);
  if (w !== "browser") return null;
  const stores = (STORE_LINKS.googlePlay || STORE_LINKS.appStore) && (
    <p className="mt-2 text-sm text-muted">
      {t("save.app")}{" "}
      {STORE_LINKS.googlePlay && <a className="text-accent underline" href={STORE_LINKS.googlePlay}>{t("save.getAndroid")}</a>}
      {STORE_LINKS.googlePlay && STORE_LINKS.appStore && " · "}
      {STORE_LINKS.appStore && <a className="text-accent underline" href={STORE_LINKS.appStore}>{t("save.getIos")}</a>}
    </p>
  );
  return (
    <div className="mt-3">
      {can ? (
        <Button kind="ghost" className="w-full" onClick={() => void promptInstall().then((ok) => track("feature", { name: "install", detail: ok ? "accepted" : "dismissed" }))}>
          {t("save.install")}
        </Button>
      ) : (
        <p className="card p-4 text-sm">{isIos() ? t("save.install.ios") : t("save.install.other")}</p>
      )}
      {stores}
    </div>
  );
}

/** The setup wizard's last step before the Pro offer. */
export function SaveStep() {
  const account = useAccount((s) => s.account);
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">{t("save.title")}</h1>
      <div className="card mt-6 p-4"><SavedWhere /></div>
      {!account && (
        <div className="mt-4">
          <p className="mb-3 text-sm text-muted">{t("save.accounts")}</p>
          <AccountPanel />
        </div>
      )}
      <InstallHelp />
      <p className="mt-4 text-sm text-muted">{t("save.later")}</p>
    </>
  );
}

/** Settings › Saving and backup: where it lives, the home screen, a backup file and restoring one. */
export function SavingSettings() {
  const { profile, gyms, events, restoreBackup } = useApp();
  const account = useAccount((s) => s.account);
  const input = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);
  const pick = async (f: File | undefined) => {
    if (!f) return;
    const b = parseBackup(await f.text());
    if (!b) {
      haptic("error");
      return setNote(t("save.bad"));
    }
    const added = restoreBackup(b);
    haptic("success");
    track("feature", { name: "restore", detail: added ? "added" : "none" });
    setNote(added ? t("save.restored") : t("save.restored.none"));
  };
  return (
    <div id="saving">
      <Section title={t("save.settings")}>
        <SavedWhere />
        <InstallHelp />
        <p className="mt-3 text-sm text-muted">{t("save.move")}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button kind="ghost" onClick={() => {
            track("feature", { name: "backup", detail: where() });
            void saveFile(`liftsmith-backup-${stamp()}.json`, "application/json", backupJson(profile, gyms, events));
          }}>{t("save.backup")}</Button>
          <Button kind="ghost" onClick={() => input.current?.click()}>{t("save.restore")}</Button>
        </div>
        <input ref={input} type="file" accept=".json,application/json" className="sr-only" aria-label={t("save.restore.file")} tabIndex={-1} onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
        {note && <p className="mt-2 text-sm text-muted" role="status">{note}</p>}
        {!account && (
          <>
            <p className="mt-3 text-xs text-faint">{t("save.accounts")}</p>
            <Button kind="ghost" className="mt-2 w-full" onClick={() => go("account")}>{t("save.signIn")}</Button>
          </>
        )}
      </Section>
    </div>
  );
}

const NUDGE_KEY = "liftsmith.saveNudge";
const noSubscribe = () => () => {};
function nudgeHidden() {
  try {
    return localStorage.getItem(NUDGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Today, in a browser tab only, once there's a workout worth keeping: one line and one way to keep it. */
export function SaveNudge() {
  const w = useWhere();
  const { events } = useApp();
  const stored = useSyncExternalStore(noSubscribe, nudgeHidden, () => true);
  const [dismissed, setDismissed] = useState(false);
  const signedIn = useAccount((s) => !!s.account);
  const hidden = stored || dismissed || signedIn;
  if (w !== "browser" || hidden || !events.some((e) => e.type === "sessionEnd")) return null;
  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(NUDGE_KEY, "1");
    } catch {}
  };
  return (
    <div className="card mt-4 p-4" role="note">
      <p className="font-semibold">{t("save.nudge.title")}</p>
      <p className="mt-1 text-sm text-muted">{t("save.nudge.body")}</p>
      <div className="mt-3 flex gap-2">
        <Button kind="ghost" className="flex-1" onClick={() => go("settings", "saving")}>{t("save.nudge.go")}</Button>
        <Button kind="quiet" onClick={dismiss}>{t("save.nudge.dismiss")}</Button>
      </div>
    </div>
  );
}
