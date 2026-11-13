/* eslint-disable @next/next/no-img-element -- gym pictures from our own API; the static export has no image optimizer */
"use client";

import { useState } from "react";

import type { Place } from "@/lib/gymDirectory";
import { clockTime, date, num, t, weekday } from "@/lib/i18n";
import { allDay, parseHours } from "@/lib/openingHours";
import { SITE_URL } from "@/lib/site";
import { EQUIPMENT_LABEL } from "@/lib/types";

import { priceText } from "./GymExtras";
import { StarterCard } from "./GymStaff";
import { Icon, type IconName } from "./icons";
import { go } from "./router";
import { Button, Section } from "./ui";

// A real gym's details in its preview (SharedGym.tsx, docs/decisions/gyms.md): how many lifters train there, its
// opening hours, and links to directions, its website and its page on our website. Text is shared with the website's
// gym pages (gp.*).

const time = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return clockTime(h === 24 ? 0 : h!, m!);
};

function Hours({ raw }: { raw: string }) {
  if (!raw) return <p className="text-sm text-muted">{t("gp.hoursNone")}</p>;
  const week = parseHours(raw);
  if (!week) return <p className="text-sm break-words">{raw}</p>;
  if (allDay(week)) return <p className="text-sm">{t("gp.allDay")}</p>;
  // OSM counts Monday first; weekday() counts Sunday as 0.
  return (
    <dl className="divide-y divide-line text-sm">
      {week.map((d, i) => (
        <div key={i} className="flex flex-wrap justify-between gap-x-3 py-1.5">
          <dt className="text-muted">{weekday((i + 1) % 7, "long")}</dt>
          <dd className="num text-right">{d.length ? d.map((r) => r.split("-").map(time).join("–")).join(", ") : t("gp.closed")}</dd>
        </div>
      ))}
    </dl>
  );
}

const link = (href: string, icon: IconName, label: string) => (
  <a href={href} target="_blank" rel="noopener" className="press card flex min-h-11 items-center gap-3 px-4 py-3 text-sm">
    <Icon name={icon} size={18} />
    <span className="flex-1">{label}</span>
    <span aria-hidden className="text-muted">
      ›
    </span>
  </a>
);

/** The gym's map picture (Mapbox, through our server), with the credit Mapbox's terms ask for. Hidden if it fails. */
function MapPicture({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <figure className="mt-3">
      <img
        src={src}
        alt={t("gp.mapAlt", { name })}
        width={640}
        height={320}
        loading="lazy"
        onError={() => setFailed(true)}
        className="card h-auto w-full overflow-hidden p-0"
      />
      <figcaption className="mt-1 text-xs text-faint">{t("gp.mapCredit")}</figcaption>
    </figure>
  );
}

export function PlaceDetails({ place }: { place: Place }) {
  const lifters =
    place.lifters <= 0 ? t("gp.liftersNone") : place.lifters === 1 ? t("gp.lifters1") : t("gp.liftersN", { count: num(place.lifters) });
  const pic = (id: string) => `${SITE_URL}/api/gyms/photo/?id=${id}`;
  return (
    <>
      {place.logo && (
        <img
          src={pic(place.logo)}
          alt={t("gp.logoAlt", { name: place.name })}
          className="mt-3 h-16 w-16 rounded-xl bg-white object-contain"
        />
      )}
      <p className="mt-3 flex items-center gap-2 text-sm text-muted">
        <Icon name="people" size={18} />
        <span>{lifters}</span>
      </p>
      {!!place.news?.length && (
        <Section title={t("gp.newsTitle")}>
          <ul className="card divide-y divide-line">
            {place.news.map((n) => (
              <li key={n.id} className="px-4 py-3">
                <p className="text-sm break-words">{n.text}</p>
                <p className="text-xs text-muted">{date(n.at, { month: "short", day: "numeric" })}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {place.starter && <StarterCard code={place.starter} />}
      <Section title={t("gp.hours")}>
        <div className="card p-4">
          <Hours raw={place.hours} />
        </div>
      </Section>
      {(!!place.amenities?.length || !!place.prices) && (
        <Section title={t("gp.amenities")}>
          <div className="card p-4">
            {place.prices && (
              <ul className="mb-3 grid gap-1 text-sm font-semibold">
                {priceText(place.prices).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            )}
            {!!place.amenities?.length && (
              <ul className="flex flex-wrap gap-2">
                {place.amenities.map((a) => (
                  <li key={a} className="rounded-full border border-line px-3 py-1 text-sm">
                    {t(`gp.amen.${a}`)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>
      )}
      {!!place.issues?.length && (
        <Section title={t("gp.issuesTitle")}>
          <div className="card p-4">
            <ul className="flex flex-wrap gap-2">
              {place.issues.map((x) => (
                <li key={x.id} className="rounded-full border border-line px-3 py-1 text-sm">
                  {t(`gp.issue.${x.kind}`, { item: EQUIPMENT_LABEL[x.equipment] })}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">{t("gp.issuesNote")}</p>
          </div>
        </Section>
      )}
      {place.map && <MapPicture src={`${SITE_URL}${place.map}`} name={place.name} />}
      {!!place.photos?.length && (
        <Section title={t("gp.photos")}>
          <ul className="grid grid-cols-2 gap-2">
            {place.photos.map((id, i) => (
              <li key={id}>
                <img
                  src={pic(id)}
                  alt={t("gp.photoAlt", { n: i + 1, name: place.name })}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-xl object-cover"
                />
              </li>
            ))}
          </ul>
        </Section>
      )}
      <div className="mt-3 grid gap-2">
        {link(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`, "pin", t("gp.directions"))}
        {place.website && link(place.website, "link", t("gp.website"))}
        {place.citySlug && place.slug && link(`${SITE_URL}/gyms/${place.citySlug}/${place.slug}/`, "gym", t("gym.place.page"))}
      </div>
      {place.club && (
        <Section title={t("gp.clubTitle")}>
          <div className="card p-4">
            <p className="text-sm text-muted">{t("gp.clubBody")}</p>
            <Button kind="ghost" icon="trophy" className="mt-3 w-full" onClick={() => go("club", place.club)}>
              {t("gp.clubJoin")}
            </Button>
          </div>
        </Section>
      )}
      {!!place.trainers?.length && (
        <Section title={t("gp.trainersTitle")}>
          <p className="mb-2 text-sm text-muted">{t("gp.trainersBody")}</p>
          <ul className="card divide-y divide-line">
            {place.trainers.map((x) => (
              <li key={x.code} className="px-4 py-3">
                <p className="font-semibold">{x.name}</p>
                {x.role && <p className="text-sm text-muted">{t(`gp.role.${x.role}` as "gp.role.coach")}</p>}
                {x.bio && <p className="mt-1 text-sm break-words">{x.bio}</p>}
                <Button kind="ghost" icon="people" className="mt-2 w-full" onClick={() => go("trainer", x.code)}>
                  {t("gp.trainWith", { name: x.name })}
                </Button>
              </li>
            ))}
          </ul>
          {!place.official && <p className="mt-2 text-xs text-muted">{t("gp.trainersUnofficial")}</p>}
        </Section>
      )}
    </>
  );
}
