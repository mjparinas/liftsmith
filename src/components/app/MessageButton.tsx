"use client";

// Message <name> without leaving the page (Melvin, 2026-11-26: "rather than taking you to a completely new screen to
// chat, it should expand the collapsed messages and open it directly to the coach's chat"; docs/decisions/
// trainer-mode.md "Chat dock, statuses and stickers"). On the desktop layout it opens that person's window in the chat
// dock, with the list expanded; on phones, tablets and in the apps, where there's no dock, the same chat opens in a
// sheet over the page, which closes with back, a swipe down or ✕. Pure web code, so Android, iOS and the web get it
// together. With `team`, the same goes for a school team's chat (Melvin, 2026-11-26: "when the coach clicks on team
// chat, it opens it up in the messages").
import { useState, type ReactNode } from "react";

import { useDesktop } from "@/lib/layout";

import { openInDock, teamWin } from "./ChatDock";
import { ChatThread } from "./CoachChat";
import { TeamChat } from "./TeamChat";
import { Button, Sheet } from "./ui";

export function MessageButton({
  id,
  name,
  children,
  kind,
  className,
  team = false,
}: {
  /** The other person's account id, or the team's id with `team`. */
  id: string;
  /** Their name (or the team's), the dock window's and the sheet's title. */
  name: string;
  /** A team's chat rather than one person's. */
  team?: boolean;
  children: ReactNode;
  kind?: "primary" | "ghost";
  className?: string;
}) {
  const desktop = useDesktop();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        kind={kind}
        className={className}
        icon="chat"
        onClick={() => (desktop ? (team ? openInDock(teamWin(id), name) : openInDock(id)) : setOpen(true))}
      >
        {children}
      </Button>
      {!desktop && (
        <Sheet open={open} onClose={() => setOpen(false)} title={name}>
          <div className="h-[65dvh]">
            {open && (team ? <TeamChat key={id} id={id} mode="dock" /> : <ChatThread key={id} id={id} mode="dock" />)}
          </div>
        </Sheet>
      )}
    </>
  );
}
