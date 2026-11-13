/* eslint-disable @next/next/no-img-element -- gym pictures from our own API; the static export has no image optimizer */
"use client";

import { useState } from "react";

import type { Place } from "@/lib/gymDirectory";
import { clockTime, num, t, weekday } from "@/lib/i18n";
import { allDay, parseHours } from "@/lib/openingHours";
import { SITE_URL } from "@/lib/site";

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
      <Section title={t("gp.hours")}>
        <div className="card p-4">
          <Hours raw={place.hours} />
        </div>
      </Section>
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
    </>
  );
}
