/* eslint-disable @next/next/no-img-element -- the chain's logo from our own API; the static export has no image optimizer */
"use client";

import { useEffect, useMemo, useState } from "react";

import { distanceM } from "@/lib/geo";
import { fetchChain, lastNearby, type GymChain as Chain, type ChainBranch } from "@/lib/gymDirectory";
import { num, t } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";
import { fmtNum } from "@/lib/units";

import { Icon } from "./icons";
import { go } from "./router";
import { Button, EmptyState, ScreenHeader, Section, Skeleton } from "./ui";

// A gym chain's page in the app (#/gymchain/<slug>, docs/decisions/gyms.md "Gym chains"): its shared logo, its website
// and every branch, nearest first when the lifter has looked for gyms before (the spot they last searched from, never a
// new location request). A branch opens its own page (#/gymplace/<id>), where one tap adds it. Text is shared with the
// website's chain pages (gp.chain*).

/** Branches shown at first, and added by each Show more. */
export const CHAIN_PAGE = 50;

type Loaded = { chain: Chain; branches: ChainBranch[] };

/** The branches in the order the page lists them, with how far each is when the last gym search's spot is known. */
export function orderBranches(
  branches: readonly ChainBranch[],
  from: { lat: number; lon: number } | null,
): (ChainBranch & { km?: number })[] {
  if (!from) return [...branches];
  return branches
    .map((b) => ({ ...b, km: Math.round(distanceM(from, b) / 100) / 10 }))
    .sort((a, b) => a.km - b.km || a.name.localeCompare(b.name));
}

export function GymChain({ slug }: { slug?: string }) {
  const [page, setPage] = useState<Loaded | "gone" | "offline" | null>(null);
  const [tries, setTries] = useState(0);
  const [shown, setShown] = useState(CHAIN_PAGE);
  useEffect(() => {
    if (!slug) return;
    let live = true;
    void fetchChain(slug).then((p) => live && setPage(p));
    return () => {
      live = false;
    };
  }, [slug, tries]);
  const from = useMemo(() => lastNearby(), []);
  const list = useMemo(() => (page && typeof page !== "string" ? orderBranches(page.branches, from) : []), [page, from]);
  if (!slug || page === "gone")
    return (
      <div className="pt-10">
        <EmptyState
          icon="gym"
          title={t("gp.gone")}
          body={t("gp.goneBody")}
          action={<Button onClick={() => go("today")}>{t("remix.back")}</Button>}
        />
      </div>
    );
  if (page === "offline")
    return (
      <div className="pt-10">
        <EmptyState
          icon="gym"
          title={t("gym.near.failed")}
          body={t("gym.near.offline")}
          action={<Button onClick={() => setTries((n) => n + 1)}>{t("gym.place.retry")}</Button>}
        />
      </div>
    );
  if (!page)
    return (
      <div className="grid gap-4 pt-6" role="status" aria-label={t("gym.near.looking")}>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  const { chain } = page;
  return (
    <div className="pb-2 desk-col">
      <ScreenHeader title={t("gp.chainTitle", { chain: chain.name })} kicker={t("gp.chainKicker")} />
      <section className="card card-tint mt-4 flex items-center gap-4 p-4" style={{ ["--tint" as string]: "var(--color-accent)" }}>
        {chain.logo && (
          <img
            src={`${SITE_URL}/api/gyms/photo/?id=${chain.logo}`}
            alt={t("gp.chainLogoAlt", { chain: chain.name })}
            className="h-16 w-16 shrink-0 rounded-xl bg-white object-contain"
          />
        )}
        <div className="min-w-0">
          <p className="text-sm text-muted">{t("gp.chainBody", { count: num(page.branches.length) })}</p>
          {from && <p className="mt-1 text-xs text-muted">{t("gp.chainNearest")}</p>}
        </div>
      </section>
      <Section title={t("gp.chainCount", { count: num(page.branches.length) })}>
        <ul className="grid gap-2">
          {list.slice(0, shown).map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => go("gymplace", b.id)}
                className="press card flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 font-semibold break-words">
                    <span className="min-w-0 break-words">{b.name}</span>
                    {b.official && (
                      <span className="inline-flex shrink-0 text-accent">
                        <Icon name="verified" size={18} />
                        <span className="sr-only">{t("gym.place.official")}</span>
                      </span>
                    )}
                  </span>
                  <span className="block text-sm text-muted break-words">
                    {[
                      [b.address, b.city, b.region].filter(Boolean).join(", "),
                      b.km !== undefined ? t("gym.near.away", { km: fmtNum(b.km) }) : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span aria-hidden className="text-muted">
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>
        {list.length > shown && (
          <Button kind="ghost" className="mt-3 w-full" onClick={() => setShown((n) => n + CHAIN_PAGE)}>
            {t("gp.chainMore")}
          </Button>
        )}
      </Section>
      {chain.website && (
        <a
          href={chain.website}
          target="_blank"
          rel="noopener"
          className="press card mt-3 flex min-h-11 items-center gap-3 px-4 py-3 text-sm"
        >
          <Icon name="link" size={18} />
          <span className="flex-1">{t("gp.chainWebsite", { chain: chain.name })}</span>
          <span aria-hidden className="text-muted">
            ›
          </span>
        </a>
      )}
    </div>
  );
}
