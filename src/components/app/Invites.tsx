"use client";

// The invite loop on screen (docs/decisions/growth.md "The invite loop"): Invite a friend and "Your invites" on
// Friends › People, and Invite a friend in the Done screen's share panel. The reward (a month of Pro each once the
// friend finishes three workouts) is only mentioned while the admin flag is on, and never to anyone under 18.
// Pure web code, so Android, iOS and the web app get it together.
import { useEffect, useState } from "react";

import { date, t } from "@/lib/i18n";
import { inviteUrl } from "@/lib/invite";
import { haptic, oops } from "@/lib/juice";
import {
  inviteCode,
  keptInvites,
  loadInvites,
  rewardOn,
  trackInvite,
  type InviteFriend,
  type InviteFrom,
  type InviteStatus,
} from "@/lib/referral";
import { copyText, shareUrl } from "@/lib/shareLinks";
import { socialError } from "@/lib/social";
import { useApp } from "@/lib/store";
import { isTeen } from "@/lib/teen";

import { Avatar } from "./AvatarFace";
import { Icon } from "./icons";
import { go } from "./router";
import { Button, Section } from "./ui";

/** Whether this lifter hears about the reward: the flag, the server's answer, and never a teen on this device. */
function useRewardOn(status: InviteStatus | null) {
  const { profile } = useApp();
  return rewardOn(status) && !isTeen(profile);
}

/** Shares the lifter's invite link (the system share sheet, or copies it). */
export function useShareInvite(from: InviteFrom) {
  const [note, setNote] = useState<string | null>(null);
  const share = async () => {
    haptic("tick");
    try {
      const url = inviteUrl(await inviteCode());
      trackInvite(from);
      if (await shareUrl(url, t("friends.invite.shareTitle"))) return;
      setNote((await copyText(url)) ? t("link.copied") : url);
    } catch (e) {
      oops();
      setNote(socialError(e));
    }
  };
  return { share, note };
}

function Status({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p role="status" className="mt-2 text-sm text-muted">
      {text}
    </p>
  );
}

/** People › Invite a friend: shares the lifter's invite link. Whoever accepts it and the lifter follow each other. */
export function InviteButton() {
  const { share, note } = useShareInvite("people");
  const [status, setStatus] = useState<InviteStatus | null>(keptInvites);
  const reward = useRewardOn(status);
  useEffect(() => {
    loadInvites(setStatus).catch(() => undefined);
  }, []);
  return (
    <>
      <Button kind="primary" icon="people" className="mt-3 w-full" onClick={() => void share()}>
        {t("friends.invite")}
      </Button>
      <p className="mt-1 px-1 text-xs text-muted">{t("friends.inviteHint")}</p>
      {reward && <p className="mt-1 px-1 text-xs text-muted">{t("friends.invite.reward")}</p>}
      <Status text={note} />
      {status && <YourInvites status={status} reward={reward} />}
    </>
  );
}

/** One line for a friend: done, or how many workouts are left. Never a number without what to do about it. */
function friendLine(f: InviteFriend, needed: number, reward: boolean): string {
  if (!reward) return t("friends.invites.joined");
  if (f.rewarded) return t("friends.invites.paid");
  return t("friends.invites.left", { count: Math.max(0, needed - f.workouts), done: f.workouts, needed });
}

/**
 * Your invites: everyone who joined with the lifter's link, each with how close they are to the month of Pro, and the
 * months earned. Shows nothing until someone has joined either way, so it never adds an empty card.
 */
export function YourInvites({ status, reward }: { status: InviteStatus; reward: boolean }) {
  const { friends, joined, needed } = status;
  if (!friends.length && !joined) return null;
  const left = joined && !joined.rewarded ? Math.max(0, needed - joined.workouts) : 0;
  return (
    <div className="mt-4 text-left">
      <Section title={t("friends.invites.title")} icon="people">
        <div className="card p-4">
          {reward && status.until != null && (
            <p className="font-semibold">
              {t("friends.invites.until", { count: status.months, date: date(status.until, { month: "long", day: "numeric" }) })}
            </p>
          )}
          {reward && status.months >= status.perYear && (
            <p className="mt-1 text-sm text-muted">{t("friends.invites.cap", { count: status.perYear })}</p>
          )}
          {reward && joined && !joined.rewarded && (
            <p className="mt-1 text-sm">{t("friends.invites.yours", { name: joined.name || t("friends.invites.someone"), count: left })}</p>
          )}
          {friends.length > 0 && (
            <ul className={`divide-y divide-line ${reward && (status.until != null || (joined && !joined.rewarded)) ? "mt-3" : ""}`}>
              {friends.map((f, i) => {
                const line = friendLine(f, needed, reward);
                const body = (
                  <>
                    <Avatar name={f.name || "?"} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{f.name || t("friends.invites.someone")}</span>
                      <span className="block text-sm text-muted">{line}</span>
                    </span>
                    {reward && f.rewarded && <Icon name="check" size={18} strokeWidth={2.6} className="shrink-0 text-good" />}
                  </>
                );
                return (
                  <li key={`${f.handle}-${i}`}>
                    {f.handle ? (
                      <button
                        type="button"
                        className="press flex w-full items-center gap-3 py-2 text-left"
                        onClick={() => go("person", f.handle)}
                      >
                        {body}
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 py-2">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {reward && friends.some((f) => !f.rewarded) && <p className="mt-2 text-xs text-muted">{t("friends.invites.why")}</p>}
        </div>
      </Section>
    </div>
  );
}

/** Done › Share or save › Invite a friend to train with you, for lifters in Friends. */
export function DoneInvite() {
  const { share, note } = useShareInvite("done");
  const status = keptInvites();
  const reward = useRewardOn(status);
  return (
    <>
      <Button kind="ghost" icon="people" className="w-full" onClick={() => void share()}>
        {t("friends.invites.done")}
      </Button>
      {reward && <p className="px-1 text-xs text-muted">{t("friends.invite.reward")}</p>}
      <Status text={note} />
    </>
  );
}
