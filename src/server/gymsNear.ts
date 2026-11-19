// The website's /gyms/ page leads with a map of the ten gyms closest to the visitor (Melvin, 2026-11-15: "the main UI
// should be a mapbox map, that detects your location and shows them the closest 10 gyms on the map"). The page stays
// server-drawn HTML (gymPage.ts); this file holds the map section, the one script it runs (public/gyms-near.js, with
// Leaflet copied to public/vendor/leaflet/ by scripts/leaflet.mjs) and the API answer behind it (GET
// /api/gyms/?closest=1). docs/decisions/gyms.md "The gyms page leads with a map".
import type { MsgLang } from "@/lib/messageText";
import { clockAt, openNow, type Clock, type OpenState } from "@/lib/openingHours";

import { hasMap } from "./gymMedia";
import { gymPath, say } from "./gymPage";
import type { Place } from "./gymPlaces";
import { esc, icon } from "./siteFrame";

export { GYMS_INDEX_CSP } from "@/lib/securityHeaders";

export interface Spot {
  lat: number;
  lon: number;
  /** "device": the browser's position (rounded to about 1 km before it's sent); "ip": Vercel's guess from the address. */
  from: "device" | "ip";
  /** The city Vercel names for the address, when it's a guess from there. */
  city?: string;
}

const coord = (raw: string | null, max: number): number | null => {
  if (raw == null || raw.trim() === "") return null;
  const x = Number(raw);
  return Number.isFinite(x) && Math.abs(x) <= max ? x : null;
};

/** The rough spot Vercel works out from the visitor's address (x-vercel-ip-latitude and friends), else null. */
export function ipSpot(h: Headers): Spot | null {
  const lat = coord(h.get("x-vercel-ip-latitude"), 90);
  const lon = coord(h.get("x-vercel-ip-longitude"), 180);
  if (lat == null || lon == null) return null;
  let city = "";
  try {
    city = decodeURIComponent(h.get("x-vercel-ip-city") ?? "").slice(0, 80);
  } catch {
    city = "";
  }
  return { lat, lon, from: "ip", ...(city ? { city } : {}) };
}

export interface NearGym {
  id: string;
  name: string;
  /** "Langley, BC" */
  where: string;
  lat: number;
  lon: number;
  km: number;
  official: boolean;
  path: string;
  /** Open now on the visitor's clock (docs/decisions/gyms.md "Open now"): only when the script sent its time zone,
   *  the hours are readable and the gym is near enough to share that clock. */
  open?: OpenState;
}

/** What the map script gets: where we looked (rounded again, never more exact than it came) and the gyms. */
export function closestReply(spot: Spot | null, places: Place[], clock?: Clock | null): { here: Spot | null; gyms: NearGym[] } {
  const round = (x: number) => Math.round(x * 100) / 100;
  return {
    here: spot ? { ...spot, lat: round(spot.lat), lon: round(spot.lon) } : null,
    gyms: places.map((p) => ({
      id: p.id,
      name: p.name,
      where: [p.address, p.city].filter(Boolean).join(", "),
      lat: p.lat,
      lon: p.lon,
      km: Math.round(p.km * 10) / 10,
      official: p.official,
      path: gymPath(p),
      ...(clock ? openFor(p, clock) : {}),
    })),
  };
}

function openFor(p: Place, clock: Clock): { open?: OpenState } {
  const open = openNow(p.hours, clock, p.km);
  return open ? { open } : {};
}

/** The visitor's clock from the time zone the script sends (an IANA name), or null for a missing or unknown zone. */
export function visitorClock(tz: string | null, now = new Date()): Clock | null {
  if (!tz || tz.length > 64 || !/^[A-Za-z0-9_+\-/]+$/.test(tz)) return null;
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
  } catch {
    return null;
  }
  return clockAt(now, tz);
}

/** The words the script needs, in the page's language (no catalogue ships to the browser). */
export function nearText(lang: MsgLang) {
  return {
    finding: say(lang, "gp.nearFinding"),
    fromIp: say(lang, "gp.nearFromIp"),
    fromIpCity: say(lang, "gp.nearFromIpCity"),
    fromDevice: say(lang, "gp.nearFromDevice"),
    unknown: say(lang, "gp.nearUnknown"),
    denied: say(lang, "gp.nearDenied"),
    none: say(lang, "gp.nearNone"),
    failed: say(lang, "gp.nearFailed"),
    km: say(lang, "gp.nearKm"),
    mi: say(lang, "gp.nearMi"),
    pin: say(lang, "gp.nearPin"),
    official: say(lang, "gp.official"),
    credit: say(lang, "gp.mapCredit"),
    noMatch: say(lang, "gp.searchNone"),
    openNow: say(lang, "gp.openNow"),
    openAllHours: say(lang, "gp.openAllHours"),
    openSoon: say(lang, "gp.openSoon"),
    closedOpens: say(lang, "gp.closedOpens"),
    closedOpensTomorrow: say(lang, "gp.closedOpensTomorrow"),
    closedOpensDay: say(lang, "gp.closedOpensDay"),
    closedNow: say(lang, "gp.closedNow"),
    openNone: say(lang, "gp.openNone"),
  };
}

/**
 * The map section, drawn hidden: the script shows it, so a reader without scripts gets the search and the full
 * directory and never a map that can't load. With no Mapbox token the list of closest gyms still shows, without a map.
 */
export function nearSection(lang: MsgLang): string {
  const map = hasMap() ? `<div class="near-map" id="near-map" role="region" aria-label="${esc(say(lang, "gp.nearMapAlt"))}"></div>` : "";
  return `<section class="card near" id="near" hidden aria-labelledby="near-h" data-map="${hasMap() ? "1" : ""}">
<h2 id="near-h">${esc(say(lang, "gp.nearTitle"))}</h2>
<div class="near-top"><p class="muted small" id="near-status" role="status" aria-live="polite">${esc(say(lang, "gp.nearFinding"))}</p>
<button type="button" class="btn btn-ghost btn-sm" id="near-locate" hidden>${icon("pin", 16)}${esc(say(lang, "gp.nearUse"))}</button></div>
<div class="near-body" id="near-body">${map}<div class="near-side"><button type="button" class="chip" id="near-open" aria-pressed="false" hidden>${esc(say(lang, "gp.openFilter"))}</button>
<p class="muted small" id="near-open-none" hidden>${esc(say(lang, "gp.openNone"))}</p><ol class="list near-list" id="near-list"></ol></div></div>
<script type="application/json" id="near-text">${JSON.stringify(nearText(lang)).replace(/</g, "\\u003c")}</script>
</section>`;
}

/** Leaflet's sheet and our script, both from our own origin. */
export const NEAR_HEAD =
  '<link rel="stylesheet" href="/vendor/leaflet/leaflet.css"><script src="/vendor/leaflet/leaflet.js" defer></script><script src="/gyms-near.js" defer></script>';

export const NEAR_STYLE = `
[hidden]{display:none!important}.near{margin-bottom:16px}.near-top{display:flex;align-items:center;justify-content:space-between;gap:8px 16px;flex-wrap:wrap;margin-bottom:14px}
#near-status{flex:1 1 16rem}.near-top:has(+ .near-body[hidden]){margin-bottom:0}.btn-sm{min-height:44px;padding:0 16px;font-size:.875rem}
.btn-ghost{background:var(--raised);color:var(--ink);border:1px solid var(--line);cursor:pointer;font:inherit;font-weight:700}
.btn-ghost:hover{border-color:var(--accent)}button:focus-visible,input:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
.near-body{display:grid;gap:16px}
.near-map{width:100%;aspect-ratio:4/3;border-radius:12px;overflow:hidden;background:var(--raised);border:1px solid var(--line)}
@media (min-width:960px){.near-body{grid-template-columns:minmax(0,1fr) 340px;align-items:start}.near-map{aspect-ratio:auto;height:520px}
.near-list{max-height:520px;overflow:auto}}
.near-list li a{flex-direction:row;align-items:center;justify-content:flex-start;gap:12px}.near-list .txt{display:flex;flex-direction:column;gap:2px;min-width:0}
.near-list li a:focus-visible{outline-offset:-3px}
.list li.lead a{border-top:0;padding-top:0}.near-side{display:grid;gap:12px;align-content:start;min-width:0}
.chip{justify-self:start;min-height:44px;padding:0 16px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--muted);font:inherit;font-weight:600;cursor:pointer}
.chip[aria-pressed=true]{border-color:var(--accent);color:var(--ink);background:color-mix(in srgb,var(--accent) 18%,var(--surface))}.chip[aria-pressed=true]::before{content:"✓ "}
.near-list .open{font-weight:600;color:var(--muted)}.near-list .open.is-open{color:var(--mint)}.near-list .open.is-soon{color:var(--gold)}.near-list .on{color:var(--accent);font-weight:600}
.gym-pin{display:grid;place-items:center}.gym-pin span{display:grid;place-items:center;width:28px;height:28px;border-radius:14px;
background:var(--accent);color:#06122a;font:700 .8125rem/1 system-ui,sans-serif;border:2px solid #fff;box-shadow:0 2px 8px rgb(0 0 0/.5)}
.leaflet-container{font:inherit;background:var(--raised)}.leaflet-container .leaflet-control-attribution{font-size:.6875rem;background:rgb(8 11 16/.75);color:var(--muted)}
.leaflet-bar{border:1px solid var(--line)!important}.leaflet-bar a{background:var(--surface)!important;color:var(--ink)!important;border-color:var(--line)!important}.leaflet-bar a:hover{background:var(--raised)!important}
.leaflet-bar a{width:44px!important;height:44px!important;line-height:44px!important;font-size:20px!important}
.find{display:grid;gap:6px;margin:0 0 16px}.find label{font-weight:600}
.find input{min-height:48px;width:100%;padding:0 14px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:inherit}
.dir{margin-top:4px}.dir>summary{display:flex;align-items:center;min-height:48px;cursor:pointer;font-weight:700;list-style:none}
.dir>summary::-webkit-details-marker{display:none}.dir>summary::after{content:"›";margin-left:8px;transition:transform .15s}
.dir[open]>summary::after{transform:rotate(90deg)}.dir>.card{margin-top:8px}
`;
