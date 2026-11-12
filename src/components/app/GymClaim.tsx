"use client";

import { useEffect, useState, type FormEvent } from "react";

import { readAccount } from "@/lib/auth";
import { claimWithPosterCode, ownedGyms, ROLES, siteDomain, startClaim, verifyClaim, type Role } from "@/lib/gymClaims";
import { fetchPlace, type Place } from "@/lib/gymDirectory";
import { t } from "@/lib/i18n";
import { confetti, haptic, oops } from "@/lib/juice";

import { go, goBack } from "./router";
import { Button, Chip, EmptyState, ScreenHeader, Section, Skeleton } from "./ui";

// "Is this your gym?" (#/gymclaim/<id>, docs/decisions/gyms.md step 3). An owner, manager or staff member makes a gym
// official: a code to an address at the gym's website domain does it at once; the code printed on our poster or
// stand does too; anything else is checked by our team. Needs an account.

type Step = { kind: "form" } | { kind: "code"; claim: string; email: string } | { kind: "review"; email: string } | { kind: "done" };

const input = "card w-full px-4 py-3";

const errorText = (e: string) =>
  t(
    e === "taken"
      ? "gym.claim.err.taken"
      : e === "email"
        ? "gym.claim.err.email"
        : e === "name" || e === "empty"
          ? "gym.claim.err.name"
          : e === "words" || e === "link"
            ? "gym.claim.err.words"
            : e === "slow" || e === "full"
              ? "gym.claim.err.slow"
              : e === "wrong"
                ? "gym.claim.err.wrong"
                : e === "expired"
                  ? "gym.claim.err.expired"
                  : e === "offline"
                    ? "gym.near.offline"
                    : "gym.near.failed",
  );

export function GymClaim({ id }: { id?: string }) {
  const [place, setPlace] = useState<Place | "gone" | "offline" | null>(null);
  const [step, setStep] = useState<Step>({ kind: "form" });
  const [name, setName] = useState("");
  const [email, setEmail] = useState(readAccount()?.email ?? "");
  const [role, setRole] = useState<Role>("owner");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [code, setCode] = useState("");
  const [poster, setPoster] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    let live = true;
    void fetchPlace(id).then((p) => live && setPlace(p));
    return () => {
      live = false;
    };
  }, [id]);
  const signedIn = !!readAccount()?.token;
  if (!id || place === "gone" || place === "offline")
    return (
      <div className="pt-10">
        <EmptyState icon="gym" title={place === "offline" ? t("gym.near.failed") : t("gp.gone")} body={t("gym.near.offline")} />
      </div>
    );
  if (!place)
    return (
      <div className="grid gap-4 pt-6" role="status" aria-label={t("gym.near.looking")}>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-48" />
      </div>
    );
  const header = <ScreenHeader title={t("gym.claim.title")} kicker={place.name} back={{ label: t("gym.back"), onClick: goBack }} />;
  if (!signedIn)
    return (
      <div className="pb-2">
        {header}
        <EmptyState
          icon="verified"
          title={t("gym.claim.signInTitle")}
          body={t("gym.claim.signIn")}
          action={<Button onClick={() => go("account")}>{t("gym.list.signInGo")}</Button>}
        />
      </div>
    );
  if (place.official && step.kind !== "done")
    return (
      <div className="pb-2">
        {header}
        <EmptyState icon="verified" title={t("gym.claim.err.taken")} body={t("gym.claim.takenBody")} />
      </div>
    );
  const won = () => {
    haptic("celebrate");
    void confetti();
    void ownedGyms(true);
    setStep({ kind: "done" });
  };
  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    await fn().catch(() => setError(t("gym.near.failed")));
    setBusy(false);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const r = await startClaim({ place: place.id, email: email.trim(), role, name: name.trim(), phone: phone.trim(), note: note.trim() });
      if ("error" in r) {
        oops();
        return setError(errorText(r.error));
      }
      haptic("success");
      setStep(r.method === "email" ? { kind: "code", claim: r.claim, email: email.trim() } : { kind: "review", email: email.trim() });
      if (r.devCode) setCode(r.devCode);
    });
  };
  const domain = siteDomain(place.website);

  if (step.kind === "done")
    return (
      <div className="pb-2">
        {header}
        <EmptyState
          icon="verified"
          mascot="cheer"
          title={t("gym.claim.doneTitle", { name: place.name })}
          body={t("gym.claim.doneBody")}
          action={<Button onClick={() => go("gymedit", place.id)}>{t("gym.claim.edit")}</Button>}
        />
      </div>
    );
  if (step.kind === "review")
    return (
      <div className="pb-2">
        {header}
        <EmptyState
          icon="clock"
          title={t("gym.claim.reviewTitle")}
          body={t("gym.claim.reviewBody", { email: step.email })}
          action={<Button onClick={() => go("today")}>{t("remix.back")}</Button>}
        />
      </div>
    );
  if (step.kind === "code")
    return (
      <div className="pb-2">
        {header}
        <form
          className="mt-4 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              const r = await verifyClaim(step.claim, code);
              if ("error" in r) {
                oops();
                return setError(errorText(r.error));
              }
              won();
            });
          }}
        >
          <p className="text-sm text-muted">{t("gym.claim.sent", { email: step.email })}</p>
          <label htmlFor="claim-code" className="block text-sm text-muted">
            {t("account.email.code")}
          </label>
          <input
            id="claim-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="card display w-full px-4 py-3 text-center text-2xl tracking-[0.4em]"
          />
          <Button className="w-full" disabled={code.length !== 6 || busy} submit>
            {t("gym.claim.verify")}
          </Button>
          <Button kind="quiet" className="w-full" onClick={() => setStep({ kind: "form" })}>
            {t("account.email.again")}
          </Button>
          {error && (
            <p className="text-sm text-bad" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    );

  return (
    <div className="pb-2">
      {header}
      <section className="card card-tint mt-4 p-4" style={{ ["--tint" as string]: "var(--color-accent)" }}>
        <p className="text-sm">{t("gym.claim.why")}</p>
      </section>
      <form className="mt-4 space-y-3" onSubmit={submit}>
        <div>
          <label htmlFor="claim-name" className="mb-1 block text-sm text-muted">
            {t("gym.claim.name")}
          </label>
          <input id="claim-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={input} />
        </div>
        <div>
          <p className="mb-1 text-sm text-muted" id="claim-role">
            {t("gym.claim.role")}
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="claim-role">
            {ROLES.map((r) => (
              <Chip key={r} active={role === r} onClick={() => setRole(r)}>
                {t(`gym.claim.role.${r}`)}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="claim-email" className="mb-1 block text-sm text-muted">
            {t("gym.claim.email")}
          </label>
          <input
            id="claim-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
            aria-describedby="claim-email-hint"
          />
          <p id="claim-email-hint" className="mt-1 text-xs text-faint">
            {domain ? t("gym.claim.emailHint", { domain }) : t("gym.claim.emailHintNone")}
          </p>
        </div>
        <div>
          <label htmlFor="claim-phone" className="mb-1 block text-sm text-muted">
            {t("gym.claim.phone")}
          </label>
          <input
            id="claim-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="claim-note" className="mb-1 block text-sm text-muted">
            {t("gym.claim.note")}
          </label>
          <textarea id="claim-note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={input} />
        </div>
        <Button className="w-full" disabled={busy || !name.trim() || !email.trim()} submit>
          {t("gym.claim.send")}
        </Button>
        {error && (
          <p className="text-sm text-bad" role="alert">
            {error}
          </p>
        )}
      </form>

      <Section title={t("gym.claim.posterTitle")}>
        <form
          className="card space-y-2 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              const r = await claimWithPosterCode(place.id, poster);
              if ("error" in r) {
                oops();
                return setError(errorText(r.error));
              }
              won();
            });
          }}
        >
          <label htmlFor="claim-poster" className="block text-sm text-muted">
            {t("gym.claim.posterHint")}
          </label>
          <input
            id="claim-poster"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={9}
            value={poster}
            onChange={(e) => setPoster(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
            className={`${input} display text-center tracking-widest`}
          />
          <Button kind="ghost" className="w-full" disabled={busy || poster.replace(/-/g, "").length !== 8} submit>
            {t("gym.claim.verify")}
          </Button>
        </form>
      </Section>
    </div>
  );
}
