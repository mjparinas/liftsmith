"use client";

import { useEffect, useState } from "react";

import type { OwnedGym } from "@/lib/gymClaims";
import {
  AMENITIES,
  CURRENCIES,
  currencyFor,
  EXTRA_LIMITS,
  ISSUE_KINDS,
  money,
  PRICE_KINDS,
  type Amenity,
  type Currency,
  type IssueKind,
  type Prices,
} from "@/lib/gymExtras";
import {
  decideTrainer,
  deleteNews,
  fixIssue,
  ownerExtras,
  postNews,
  refreshOutOfOrder,
  reportIssue,
  useOutOfOrder,
  type OwnerExtras,
} from "@/lib/gymExtrasApi";
import { currentLang, date, t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { useApp } from "@/lib/store";
import { EQUIPMENT_LABEL, type Equipment, type Gym } from "@/lib/types";

import { BumpField, Button, Chip, Section, Sheet } from "./ui";

// The owner's page, round 3 (docs/decisions/gyms.md): amenities and prices, announcements to the gym's club, equipment
// lifters reported out of order, and trainers asking to be listed. Saving amenities and prices goes with the page's
// own Save button (GymEdit.tsx); the rest saves as it's tapped.

const input = "card w-full px-4 py-3";
const PRICE_START: Record<Currency, Record<(typeof PRICE_KINDS)[number], number>> = {
  CAD: { day: 15, week: 40, month: 50 },
  USD: { day: 15, week: 40, month: 45 },
  EUR: { day: 12, week: 35, month: 40 },
  GBP: { day: 10, week: 30, month: 35 },
  AUD: { day: 20, week: 50, month: 60 },
  JPY: { day: 2000, week: 6000, month: 8000 },
};

export type PriceDraft = { currency: Currency; day: string; week: string; month: string };

export function priceDraft(gym: OwnedGym): PriceDraft {
  const p = gym.prices;
  const str = (n: number | undefined) => (n === undefined ? "" : String(n));
  return { currency: p?.currency ?? currencyFor(gym.country), day: str(p?.day), week: str(p?.week), month: str(p?.month) };
}

/** The draft as the server takes it: empty boxes left out. */
export function pricesOf(d: PriceDraft): Prices | null {
  const out: Prices = { currency: d.currency };
  for (const k of PRICE_KINDS) {
    const n = Number(d[k].replace(",", "."));
    if (d[k].trim() && Number.isFinite(n) && n >= 0) out[k] = n;
  }
  return PRICE_KINDS.some((k) => out[k] !== undefined) ? out : null;
}

export function AmenitiesSection({
  amenities,
  onAmenities,
  prices,
  onPrices,
}: {
  amenities: Amenity[];
  onAmenities: (a: Amenity[]) => void;
  prices: PriceDraft;
  onPrices: (p: PriceDraft) => void;
}) {
  const step = prices.currency === "JPY" ? 100 : 1;
  return (
    <Section title={t("gp.amenities")}>
      <p className="mb-2 text-sm text-muted">{t("gym.extra.amenNote")}</p>
      <div className="flex flex-wrap gap-2">
        {AMENITIES.map((a) => (
          <Chip
            key={a}
            active={amenities.includes(a)}
            onClick={() =>
              onAmenities(
                amenities.includes(a) ? amenities.filter((x) => x !== a) : AMENITIES.filter((x) => x === a || amenities.includes(x)),
              )
            }
          >
            {t(`gp.amen.${a}`)}
          </Chip>
        ))}
      </div>
      <p className="mt-4 mb-2 text-sm text-muted">{t("gym.extra.pricesNote")}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("gym.extra.currency")}>
        {CURRENCIES.map((c) => (
          <Chip key={c} active={prices.currency === c} onClick={() => onPrices({ ...prices, currency: c })}>
            {c}
          </Chip>
        ))}
      </div>
      <div className="mt-3 grid gap-3">
        {PRICE_KINDS.map((k) => (
          <div key={k}>
            <label htmlFor={`ge-price-${k}`} className="mb-1 block text-sm text-muted">
              {t(`gym.extra.price.${k}`)}
            </label>
            <BumpField
              id={`ge-price-${k}`}
              label={t(`gym.extra.price.${k}`)}
              value={prices[k]}
              onChange={(v) => onPrices({ ...prices, [k]: v })}
              step={step}
              start={PRICE_START[prices.currency][k]}
              max={100_000}
              placeholder={t("gym.extra.priceNone")}
            />
          </div>
        ))}
      </div>
    </Section>
  );
}

/** Announcements, problem reports and trainers for the owner, loaded once the page opens. */
export function OwnerExtrasSections({ gym }: { gym: OwnedGym }) {
  const [data, setData] = useState<OwnerExtras | null>(null);
  const [tries, setTries] = useState(0);
  useEffect(() => {
    let live = true;
    void ownerExtras(gym.id).then((d) => live && setData(d ?? { news: [], issues: [], trainers: [] }));
    return () => {
      live = false;
    };
  }, [gym.id, tries]);
  const reload = () => setTries((n) => n + 1);
  return (
    <>
      <NewsSection gym={gym} news={data?.news ?? []} onChange={reload} />
      <IssuesSection gym={gym} data={data} onChange={reload} />
      <TrainersSection gym={gym} data={data} onChange={reload} />
    </>
  );
}

function NewsSection({ gym, news, onChange }: { gym: OwnedGym; news: OwnerExtras["news"]; onChange: () => void }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const post = async () => {
    if (busy || !text.trim()) return;
    setBusy(true);
    const r = await postNews(gym.id, text.trim());
    setBusy(false);
    if ("error" in r) {
      oops();
      return setStatus(
        t(
          r.error === "slow"
            ? "gym.extra.newsSlow"
            : r.error === "words" || r.error === "link"
              ? "gym.claim.err.words"
              : r.error === "offline"
                ? "gym.near.offline"
                : "gym.near.failed",
        ),
      );
    }
    haptic("success");
    setText("");
    setStatus(r.pushed > 0 ? t("gym.extra.newsSent", { count: r.pushed }) : t("gym.extra.newsPosted"));
    onChange();
  };
  return (
    <Section title={t("gp.newsTitle")}>
      <p className="mb-2 text-sm text-muted">{gym.club ? t("gym.extra.newsNote") : t("gym.extra.newsNoteNoClub")}</p>
      <label htmlFor="ge-news" className="sr-only">
        {t("gym.extra.newsLabel")}
      </label>
      <textarea
        id="ge-news"
        rows={3}
        maxLength={EXTRA_LIMITS.news}
        placeholder={t("gym.extra.newsPlaceholder")}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={input}
      />
      <Button kind="ghost" icon="chat" className="mt-2 w-full" disabled={busy || !text.trim()} onClick={() => void post()}>
        {t("gym.extra.newsPost")}
      </Button>
      {status && (
        <p className="mt-2 text-sm text-muted" role="status">
          {status}
        </p>
      )}
      {news.length > 0 && (
        <ul className="card mt-3 divide-y divide-line">
          {news.map((n) => (
            <li key={n.id} className="flex items-start gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block text-sm break-words">{n.text}</span>
                <span className="block text-xs text-muted">{date(n.at, { month: "short", day: "numeric" })}</span>
              </span>
              <Button
                kind="quiet"
                onClick={() =>
                  void deleteNews(gym.id, n.id).then((ok) => {
                    if (ok) onChange();
                    else oops();
                  })
                }
              >
                {t("gym.extra.newsDelete")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function IssuesSection({ gym, data, onChange }: { gym: OwnedGym; data: OwnerExtras | null; onChange: () => void }) {
  const issues = data?.issues ?? [];
  return (
    <Section title={t("gp.issuesTitle")}>
      {!data ? null : issues.length ? (
        <>
          <p className="mb-2 text-sm text-muted">{t("gym.extra.issuesOwner")}</p>
          <ul className="card divide-y divide-line">
            {issues.map((x) => (
              <li key={x.id} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{EQUIPMENT_LABEL[x.equipment]}</span>
                  <span className="block text-sm text-muted">
                    {t(`gym.extra.kind.${x.kind}`)} · {t("gym.extra.reports", { count: x.reports })} ·{" "}
                    {date(x.at, { month: "short", day: "numeric" })}
                  </span>
                  {x.note && <span className="block text-sm break-words">{x.note}</span>}
                </span>
                <Button
                  kind="ghost"
                  onClick={() =>
                    void fixIssue(gym.id, x.id).then((ok) => {
                      if (ok) {
                        haptic("success");
                        onChange();
                      } else oops();
                    })
                  }
                >
                  {t("gym.extra.fixed")}
                </Button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-muted">{t("gym.extra.issuesNone")}</p>
      )}
    </Section>
  );
}

function TrainersSection({ gym, data, onChange }: { gym: OwnedGym; data: OwnerExtras | null; onChange: () => void }) {
  const trainers = data?.trainers ?? [];
  const decide = (code: string, approve: boolean) =>
    void decideTrainer(gym.id, code, approve).then((ok) => {
      if (ok) {
        haptic(approve ? "success" : "toggle");
        onChange();
      } else oops();
    });
  return (
    <Section title={t("gp.trainersTitle")}>
      <p className="mb-2 text-sm text-muted">{t("gym.extra.trainersOwner")}</p>
      {data && !trainers.length && <p className="text-sm text-muted">{t("gym.extra.trainersNone")}</p>}
      {trainers.length > 0 && (
        <ul className="card divide-y divide-line">
          {trainers.map((x) => (
            <li key={x.code} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{x.name || t("trn.noName")}</span>
                <span className="block text-sm text-muted">
                  {[x.role ? t(`gp.role.${x.role}` as "gp.role.coach") : "", x.status === "pending" ? t("gym.extra.waiting") : ""]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {x.bio && <span className="block text-sm break-words">{x.bio}</span>}
              </span>
              {x.status === "pending" && (
                <Button kind="ghost" onClick={() => decide(x.code, true)}>
                  {t("gym.extra.approve")}
                </Button>
              )}
              <Button kind="quiet" onClick={() => decide(x.code, false)}>
                {t("gym.extra.remove")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** "Day pass $15" lines for the app's gym view, in the app's language. */
export function priceText(prices: Prices): string[] {
  return PRICE_KINDS.flatMap((k) =>
    prices[k] === undefined ? [] : [t(`gp.price.${k}`, { price: money(prices[k], prices.currency, currentLang()) })],
  );
}

/**
 * On one of the lifter's own gyms that is a real gym (Gyms screen): what's reported out of order there, with "It works
 * again", and Report a problem, which takes it out of this lifter's plan at once and everyone else's on their next look.
 */
export function GymProblems({ gym }: { gym: Gym }) {
  const placeId = gym.placeId;
  const issues = useOutOfOrder((s) => (placeId ? s.byPlace[placeId] : undefined)) ?? [];
  const replan = useApp((s) => s.replan);
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<Equipment | null>(null);
  const [kind, setKind] = useState<IssueKind>("broken");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void refreshOutOfOrder(placeId).then((changed) => changed && replan());
  }, [placeId, replan]);
  if (!placeId) return null;
  const send = async () => {
    if (!item || busy) return;
    setBusy(true);
    const r = await reportIssue(placeId, item, kind, note.trim());
    setBusy(false);
    if ("error" in r) {
      oops();
      return setStatus(
        t(
          r.error === "slow"
            ? "gym.extra.reportSlow"
            : r.error === "words" || r.error === "link"
              ? "gym.claim.err.words"
              : r.error === "offline"
                ? "gym.near.offline"
                : "gym.near.failed",
        ),
      );
    }
    haptic("success");
    replan();
    setOpen(false);
    setItem(null);
    setNote("");
    setStatus(t("gym.extra.reported", { item: EQUIPMENT_LABEL[item] }));
  };
  return (
    <Section title={t("gp.issuesTitle")}>
      {issues.length ? (
        <>
          <p className="mb-2 text-sm text-muted">{t("gym.extra.planAround")}</p>
          <ul className="card divide-y divide-line">
            {issues.map((x) => (
              <li key={x.id} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{EQUIPMENT_LABEL[x.equipment]}</span>
                  <span className="block text-sm text-muted">{t(`gym.extra.kind.${x.kind}`)}</span>
                </span>
                <Button
                  kind="ghost"
                  onClick={() =>
                    void fixIssue(placeId, x.id).then((ok) => {
                      if (!ok) return oops();
                      haptic("success");
                      replan();
                    })
                  }
                >
                  {t("gym.extra.works")}
                </Button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mb-2 text-sm text-muted">{t("gym.extra.reportNote")}</p>
      )}
      <Button kind="ghost" icon="flag" className="mt-3 w-full" onClick={() => setOpen(true)}>
        {t("gym.extra.report")}
      </Button>
      {status && (
        <p className="mt-2 text-sm text-muted" role="status">
          {status}
        </p>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title={t("gym.extra.report")}>
        <p className="mb-2 text-sm text-muted">{t("gym.extra.which")}</p>
        <div className="flex flex-wrap gap-2">
          {gym.equipment.map((e) => (
            <Chip key={e} active={item === e} onClick={() => setItem(e)}>
              {EQUIPMENT_LABEL[e]}
            </Chip>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("gym.extra.whatsWrong")}>
          {ISSUE_KINDS.map((k) => (
            <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
              {t(`gym.extra.kind.${k}`)}
            </Chip>
          ))}
        </div>
        <label htmlFor="gp-issue-note" className="mt-4 mb-1 block text-sm text-muted">
          {t("gym.extra.noteLabel")}
        </label>
        <input
          id="gp-issue-note"
          maxLength={EXTRA_LIMITS.issueNote}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={input}
        />
        <Button className="mt-4 w-full" disabled={!item || busy} onClick={() => void send()}>
          {t("gym.extra.send")}
        </Button>
        <p className="mt-2 text-xs text-muted">{t("gym.extra.sendNote")}</p>
      </Sheet>
    </Section>
  );
}
