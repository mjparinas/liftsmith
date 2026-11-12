"use client";

import { useState, type FormEvent } from "react";

import { readAccount } from "@/lib/auth";
import { suggestGym } from "@/lib/gymClaims";
import { t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";

import { go, goBack } from "./router";
import { Button, EmptyState, ScreenHeader } from "./ui";

// "Can't find your gym? Add it" (#/gymadd, docs/decisions/gyms.md). A lifter or owner adds a gym OpenStreetMap doesn't
// have: its name, street address and city. The server finds it on the map and keeps it hidden until staff approve it.
// Needs an account.

const input = "card w-full px-4 py-3";

const errorText = (e: string) =>
  t(
    e === "name" || e === "address" || e === "where" || e === "exists" || e === "slow"
      ? `gym.new.err.${e}`
      : e === "words" || e === "link"
        ? "gym.claim.err.words"
        : e === "offline"
          ? "gym.near.offline"
          : "gym.near.failed",
  );

export function GymAdd() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const header = <ScreenHeader title={t("gym.new.title")} back={{ label: t("gym.back"), onClick: goBack }} />;
  if (!readAccount()?.token)
    return (
      <div className="pb-2">
        {header}
        <EmptyState
          icon="gym"
          title={t("gym.new.signInTitle")}
          body={t("gym.new.signIn")}
          action={<Button onClick={() => go("account")}>{t("gym.list.signInGo")}</Button>}
        />
      </div>
    );
  if (done)
    return (
      <div className="pb-2">
        {header}
        <EmptyState
          icon="clock"
          mascot="happy"
          title={t("gym.new.doneTitle")}
          body={t("gym.new.doneBody", { name: done })}
          action={<Button onClick={() => go("gym")}>{t("remix.back")}</Button>}
        />
      </div>
    );
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const r = await suggestGym({ name: name.trim(), address: address.trim(), city: city.trim() });
    setBusy(false);
    if ("error" in r) {
      oops();
      return setError(errorText(r.error));
    }
    haptic("success");
    setDone(name.trim());
  };
  const field = (id: string, label: string, value: string, set: (v: string) => void, auto: string, max: number) => (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-muted">
        {label}
      </label>
      <input id={id} autoComplete={auto} maxLength={max} value={value} onChange={(e) => set(e.target.value)} className={input} />
    </div>
  );
  return (
    <div className="pb-2">
      {header}
      <section className="card card-tint mt-4 p-4" style={{ ["--tint" as string]: "var(--color-accent)" }}>
        <p className="text-sm">{t("gym.new.why")}</p>
      </section>
      <form className="mt-4 space-y-3" onSubmit={(e) => void submit(e)}>
        {field("new-gym-name", t("gym.new.name"), name, setName, "organization", 80)}
        {field("new-gym-address", t("gym.new.address"), address, setAddress, "street-address", 120)}
        {field("new-gym-city", t("gym.new.city"), city, setCity, "address-level2", 60)}
        <Button className="w-full" disabled={busy || !name.trim() || !address.trim() || !city.trim()} submit>
          {t("gym.new.send")}
        </Button>
        {error && (
          <p className="text-sm text-bad" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
