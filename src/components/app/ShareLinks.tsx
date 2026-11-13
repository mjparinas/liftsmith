"use client";

// Account and sync › Your share links: every public share link this account made, to open or delete
// (docs/decisions/sharing.md). Links are made from the share sheet; this is the one place to see them all.
import { useEffect, useState } from "react";

import { date, t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { keepRead, liveRead } from "@/lib/liveRead";
import { deleteLink, linkError, listLinks, type ShareLink } from "@/lib/shareLinks";

import { Icon } from "./icons";

export function ShareLinks() {
  const [links, setLinks] = useState<ShareLink[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    liveRead("share.links", listLinks, (l) => live && setLinks(l)).catch((e: unknown) => live && (setLinks([]), setNote(linkError(e))));
    return () => {
      live = false;
    };
  }, []);
  const remove = async (l: ShareLink) => {
    haptic("tick");
    try {
      await deleteLink(l.id);
      const left = (links ?? []).filter((x) => x.id !== l.id);
      setLinks(left);
      // So the next visit doesn't show it again before the server answers.
      keepRead("share.links", left);
      setNote(t("link.deleted"));
    } catch (e) {
      oops();
      setNote(linkError(e));
    }
  };
  if (links === null) return null;
  return (
    <div>
      <p className="text-sm text-muted">{t("link.yoursHint")}</p>
      <ul className="card mt-3 divide-y divide-line">
        {links.map((l) => (
          <li key={l.id} className="flex items-center gap-2 py-2 pl-4 pr-1">
            <a
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 py-1"
              aria-label={t("link.open", { title: l.title })}
            >
              <span className="block truncate font-medium">{l.title}</span>
              <span className="block truncate text-xs text-muted">
                {date(l.createdAt, { month: "short", day: "numeric", year: "numeric" })} · {l.url.replace(/^https:\/\//, "")}
              </span>
            </a>
            <button
              type="button"
              onClick={() => void remove(l)}
              aria-label={t("link.deleteNamed", { title: l.title })}
              className="press grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted hover:text-ink"
            >
              <Icon name="trash" size={20} />
            </button>
          </li>
        ))}
        {!links.length && <li className="px-4 py-3 text-sm text-muted">{t("link.none")}</li>}
      </ul>
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
    </div>
  );
}
