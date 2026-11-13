"use client";

// The map of Find gyms near you that the lifter can drag and zoom (Melvin, 2026-11-13: "keep it mapbox"). Mapbox's dark
// or light street map, drawn by Leaflet (about 40 KB, loaded with this file only once a search has gyms to show) from
// tiles passed through our own server, so the Mapbox token never reaches the device (/api/gyms/tile/). Pins are numbered
// like the list; tapping one takes the lifter to that gym's row. docs/decisions/gyms.md "Map of the nearest gyms".
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useRef } from "react";

import { apiUrl } from "@/lib/auth";
import { t } from "@/lib/i18n";

export interface MapPin {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

/** Mapbox's light street map on a light screen, the dark one otherwise. */
const tileStyle = (): "light" | "dark" => {
  const theme = document.documentElement.dataset.theme;
  const light = theme === "light" || (theme === "system" && window.matchMedia?.("(prefers-color-scheme: light)").matches);
  return light ? "light" : "dark";
};

export default function GymsMap({
  pins,
  here,
  onPin,
}: {
  pins: MapPin[];
  here?: { lat: number; lon: number };
  onPin: (id: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const key = pins.map((p) => p.id).join(".");
  useEffect(() => {
    const el = box.current;
    if (!el || !pins.length) return;
    const map = L.map(el, {
      // Scrolling the page past the map shouldn't zoom it: the wheel zooms once the map has been clicked or focused.
      scrollWheelZoom: false,
      zoomSnap: 0.5,
      attributionControl: false,
    });
    L.control.attribution({ prefix: false }).addAttribution(t("gp.mapCredit")).addTo(map);
    L.tileLayer(apiUrl(`/api/gyms/tile/?z={z}&x={x}&y={y}&style=${tileStyle()}`), {
      maxZoom: 18,
      minZoom: 3,
      tileSize: 256,
    }).addTo(map);
    const points: L.LatLngExpression[] = [];
    pins.forEach((p, i) => {
      const at: L.LatLngExpression = [p.lat, p.lon];
      points.push(at);
      L.marker(at, {
        title: p.name,
        alt: t("gym.near.pin", { n: i + 1, name: p.name }),
        keyboard: true,
        icon: L.divIcon({ className: "gym-pin", html: `<span>${i + 1}</span>`, iconSize: [28, 28], iconAnchor: [14, 14] }),
        zIndexOffset: pins.length - i,
      })
        .on("click", () => onPin(p.id))
        .addTo(map);
    });
    if (here) {
      L.circleMarker([here.lat, here.lon], {
        radius: 7,
        weight: 3,
        color: "#fff",
        fillColor: "#38d6e8",
        fillOpacity: 1,
        interactive: false,
      }).addTo(map);
      points.push([here.lat, here.lon]);
    }
    map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15 });
    map.on("focus click", () => map.scrollWheelZoom.enable());
    map.on("blur", () => map.scrollWheelZoom.disable());
    return () => void map.remove();
    // The map is drawn again only when the gyms change, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, here?.lat, here?.lon]);
  return (
    <div
      ref={box}
      data-no-swipe
      role="region"
      aria-label={t("gym.near.mapAlt")}
      className="gyms-map card aspect-[16/9] w-full overflow-hidden p-0"
    />
  );
}
